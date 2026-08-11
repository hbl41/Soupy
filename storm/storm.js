/* Quad Cities Storm Watch — severe-storm tracker.
 *
 * Sources (all free, keyless, CORS-enabled):
 *   1. NWS alerts (api.weather.gov)  — warnings/watches, storm motion, polygons
 *   2. SPC Day-1 categorical outlook — convective risk band over the point
 *   3. Open-Meteo                    — hourly wind gusts + CAPE from FOUR
 *      independent models (HRRR, GFS, ICON, GEM); spread shown, not averaged
 *   4. NWS hourly forecast           — the official hour-by-hour
 *   5. IEM NEXRAD composite tiles    — animated radar (last ~25 min)
 */
(() => {
  "use strict";

  const POINT = { lat: 41.52, lon: -90.57, label: "Quad Cities (Davenport–Moline)" };
  const ALERT_AREA = "IA,IL";
  const TZ = "America/Chicago";
  const REFRESH_MIN = 5;
  const RINGS_MI = [15, 30, 60];

  const WARNING_TIER = new Set([
    "Tornado Warning", "Severe Thunderstorm Warning",
    "Extreme Wind Warning", "Flash Flood Warning",
  ]);
  const WATCH_TIER = new Set(["Tornado Watch", "Severe Thunderstorm Watch"]);
  const SEVERE_EVENTS = new Set([
    ...WARNING_TIER, ...WATCH_TIER,
    "Flash Flood Watch", "Severe Weather Statement", "Special Weather Statement",
    "High Wind Warning", "Wind Advisory",
  ]);

  const SPC_URL = "https://www.spc.noaa.gov/products/outlook/day1otlk_cat.lyr.geojson";
  const SPC_RANK = { TSTM: 1, MRGL: 2, SLGT: 3, ENH: 4, MDT: 5, HIGH: 6 };
  const MODELS = { hrrr: "gfs_hrrr", gfs: "gfs_seamless", icon: "icon_seamless", gem: "gem_seamless" };
  const KT_TO_MPH = 1.15078;

  // ---- geometry --------------------------------------------------------
  const rad = (d) => (d * Math.PI) / 180;
  function haversineMi(lat1, lon1, lat2, lon2) {
    const a =
      Math.sin(rad(lat2 - lat1) / 2) ** 2 +
      Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lon2 - lon1) / 2) ** 2;
    return 3958.8 * 2 * Math.asin(Math.sqrt(a));
  }
  function bearingDeg(lat1, lon1, lat2, lon2) {
    const x = Math.sin(rad(lon2 - lon1)) * Math.cos(rad(lat2));
    const y =
      Math.cos(rad(lat1)) * Math.sin(rad(lat2)) -
      Math.sin(rad(lat1)) * Math.cos(rad(lat2)) * Math.cos(rad(lon2 - lon1));
    return ((Math.atan2(x, y) * 180) / Math.PI + 360) % 360;
  }
  const COMPASS = "N NNE NE ENE E ESE SE SSE S SSW SW WSW W WNW NW NNW".split(" ");
  const compass = (b) => COMPASS[Math.floor(((b + 11.25) % 360) / 22.5)];
  function pointInRings(lat, lon, rings) {
    let c = 0;
    for (const ring of rings) {
      for (let i = 0; i < ring.length; i++) {
        const [la1, lo1] = ring[i], [la2, lo2] = ring[(i + 1) % ring.length];
        if ((la1 > lat) !== (la2 > lat)) {
          const x = lo1 + ((lat - la1) / (la2 - la1)) * (lo2 - lo1);
          if (x > lon) c++;
        }
      }
    }
    return c % 2 === 1;
  }

  // ---- alert annotation (mirrors noaa_weather.storm) -------------------
  function annotate(feature) {
    const p = feature.properties;
    const params = p.parameters || {};
    const first = (k) => ((params[k] || [])[0] || "").toString();
    const motion = first("eventMotionDescription");
    const m = motion.match(/(\d{1,3})DEG.*?(\d{1,3})KT/);
    const a = {
      id: p.id || feature.id || "",
      sent: p.sent || "",
      event: p.event,
      severity: p.severity,
      messageType: p.messageType,
      headline: p.headline || "",
      areaDesc: p.areaDesc || "",
      expires: p.expires || "",
      maxWindGust: first("maxWindGust"),
      maxHailSize: first("maxHailSize"),
      tornadoDetection: first("tornadoDetection"),
      damageThreat: first("thunderstormDamageThreat"),
      polygon: [],
      geom: null,
    };
    const g = feature.geometry;
    if (g && g.type === "Polygon" && g.coordinates.length) {
      a.polygon = g.coordinates[0].map(([lon, lat]) => [lat, lon]);
    }
    if (a.polygon.length) {
      const inside = pointInRings(POINT.lat, POINT.lon, [a.polygon]);
      const cLat = a.polygon.reduce((s, q) => s + q[0], 0) / a.polygon.length;
      const cLon = a.polygon.reduce((s, q) => s + q[1], 0) / a.polygon.length;
      const dist = inside
        ? 0
        : Math.min(...a.polygon.map((q) => haversineMi(POINT.lat, POINT.lon, q[0], q[1])));
      a.geom = { inside, distMi: Math.round(dist * 10) / 10,
                 bearing: compass(bearingDeg(POINT.lat, POINT.lon, cLat, cLon)) };
      if (m) {
        const heading = (parseInt(m[1], 10) + 180) % 360;
        const speedMph = Math.round(parseInt(m[2], 10) * KT_TO_MPH);
        const toPoint = bearingDeg(cLat, cLon, POINT.lat, POINT.lon);
        const off = Math.abs(((heading - toPoint + 180) % 360) - 180);
        a.geom.heading = compass(heading);
        a.geom.speedMph = speedMph;
        a.geom.approaching = inside || off <= 60;
        if (a.geom.approaching && !inside && speedMph > 0) {
          a.geom.etaMin = Math.round((dist / speedMph) * 60);
        }
      }
    }
    return a;
  }

  // ---- source status ---------------------------------------------------
  const sources = {
    alerts: { name: "NWS alerts (api.weather.gov)" },
    spc: { name: "SPC Day-1 outlook" },
    om: { name: "Open-Meteo 4-model consensus" },
    hourly: { name: "NWS hourly forecast" },
  };
  async function getJSON(key, url) {
    try {
      const r = await fetch(url, { headers: { Accept: "application/geo+json" } });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      sources[key].ok = true;
      sources[key].at = new Date();
      return await r.json();
    } catch (e) {
      sources[key].ok = false;
      sources[key].err = e.message;
      return null;
    }
  }

  // ---- map -------------------------------------------------------------
  let map, overlay, radarFrames = [], radarTimer = null, frameIdx = 0;
  function initMap() {
    map = L.map("map", { zoomControl: true }).setView([POINT.lat, POINT.lon], 8);
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: "&copy; OpenStreetMap, &copy; CARTO", maxZoom: 12,
    }).addTo(map);
    overlay = L.layerGroup().addTo(map);
    L.marker([POINT.lat, POINT.lon]).addTo(map).bindPopup(POINT.label);
    for (const mi of RINGS_MI) {
      L.circle([POINT.lat, POINT.lon], {
        radius: mi * 1609.34, color: "#8b98a9", weight: 1, fill: false, dashArray: "4 6",
      }).addTo(map).bindTooltip(`${mi} mi`, { permanent: false });
    }
    buildRadar();
  }
  function buildRadar() {
    // IEM serves time-lagged composite frames at 5-min steps.
    radarFrames.forEach((f) => map.removeLayer(f));
    if (radarTimer) clearInterval(radarTimer);
    const bust = Math.floor(Date.now() / (5 * 60 * 1000));
    const steps = ["-m25m", "-m20m", "-m15m", "-m10m", "-m05m", ""];
    radarFrames = steps.map((s) =>
      L.tileLayer(
        `https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q-900913${s}/{z}/{x}/{y}.png?_=${bust}`,
        { opacity: 0, maxZoom: 12 }
      ).addTo(map)
    );
    frameIdx = steps.length - 1;
    radarFrames[frameIdx].setOpacity(0.62);
    setRadarMode();
  }
  function setRadarMode() {
    if (radarTimer) clearInterval(radarTimer);
    const animate = document.getElementById("radar-animate").checked;
    if (!animate) {
      radarFrames.forEach((f, i) => f.setOpacity(i === radarFrames.length - 1 ? 0.62 : 0));
      return;
    }
    radarTimer = setInterval(() => {
      radarFrames[frameIdx].setOpacity(0);
      frameIdx = (frameIdx + 1) % radarFrames.length;
      // hold the newest frame a beat longer by double-weighting it
      radarFrames[frameIdx].setOpacity(0.62);
    }, 650);
  }

  const ALERT_STYLE = (ev) =>
    ev === "Tornado Warning"
      ? { color: "#ff3333", cls: "tor" }
      : ev.includes("Flood")
      ? { color: "#3fb950", cls: "flood" }
      : WATCH_TIER.has(ev)
      ? { color: "#d29922", cls: "watchbox" }
      : { color: "#f0883e", cls: "svr" };

  // ---- rendering -------------------------------------------------------
  const $ = (id) => document.getElementById(id);
  const fmtT = (iso) =>
    new Date(iso).toLocaleString("en-US", {
      timeZone: TZ, weekday: "short", hour: "numeric", minute: "2-digit",
    });

  function renderThreat(pointAlerts, areaAlerts, spc) {
    const reasons = [];
    let tier = 0; // 0 clear, 1 watch, 2 elevated, 3 high, 4 critical
    const bump = (t, why) => { tier = Math.max(tier, t); reasons.push(why); };

    for (const a of pointAlerts) {
      if (a.event === "Tornado Warning")
        bump(4, `TORNADO WARNING includes this location (${a.tornadoDetection || "radar"})`);
      else if (WARNING_TIER.has(a.event))
        bump(4, `${a.event} includes this location`);
      else if (WATCH_TIER.has(a.event))
        bump(2, `${a.event} in effect for this location until ${fmtT(a.expires)}`);
    }
    for (const a of areaAlerts) {
      if (!WARNING_TIER.has(a.event) || !a.geom || a.geom.inside) continue;
      if (a.geom.approaching && (a.geom.distMi <= 45 || (a.geom.etaMin ?? 999) <= 60))
        bump(3, `${a.event} ${a.geom.distMi} mi ${a.geom.bearing}, moving ${a.geom.heading} at ${a.geom.speedMph} mph — ~${a.geom.etaMin ?? "?"} min out`);
      else if (a.geom.distMi <= 90)
        bump(2, `${a.event} ${a.geom.distMi} mi to the ${a.geom.bearing}${a.geom.approaching === false ? " (not headed this way)" : ""}`);
    }
    if (spc && spc.rank >= 3) bump(1, `SPC Day-1: ${spc.label} for the Quad Cities`);
    else if (spc && spc.rank > 0) reasons.push(`SPC Day-1: ${spc.label}`);
    if (!reasons.length) reasons.push("No storm alerts in IA/IL and no convective outlook risk.");

    const T = [
      ["ALL CLEAR", "t-clear", "No active storm threat."],
      ["WATCH", "t-watch", "Conditions favor severe storms — stay reachable."],
      ["ELEVATED", "t-elevated", "Severe weather in the region or a watch is in effect."],
      ["HIGH", "t-high", "A warned storm is headed this way. Be ready to shelter."],
      ["TAKE SHELTER", "t-critical", "A warning includes this location RIGHT NOW."],
    ][tier];
    const banner = $("threat-banner");
    banner.className = `threat-banner ${T[1]}`;
    $("threat-level").textContent = T[0];
    $("threat-blurb").textContent = T[2];
    $("threat-detail").textContent = POINT.label;
    $("threat-reasons").innerHTML = reasons.map((r) => `<li>${esc(r)}</li>`).join("");
  }

  const esc = (s) =>
    String(s).replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  function renderAlerts(areaAlerts, fresh) {
    $("alert-area").textContent = `(${ALERT_AREA})`;
    if (!areaAlerts.length) {
      $("alerts-panel").innerHTML = `<p class="hint">No active storm watches or warnings in ${ALERT_AREA}.</p>`;
      return;
    }
    $("alerts-panel").innerHTML = areaAlerts
      .map((a) => {
        const s = ALERT_STYLE(a.event);
        const badge = fresh.new.has(a.id)
          ? `<span class="badge">NEW</span>`
          : fresh.updated.has(a.id)
          ? `<span class="badge upd">UPDATED</span>`
          : "";
        const bits = [];
        if (a.geom) {
          bits.push(a.geom.inside ? "<b>OVERHEAD</b>" : `<b>${a.geom.distMi} mi ${a.geom.bearing}</b>`);
          if (a.geom.heading) bits.push(`moving ${a.geom.heading} @ ${a.geom.speedMph} mph`);
          if (a.geom.etaMin != null) bits.push(`<b>~${a.geom.etaMin} min out</b>`);
          else if (a.geom.approaching === false) bits.push("not headed this way");
        }
        if (a.maxWindGust) bits.push(`gusts ${a.maxWindGust}`);
        if (a.maxHailSize) bits.push(`hail ${a.maxHailSize}"`);
        if (a.tornadoDetection) bits.push(`tornado: ${a.tornadoDetection}`);
        if (a.damageThreat) bits.push(`threat: ${a.damageThreat}`);
        return `<div class="alert ${s.cls}">
          <h3>${badge}${esc(a.event)}</h3>
          <div class="meta">${esc(a.areaDesc)} · until ${fmtT(a.expires)}</div>
          ${bits.length ? `<div class="track">${bits.join(" · ")}</div>` : ""}
        </div>`;
      })
      .join("");
  }

  function renderConsensus(om) {
    if (!om) { $("consensus-panel").textContent = "Unavailable."; return; }
    const h = om.hourly;
    const nowIso = new Date().toLocaleString("sv-SE", { timeZone: TZ }).slice(0, 16).replace(" ", "T");
    const rows = [];
    for (let i = 0; i < h.time.length && rows.length < 18; i++) {
      if (h.time[i] < nowIso) continue;
      const g = {}, capes = [];
      for (const [name, id] of Object.entries(MODELS)) {
        const v = (h[`wind_gusts_10m_${id}`] || [])[i];
        g[name] = v == null ? null : Math.round(v);
        const c = (h[`cape_${id}`] || [])[i];
        if (c != null) capes.push(c);
      }
      const known = Object.values(g).filter((v) => v != null);
      if (!known.length) continue;
      const med = known.sort((a, b) => a - b)[Math.floor(known.length / 2)];
      rows.push({ t: h.time[i], g, min: Math.min(...known), max: Math.max(...known),
                  med, spread: Math.max(...known) - Math.min(...known),
                  cape: capes.length ? Math.round(capes.sort((a, b) => a - b)[Math.floor(capes.length / 2)]) : null });
    }
    const cls = (m) => (m >= 74 ? "g-destructive" : m >= 58 ? "g-damaging" : m >= 39 ? "g-strong" : "g-breeze");
    $("consensus-panel").innerHTML = `<table class="consensus">
      <tr><th>Hour</th><th>HRRR</th><th>GFS</th><th>ICON</th><th>GEM</th><th>Range</th><th>CAPE</th></tr>
      ${rows.map((r) => `<tr class="${cls(r.med)}">
        <td>${r.t.slice(5, 16).replace("T", " ")}</td>
        ${["hrrr", "gfs", "icon", "gem"].map((m) => `<td>${r.g[m] ?? "–"}</td>`).join("")}
        <td class="${r.spread > 20 ? "disagree" : ""}">${r.min}–${r.max}${r.spread > 20 ? " ⚠" : ""}</td>
        <td>${r.cape ?? "–"}</td>
      </tr>`).join("")}
    </table>
    <p class="hint">Yellow ≥39 mph · orange ≥58 (severe) · red ≥74 (derecho-grade). ⚠ = models &gt;20 mph apart.</p>`;
  }

  function renderHourly(hourly) {
    if (!hourly) { $("hourly-panel").textContent = "Unavailable."; return; }
    const periods = hourly.properties.periods.slice(0, 12);
    $("hourly-panel").innerHTML = periods
      .map((p) => `<div class="hourrow">
        <span class="t">${fmtT(p.startTime)}</span>
        <span>${p.temperature}°${p.temperatureUnit}</span>
        <span class="pop">${p.probabilityOfPrecipitation?.value ?? 0}%</span>
        <span>${esc(p.windSpeed)} ${esc(p.windDirection || "")}</span>
        <span class="dim">${esc(p.shortForecast)}</span>
      </div>`)
      .join("");
  }

  function renderSources() {
    $("sources-panel").innerHTML = Object.values(sources)
      .map((s) => `<li><span>${esc(s.name)}</span>
        <span class="${s.ok ? "src-ok" : "src-err"}">
          ${s.ok ? "OK " + s.at.toLocaleTimeString("en-US", { timeZone: TZ }) : esc(s.err || "…")}
        </span></li>`)
      .join("");
  }

  function drawOverlays(areaAlerts, spcGeo) {
    overlay.clearLayers();
    if (spcGeo) {
      L.geoJSON(spcGeo, {
        filter: (f) => (SPC_RANK[f.properties.LABEL] || 0) >= 2,
        style: (f) => ({ color: "#d29922", weight: 1, opacity: 0.5,
                         fillOpacity: 0.03 + 0.025 * (SPC_RANK[f.properties.LABEL] || 0) }),
      }).addTo(overlay);
    }
    for (const a of areaAlerts) {
      if (!a.polygon.length) continue;
      const s = ALERT_STYLE(a.event);
      L.polygon(a.polygon, { color: s.color, weight: 2, fillOpacity: 0.12 })
        .addTo(overlay)
        .bindPopup(`<b>${esc(a.event)}</b><br>${esc(a.headline)}`);
    }
  }

  // ---- notifications ---------------------------------------------------
  function maybeNotify(areaAlerts, pointAlerts, fresh) {
    if (Notification.permission !== "granted") return;
    const pointIds = new Set(pointAlerts.map((a) => a.id));
    for (const a of areaAlerts) {
      const isFresh = fresh.new.has(a.id) || fresh.updated.has(a.id);
      const relevant =
        (WARNING_TIER.has(a.event) || WATCH_TIER.has(a.event)) &&
        (pointIds.has(a.id) || (a.geom && (a.geom.inside || a.geom.distMi <= 75)));
      if (!isFresh || !relevant) continue;
      const where = a.geom
        ? a.geom.inside ? "OVERHEAD" : `${a.geom.distMi} mi ${a.geom.bearing}`
        : "your area";
      new Notification(`${a.event} — ${where}`, {
        body: `${a.headline}${a.geom?.etaMin != null ? ` · ~${a.geom.etaMin} min out` : ""}`,
        tag: a.id,
      });
    }
  }

  // ---- refresh loop ----------------------------------------------------
  let countdownTimer = null, nextAt = 0;
  async function refresh() {
    $("status").textContent = "Refreshing…";
    const pointsKey = "qcstorm-hourly-url";
    let hourlyUrl = localStorage.getItem(pointsKey);
    const [areaGeo, pointGeo, spcGeo, om, hourly] = await Promise.all([
      getJSON("alerts", `https://api.weather.gov/alerts/active?area=${ALERT_AREA}`),
      getJSON("alerts", `https://api.weather.gov/alerts/active?point=${POINT.lat},${POINT.lon}`),
      getJSON("spc", SPC_URL),
      getJSON("om",
        `https://api.open-meteo.com/v1/forecast?latitude=${POINT.lat}&longitude=${POINT.lon}` +
        `&hourly=wind_gusts_10m,cape&models=${Object.values(MODELS).join(",")}` +
        `&forecast_days=2&wind_speed_unit=mph&timezone=auto`),
      hourlyUrl
        ? getJSON("hourly", hourlyUrl)
        : getJSON("hourly", `https://api.weather.gov/points/${POINT.lat},${POINT.lon}`).then(
            async (pts) => {
              if (!pts) return null;
              localStorage.setItem(pointsKey, pts.properties.forecastHourly);
              return getJSON("hourly", pts.properties.forecastHourly);
            }),
    ]);

    const areaAlerts = (areaGeo?.features || [])
      .filter((f) => SEVERE_EVENTS.has(f.properties.event))
      .map(annotate)
      .sort((x, y) => (x.geom?.distMi ?? 9e3) - (y.geom?.distMi ?? 9e3));
    const pointAlerts = (pointGeo?.features || [])
      .filter((f) => SEVERE_EVENTS.has(f.properties.event))
      .map(annotate);

    // NEW / UPDATED against the seen map.
    const seen = JSON.parse(localStorage.getItem("qcstorm-seen") || "{}");
    const fresh = { new: new Set(), updated: new Set() };
    const nextSeen = {};
    for (const a of areaAlerts) {
      if (!a.id) continue;
      nextSeen[a.id] = a.sent;
      if (!(a.id in seen)) fresh.new.add(a.id);
      else if (seen[a.id] !== a.sent) fresh.updated.add(a.id);
    }
    localStorage.setItem("qcstorm-seen", JSON.stringify(nextSeen));

    let spcHere = null;
    if (spcGeo) {
      spcHere = { rank: 0, label: "No thunderstorm outlook" };
      for (const f of spcGeo.features || []) {
        const rank = SPC_RANK[f.properties.LABEL] || 0;
        if (rank <= spcHere.rank) continue;
        const polys = f.geometry.type === "Polygon" ? [f.geometry.coordinates]
          : f.geometry.type === "MultiPolygon" ? f.geometry.coordinates : [];
        for (const rings of polys) {
          if (pointInRings(POINT.lat, POINT.lon,
              rings.map((ring) => ring.map(([lon, lat]) => [lat, lon])))) {
            spcHere = { rank, label: f.properties.LABEL2 || f.properties.LABEL };
            break;
          }
        }
      }
    }

    renderThreat(pointAlerts, areaAlerts, spcHere);
    renderAlerts(areaAlerts, fresh);
    renderConsensus(om);
    renderHourly(hourly);
    renderSources();
    drawOverlays(areaAlerts, spcGeo);
    maybeNotify(areaAlerts, pointAlerts, fresh);
    buildRadar();

    const errs = Object.values(sources).filter((s) => !s.ok).length;
    $("status").textContent = errs
      ? `Updated with ${errs} source error(s)`
      : `Updated ${new Date().toLocaleTimeString("en-US", { timeZone: TZ })} CT`;
    $("status").className = errs ? "status err" : "status";
    nextAt = Date.now() + REFRESH_MIN * 60 * 1000;
  }

  function tickCountdown() {
    const s = Math.max(0, Math.round((nextAt - Date.now()) / 1000));
    $("countdown").textContent = `next in ${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
    if (s === 0) refresh();
  }

  // ---- boot ------------------------------------------------------------
  document.addEventListener("DOMContentLoaded", () => {
    initMap();
    $("refresh-btn").addEventListener("click", refresh);
    $("radar-animate").addEventListener("change", setRadarMode);
    const nbtn = $("notify-btn");
    const syncNbtn = () =>
      (nbtn.className = `btn btn-ghost${Notification.permission === "granted" ? " btn-on" : ""}`);
    nbtn.addEventListener("click", async () => { await Notification.requestPermission(); syncNbtn(); });
    if ("Notification" in window) syncNbtn(); else nbtn.style.display = "none";
    refresh();
    countdownTimer = setInterval(tickCountdown, 1000);
  });
})();
