/* =========================================================================
 * sources.js  —  Fetchers for each wildfire data source. Every function is
 * defensive: a single failing source must never take down the dashboard, so
 * each returns a result object { ok, data, error, source }.
 * ========================================================================= */

async function fetchJSON(url, opts = {}) {
  const res = await fetch(url, opts);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

/* ---------- NIFC / WFIGS active incidents (point locations) ------------- */
async function fetchIncidents() {
  const src = "NIFC incidents";
  try {
    const { west, south, east, north } = bboxAround(
      CONFIG.cabin.lat,
      CONFIG.cabin.lon,
      CONFIG.searchRadiusMiles
    );
    const params = new URLSearchParams({
      where: "1=1",
      geometry: `${west},${south},${east},${north}`,
      geometryType: "esriGeometryEnvelope",
      inSR: "4326",
      spatialRel: "esriSpatialRelIntersects",
      outFields: [
        "IncidentName", "FireDiscoveryDateTime", "DailyAcres",
        "PercentContained", "IncidentTypeCategory", "POOState",
        "POOCounty", "FireCause", "IncidentShortDescription",
      ].join(","),
      returnGeometry: "true",
      outSR: "4326",
      f: "json",
    });
    const data = await fetchJSON(`${CONFIG.sources.nifcIncidents}?${params}`);
    const fires = (data.features || [])
      .map((f) => {
        const a = f.attributes || {};
        const g = f.geometry || {};
        if (g.y == null || g.x == null) return null;
        const dist = haversineMiles(
          CONFIG.cabin.lat, CONFIG.cabin.lon, g.y, g.x
        );
        return {
          id: "nifc:" + (a.IncidentName || g.x + "," + g.y),
          name: a.IncidentName || "Unnamed incident",
          lat: g.y,
          lon: g.x,
          acres: a.DailyAcres,
          contained: a.PercentContained,
          type: a.IncidentTypeCategory,
          county: a.POOCounty,
          state: a.POOState,
          cause: a.FireCause,
          discovered: a.FireDiscoveryDateTime
            ? new Date(a.FireDiscoveryDateTime)
            : null,
          desc: a.IncidentShortDescription,
          distanceMi: dist,
          bearing: bearingDeg(
            CONFIG.cabin.lat, CONFIG.cabin.lon, g.y, g.x
          ),
          source: "NIFC",
        };
      })
      .filter(Boolean)
      .filter((f) => f.distanceMi <= CONFIG.searchRadiusMiles)
      // keep wildfires; drop prescribed/Rx unless that's all there is
      .sort((a, b) => a.distanceMi - b.distanceMi);
    return { ok: true, data: fires, source: src };
  } catch (e) {
    return { ok: false, error: e.message, data: [], source: src };
  }
}

/* ---------- NIFC / WFIGS fire perimeters (polygons) --------------------- */
async function fetchPerimeters() {
  const src = "NIFC perimeters";
  try {
    const { west, south, east, north } = bboxAround(
      CONFIG.cabin.lat,
      CONFIG.cabin.lon,
      CONFIG.searchRadiusMiles
    );
    const params = new URLSearchParams({
      where: "1=1",
      geometry: `${west},${south},${east},${north}`,
      geometryType: "esriGeometryEnvelope",
      inSR: "4326",
      spatialRel: "esriSpatialRelIntersects",
      outFields:
        "poly_IncidentName,attr_IncidentName,poly_GISAcres,attr_PercentContained",
      returnGeometry: "true",
      outSR: "4326",
      f: "geojson",
    });
    const data = await fetchJSON(`${CONFIG.sources.nifcPerimeters}?${params}`);
    const perims = (data.features || [])
      .map((f) => {
        const p = f.properties || {};
        const geom = f.geometry;
        if (!geom) return null;
        // Normalize Polygon / MultiPolygon into an array of rings.
        let rings = [];
        if (geom.type === "Polygon") rings = geom.coordinates;
        else if (geom.type === "MultiPolygon")
          rings = geom.coordinates.flat();
        if (!rings.length) return null;
        const dist = pointToPolygonMiles(
          CONFIG.cabin.lat, CONFIG.cabin.lon, rings
        );
        return {
          id: "perim:" + (p.poly_IncidentName || p.attr_IncidentName || Math.random()),
          name: p.poly_IncidentName || p.attr_IncidentName || "Fire perimeter",
          acres: p.poly_GISAcres,
          contained: p.attr_PercentContained,
          geojson: f,
          edgeDistanceMi: dist,
          source: "NIFC",
        };
      })
      .filter(Boolean)
      .filter((p) => p.edgeDistanceMi <= CONFIG.searchRadiusMiles)
      .sort((a, b) => a.edgeDistanceMi - b.edgeDistanceMi);
    return { ok: true, data: perims, source: src };
  } catch (e) {
    return { ok: false, error: e.message, data: [], source: src };
  }
}

/* ---------- NASA FIRMS satellite hotspots ------------------------------- */
async function fetchFirms() {
  const src = "NASA FIRMS";
  const key = CONFIG.sources.firmsKey && CONFIG.sources.firmsKey.trim();
  if (!key)
    return {
      ok: false,
      needsKey: true,
      error: "No FIRMS MAP_KEY set (add one in Settings).",
      data: [],
      source: src,
    };
  try {
    const { west, south, east, north } = bboxAround(
      CONFIG.cabin.lat,
      CONFIG.cabin.lon,
      CONFIG.searchRadiusMiles
    );
    const area = `${west.toFixed(4)},${south.toFixed(4)},${east.toFixed(
      4
    )},${north.toFixed(4)}`;
    const days = Math.min(CONFIG.firmsDayRange, CONFIG.firmsMaxDayRange);
    const all = [];
    // Query each sensor; merge. Failures on one sensor don't kill the rest.
    await Promise.all(
      CONFIG.sources.firmsSensors.map(async (sensor) => {
        try {
          const url = `${CONFIG.sources.firmsBase}/${key}/${sensor}/${area}/${days}`;
          const res = await fetch(url);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const text = await res.text();
          if (text.includes("Invalid") || text.startsWith("<"))
            throw new Error("FIRMS rejected request (check MAP_KEY)");
          for (const r of parseCSV(text)) {
            const lat = parseFloat(r.latitude);
            const lon = parseFloat(r.longitude);
            if (isNaN(lat) || isNaN(lon)) continue;
            const when = parseFirmsDate(r.acq_date, r.acq_time);
            all.push({
              lat,
              lon,
              sensor,
              confidence: r.confidence,
              frp: parseFloat(r.frp) || 0,
              brightness: parseFloat(r.bright_ti4 || r.brightness) || 0,
              daynight: r.daynight,
              acq: when,
              ageDays: when
                ? (Date.now() - when.getTime()) / 86400000
                : days,
              distanceMi: haversineMiles(
                CONFIG.cabin.lat, CONFIG.cabin.lon, lat, lon
              ),
            });
          }
        } catch (e) {
          console.warn(`FIRMS ${sensor}:`, e.message);
        }
      })
    );
    all.sort((a, b) => a.distanceMi - b.distanceMi);
    return { ok: true, data: all, source: src };
  } catch (e) {
    return { ok: false, error: e.message, data: [], source: src };
  }
}

function parseFirmsDate(dateStr, timeStr) {
  if (!dateStr) return null;
  const t = String(timeStr || "0").padStart(4, "0");
  const iso = `${dateStr}T${t.slice(0, 2)}:${t.slice(2, 4)}:00Z`;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
}

/* ---------- NWS fire-weather alerts + wind ------------------------------ */
async function fetchWeather() {
  const src = "NWS weather";
  const headers = { Accept: "application/geo+json" };
  try {
    const { lat, lon } = CONFIG.cabin;
    // Active alerts at the cabin point (Red Flag Warning, Fire Weather Watch…)
    const alertsData = await fetchJSON(
      `${CONFIG.sources.nwsAlerts}?point=${lat},${lon}`,
      { headers }
    );
    const alerts = (alertsData.features || []).map((f) => {
      const p = f.properties || {};
      return {
        event: p.event,
        severity: p.severity,
        headline: p.headline,
        ends: p.ends || p.expires,
        description: p.description,
        isFireWeather: /fire|red flag|smoke|wind/i.test(p.event || ""),
      };
    });

    // Current/forecast wind via the gridpoint forecast.
    let wind = null;
    try {
      const pt = await fetchJSON(
        `${CONFIG.sources.nwsPoints}/${lat},${lon}`,
        { headers }
      );
      const fcUrl = pt.properties && pt.properties.forecast;
      if (fcUrl) {
        const fc = await fetchJSON(fcUrl, { headers });
        const period =
          fc.properties && fc.properties.periods && fc.properties.periods[0];
        if (period) {
          wind = {
            speed: period.windSpeed,
            from: period.windDirection, // compass the wind is coming FROM
            fromDeg: compassToDeg(period.windDirection),
            short: period.shortForecast,
            temp: period.temperature,
            tempUnit: period.temperatureUnit,
          };
        }
      }
    } catch (e) {
      console.warn("NWS wind:", e.message);
    }

    return { ok: true, data: { alerts, wind }, source: src };
  } catch (e) {
    return {
      ok: false,
      error: e.message,
      data: { alerts: [], wind: null },
      source: src,
    };
  }
}

function compassToDeg(dir) {
  if (!dir) return null;
  const map = {
    N: 0, NNE: 22.5, NE: 45, ENE: 67.5, E: 90, ESE: 112.5, SE: 135,
    SSE: 157.5, S: 180, SSW: 202.5, SW: 225, WSW: 247.5, W: 270,
    WNW: 292.5, NW: 315, NNW: 337.5,
  };
  return map[dir.toUpperCase()] ?? null;
}

/* ---------- One-shot geocode of the cabin address ----------------------- */
async function geocodeCabin() {
  if (CONFIG.cabin.geocoded) return null;
  try {
    const q = encodeURIComponent("137 Bristol Rd, Placerville, CO 81430");
    const url = `${CONFIG.sources.nominatim}?q=${q}&format=jsonv2&limit=1&countrycodes=us`;
    const data = await fetchJSON(url, {
      headers: { Accept: "application/json" },
    });
    if (data && data[0]) {
      return {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon),
        display: data[0].display_name,
      };
    }
  } catch (e) {
    console.warn("Geocode failed (using default):", e.message);
  }
  return null;
}
