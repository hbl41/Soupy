/* =========================================================================
 * threat.js  —  Turn raw fire data into a single, honest answer to the
 * question: "Is the fire getting near my uncle?"
 * ========================================================================= */

const THREAT_LEVELS = {
  CRITICAL: { rank: 4, label: "CRITICAL", color: "#c1121f",
    blurb: "Fire is extremely close. Treat evacuation orders as imminent." },
  HIGH: { rank: 3, label: "HIGH", color: "#e85d04",
    blurb: "Fire is close. Be packed and ready to leave." },
  ELEVATED: { rank: 2, label: "ELEVATED", color: "#f3a712",
    blurb: "Active fire in the area. Watch closely and stay informed." },
  WATCH: { rank: 1, label: "WATCH", color: "#3a86ff",
    blurb: "Fire on the radar but not an immediate concern." },
  CLEAR: { rank: 0, label: "ALL CLEAR", color: "#2a9d8f",
    blurb: "No active fires detected near the cabin right now." },
};

/* Classify a single distance (miles) into a base threat level. */
function levelForDistance(mi) {
  const t = CONFIG.threat;
  if (mi <= t.critical) return "CRITICAL";
  if (mi <= t.high) return "HIGH";
  if (mi <= t.elevated) return "ELEVATED";
  if (mi <= t.watch) return "WATCH";
  return null; // outside watch range
}

/* Build the overall assessment from all sources. */
function assessThreat({ incidents, perimeters, firms, weather }) {
  const cabin = CONFIG.cabin;

  // Nearest hard fire edge: prefer perimeter edge distance, then incident
  // point distance, then satellite hotspot distance.
  const candidates = [];

  for (const p of perimeters) {
    candidates.push({
      kind: "perimeter",
      name: p.name,
      distanceMi: p.edgeDistanceMi,
      acres: p.acres,
      contained: p.contained,
    });
  }
  for (const f of incidents) {
    candidates.push({
      kind: "incident",
      name: f.name,
      distanceMi: f.distanceMi,
      bearing: f.bearing,
      acres: f.acres,
      contained: f.contained,
    });
  }
  // Cluster of recent, close hotspots can indicate a fire not yet in NIFC.
  const recentHot = firms.filter((h) => h.ageDays <= 1.5);
  if (recentHot.length) {
    const nearest = recentHot[0];
    candidates.push({
      kind: "satellite",
      name: `${recentHot.length} satellite hotspot(s)`,
      distanceMi: nearest.distanceMi,
      bearing: bearingDeg(cabin.lat, cabin.lon, nearest.lat, nearest.lon),
    });
  }

  candidates.sort((a, b) => a.distanceMi - b.distanceMi);
  const nearest = candidates[0] || null;

  let level = "CLEAR";
  if (nearest) {
    level = levelForDistance(nearest.distanceMi) || "CLEAR";
    // If something is within search radius but beyond "watch", still surface
    // it as WATCH so the user sees it rather than a misleading ALL CLEAR.
    if (level === "CLEAR" && nearest.distanceMi <= CONFIG.searchRadiusMiles)
      level = "WATCH";
  }

  // --- Modifiers -------------------------------------------------------
  const reasons = [];
  if (nearest) {
    reasons.push(
      `Nearest fire activity (${escapeHtml(nearest.name)}) is ${fmtMiles(
        nearest.distanceMi
      )} away${
        nearest.bearing != null
          ? " to the " + compass(nearest.bearing)
          : ""
      }.`
    );
  }

  // Modifiers (fire-weather alert, wind direction) can raise the threat, but
  // only by a single net notch — and they can never manufacture a CRITICAL
  // out of a distant fire. CRITICAL stays reserved for fires that are
  // genuinely close (within the HIGH distance band).
  const baseLevel = level;
  let wantBump = false;

  const fireAlerts = (weather.alerts || []).filter((a) => a.isFireWeather);
  if (fireAlerts.length) {
    if (baseLevel !== "CLEAR") {
      wantBump = true;
      reasons.push(
        `${escapeHtml(
          fireAlerts[0].event
        )} in effect — conditions favor rapid fire spread.`
      );
    } else {
      reasons.push(
        `${escapeHtml(fireAlerts[0].event)} in effect (no nearby fire yet).`
      );
    }
  }

  // Wind direction: is the nearest fire upwind of the cabin (being pushed
  // our way)? Only counts when the fire is at least in the ELEVATED band.
  const wind = weather.wind;
  if (wind && wind.fromDeg != null && nearest && nearest.bearing != null) {
    const blowingToward = (wind.fromDeg + 180) % 360; // heading wind pushes to
    const fireToCabin = (nearest.bearing + 180) % 360; // bearing fire -> cabin
    const diff = angleDiff(blowingToward, fireToCabin);
    if (diff <= 45) {
      reasons.push(
        `Wind from the ${wind.from} (${escapeHtml(
          wind.speed || ""
        )}) is pushing toward the cabin — fire could move this way faster.`
      );
      if (baseLevel !== "CLEAR" && nearest.distanceMi <= CONFIG.threat.elevated)
        wantBump = true;
    } else if (diff >= 135) {
      reasons.push(
        `Wind from the ${wind.from} is pushing fire away from the cabin.`
      );
    }
  }

  if (wantBump) {
    const bumped = bumpLevel(baseLevel);
    // Don't let modifiers fabricate CRITICAL unless the fire is truly close.
    if (
      bumped === "CRITICAL" &&
      (!nearest || nearest.distanceMi > CONFIG.threat.high)
    ) {
      level = "HIGH";
    } else {
      level = bumped;
    }
  }

  if (level === "CLEAR")
    reasons.unshift("No active fires detected within the search radius.");

  return {
    level,
    meta: THREAT_LEVELS[level],
    nearest,
    candidates,
    reasons,
    fireAlerts,
    wind,
    counts: {
      incidents: incidents.length,
      perimeters: perimeters.length,
      hotspots: firms.length,
      recentHotspots: recentHot.length,
    },
  };
}

function bumpLevel(level) {
  const order = ["CLEAR", "WATCH", "ELEVATED", "HIGH", "CRITICAL"];
  const i = order.indexOf(level);
  return order[Math.min(i + 1, order.length - 1)];
}

function angleDiff(a, b) {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}
