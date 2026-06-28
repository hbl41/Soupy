/* =========================================================================
 * app.js  —  Orchestration: kick off geocoding, run all sources on a timer,
 * render the dashboard + map, and keep a live refresh countdown.
 * ========================================================================= */

const App = (() => {
  let refreshTimer = null;
  let countdownTimer = null;
  let nextRefreshAt = 0;
  let lastData = null;

  async function start() {
    MapView.init(refresh); // refresh when the cabin pin is dragged
    bindUI();
    syncSettingsForm();

    // Try to pin the exact address once; fall back silently to default.
    if (!CONFIG.cabin.geocoded) {
      const geo = await geocodeCabin();
      if (geo) {
        CONFIG.cabin.lat = geo.lat;
        CONFIG.cabin.lon = geo.lon;
        CONFIG.cabin.geocoded = true;
        if (geo.display) CONFIG.cabin.label = geo.display;
        saveSettings();
        MapView.recenterCabin();
      }
    }

    await refresh();
    scheduleNext();
  }

  async function refresh() {
    setStatus("Updating…", true);
    const [inc, perim, firms, wx] = await Promise.all([
      fetchIncidents(),
      fetchPerimeters(),
      fetchFirms(),
      fetchWeather(),
    ]);

    const data = {
      incidents: inc.data,
      perimeters: perim.data,
      firms: firms.data,
      weather: wx.data,
      results: { inc, perim, firms, wx },
      updatedAt: new Date(),
    };
    lastData = data;

    // Map
    MapView.renderPerimeters(perim.data);
    MapView.renderIncidents(inc.data);
    MapView.renderHotspots(firms.data);
    if (inc.data.length) MapView.fitToFires(inc.data, perim.data);

    // Threat + panels
    const assessment = assessThreat(data);
    renderThreat(assessment);
    renderFireList(inc.data, perim.data, data.results);
    renderWeather(wx.data);
    renderSourceStatus(data.results, firms);

    setStatus(`Updated ${data.updatedAt.toLocaleTimeString()}`, false);
  }

  /* ---------------- Rendering --------------------------------------- */

  function renderThreat(a) {
    const el = document.getElementById("threat-banner");
    el.style.background = a.meta.color;
    el.querySelector(".threat-level").textContent = a.meta.label;
    el.querySelector(".threat-blurb").textContent = a.meta.blurb;

    const dist = document.getElementById("threat-distance");
    if (a.nearest) {
      dist.innerHTML =
        `<span class="big">${fmtMiles(a.nearest.distanceMi)}</span>` +
        `<span class="sub">to nearest fire activity` +
        (a.nearest.bearing != null
          ? ` (${compass(a.nearest.bearing)})`
          : "") +
        `</span>`;
    } else {
      dist.innerHTML =
        `<span class="big">—</span><span class="sub">no fires in range</span>`;
    }

    const reasons = document.getElementById("threat-reasons");
    reasons.innerHTML = a.reasons
      .map((r) => `<li>${r}</li>`)
      .join("");

    const counts = document.getElementById("threat-counts");
    counts.innerHTML =
      `<span>${a.counts.incidents} incident(s)</span>` +
      `<span>${a.counts.perimeters} perimeter(s)</span>` +
      `<span>${a.counts.hotspots} hotspot(s)</span>` +
      `<span>${a.counts.recentHotspots} fresh (&lt;36h)</span>`;
  }

  function renderFireList(incidents, perims, results) {
    const el = document.getElementById("fire-list");
    const incFailed = results && results.inc && !results.inc.ok;
    const perimFailed = results && results.perim && !results.perim.ok;
    const norm = (s) => String(s || "").trim().toLowerCase();

    // Combine incident points and fire perimeters into one ranked list so the
    // panel is never blank just because one of the two NIFC feeds came back
    // empty. Perimeters are only added when they don't duplicate an incident.
    const rows = [];
    const seen = new Set();
    incidents.forEach((f) => {
      seen.add(norm(f.name));
      rows.push({
        name: f.name, dist: f.distanceMi, bearing: f.bearing,
        acres: f.acres, contained: f.contained, county: f.county,
        cause: f.cause, kind: "incident",
      });
    });
    perims.forEach((p) => {
      if (seen.has(norm(p.name))) return;
      rows.push({
        name: p.name, dist: p.edgeDistanceMi, bearing: null,
        acres: p.acres, contained: p.contained, kind: "perimeter",
      });
    });
    rows.sort((a, b) => a.dist - b.dist);

    if (!rows.length) {
      el.innerHTML =
        incFailed && perimFailed
          ? '<p class="muted">⚠ Couldn\'t reach the NIFC fire feeds right now — will retry on the next update. See <b>Sources</b> below for the error.</p>'
          : '<p class="muted">✅ No active wildfire incidents within ' +
            CONFIG.searchRadiusMiles +
            " miles of the cabin right now.</p>";
      return;
    }

    let html = rows
      .slice(0, 25)
      .map((f) => {
        const lvl = levelForDistance(f.dist) || "WATCH";
        const c = THREAT_LEVELS[lvl].color;
        const dir = f.bearing != null ? " " + compass(f.bearing) : "";
        return `
        <div class="fire-row" style="border-left-color:${c}">
          <div class="fire-row-head">
            <span class="fire-name">${escapeHtml(f.name)}${
          f.kind === "perimeter" ? ' <span class="tag">perimeter</span>' : ""
        }</span>
            <span class="fire-dist" style="color:${c}">${fmtMiles(
          f.dist
        )}${dir}</span>
          </div>
          <div class="fire-row-meta">
            ${fmtAcres(f.acres)}
            ${
              f.contained != null && f.contained !== ""
                ? "· " + f.contained + "% contained"
                : ""
            }
            ${f.county ? "· " + escapeHtml(f.county) + " Co." : ""}
            ${f.cause ? "· " + escapeHtml(f.cause) : ""}
          </div>
        </div>`;
      })
      .join("");
    if (incFailed || perimFailed)
      html =
        '<p class="muted small">⚠ One NIFC feed failed to load; showing what came through.</p>' +
        html;
    el.innerHTML = html;
  }

  function renderWeather(wx) {
    const el = document.getElementById("weather-panel");
    let html = "";
    const fireAlerts = (wx.alerts || []).filter((a) => a.isFireWeather);
    const otherAlerts = (wx.alerts || []).filter((a) => !a.isFireWeather);

    if (fireAlerts.length) {
      html += fireAlerts
        .map(
          (a) => `<div class="alert alert-fire">
            <b>⚠ ${escapeHtml(a.event)}</b>
            <div class="alert-text">${escapeHtml(a.headline || "")}</div>
          </div>`
        )
        .join("");
    }
    if (wx.wind) {
      html += `<div class="wind-box">
        <div><b>Wind:</b> from ${escapeHtml(wx.wind.from || "—")} at ${escapeHtml(
        wx.wind.speed || "—"
      )}</div>
        <div><b>Now:</b> ${escapeHtml(wx.wind.short || "—")} ${
        wx.wind.temp != null
          ? wx.wind.temp + "°" + (wx.wind.tempUnit || "F")
          : ""
      }</div>
      </div>`;
    }
    if (otherAlerts.length) {
      html += `<div class="alert">${otherAlerts
        .map((a) => escapeHtml(a.event))
        .join(", ")}</div>`;
    }
    if (!html)
      html = '<p class="muted">No active fire-weather alerts at the cabin.</p>';
    el.innerHTML = html;
  }

  function renderSourceStatus(results, firms) {
    const el = document.getElementById("source-status");
    const items = [
      { name: "NIFC incidents", r: results.inc },
      { name: "NIFC perimeters", r: results.perim },
      { name: "NASA FIRMS", r: results.firms },
      { name: "NWS weather", r: results.wx },
    ];
    el.innerHTML = items
      .map((it) => {
        const ok = it.r.ok;
        const needsKey = it.r.needsKey;
        const dot = ok ? "ok" : needsKey ? "warn" : "err";
        const count = it.r.data && it.r.data.length != null ? it.r.data.length : "";
        const note = ok
          ? (count === "" ? "ok" : count + " found")
          : needsKey
          ? "needs key"
          : "offline";
        const err =
          !ok && !needsKey && it.r.error
            ? `<div class="src-err">${escapeHtml(it.r.error)}</div>`
            : "";
        return `<div class="src"><span class="dot ${dot}"></span>${escapeHtml(
          it.name
        )} <span class="src-note">${escapeHtml(String(note))}</span></div>${err}`;
      })
      .join("");

    // Reference links
    const links = document.getElementById("ref-links");
    if (links && !links.dataset.filled) {
      links.innerHTML = CONFIG.referenceLinks
        .map(
          (l) =>
            `<a href="${l.url}" target="_blank" rel="noopener">${escapeHtml(
              l.name
            )} ↗</a>`
        )
        .join("");
      links.dataset.filled = "1";
    }
  }

  /* ---------------- Timer / status ---------------------------------- */

  function scheduleNext() {
    clearTimeout(refreshTimer);
    clearInterval(countdownTimer);
    const ms = CONFIG.refreshMinutes * 60000;
    nextRefreshAt = Date.now() + ms;
    refreshTimer = setTimeout(async () => {
      await refresh();
      scheduleNext();
    }, ms);
    countdownTimer = setInterval(updateCountdown, 1000);
    updateCountdown();
  }

  function updateCountdown() {
    const el = document.getElementById("countdown");
    if (!el) return;
    const s = Math.max(0, Math.round((nextRefreshAt - Date.now()) / 1000));
    const m = Math.floor(s / 60);
    el.textContent = `next update in ${m}:${String(s % 60).padStart(2, "0")}`;
  }

  function setStatus(text, busy) {
    const el = document.getElementById("status");
    if (el) el.textContent = text;
    const spin = document.getElementById("refresh-btn");
    if (spin) spin.classList.toggle("busy", !!busy);
  }

  /* ---------------- UI wiring --------------------------------------- */

  function bindUI() {
    document.getElementById("refresh-btn").addEventListener("click", async () => {
      await refresh();
      scheduleNext();
    });

    const dlg = document.getElementById("settings");
    document
      .getElementById("settings-btn")
      .addEventListener("click", () => dlg.showModal());
    document
      .getElementById("settings-close")
      .addEventListener("click", () => dlg.close());

    document.getElementById("settings-save").addEventListener("click", (e) => {
      e.preventDefault();
      const key = document.getElementById("set-firms").value.trim();
      const rm = parseInt(document.getElementById("set-refresh").value, 10);
      const dr = parseInt(document.getElementById("set-days").value, 10);
      const rad = parseInt(document.getElementById("set-radius").value, 10);
      const lat = parseFloat(document.getElementById("set-lat").value);
      const lon = parseFloat(document.getElementById("set-lon").value);
      CONFIG.sources.firmsKey = key;
      if (rm >= 1) CONFIG.refreshMinutes = rm;
      if (dr >= 1) CONFIG.firmsDayRange = Math.min(dr, CONFIG.firmsMaxDayRange);
      if (rad >= 5) CONFIG.searchRadiusMiles = rad;
      if (!isNaN(lat) && !isNaN(lon)) {
        CONFIG.cabin.lat = lat;
        CONFIG.cabin.lon = lon;
        CONFIG.cabin.geocoded = true;
      }
      saveSettings();
      MapView.recenterCabin();
      dlg.close();
      refresh().then(scheduleNext);
    });
  }

  function syncSettingsForm() {
    document.getElementById("set-firms").value = CONFIG.sources.firmsKey || "";
    document.getElementById("set-refresh").value = CONFIG.refreshMinutes;
    document.getElementById("set-days").value = CONFIG.firmsDayRange;
    document.getElementById("set-radius").value = CONFIG.searchRadiusMiles;
    document.getElementById("set-lat").value = CONFIG.cabin.lat.toFixed(5);
    document.getElementById("set-lon").value = CONFIG.cabin.lon.toFixed(5);
  }

  return { start };
})();

window.addEventListener("DOMContentLoaded", () => App.start());
