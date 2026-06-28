/* =========================================================================
 * config.js  —  Central configuration for the Ouray / Placerville
 *               wildfire tracker.
 *
 * Everything a user might reasonably want to tweak lives here. Runtime
 * overrides (cabin location, FIRMS key, refresh interval) are persisted
 * to localStorage and merged over these defaults on load.
 * ========================================================================= */

const CONFIG = {
  /* ---- The thing we actually care about: the uncle's cabin ------------- */
  cabin: {
    // 137 Bristol Rd, Placerville, CO 81430 (San Miguel County).
    // NOTE: this is the Placerville community centroid used as a safe
    // default — the exact street address could not be geocoded offline.
    // The app tries to geocode the real address on first load, and you can
    // always drag the home marker to the precise spot (it is then saved).
    label: "Uncle's cabin — 137 Bristol Rd, Placerville, CO",
    lat: 38.0211,
    lon: -108.0573,
    geocoded: false, // becomes true once Nominatim resolves the address
  },

  /* ---- Region of interest --------------------------------------------- */
  // Fires are fetched within this radius of the cabin. Placerville sits
  // just west of Ouray County in steep San Juan terrain where fire moves
  // fast, so we cast a wide net and let the threat engine rank by distance.
  searchRadiusMiles: 100,

  // Concentric range rings drawn around the cabin (miles).
  rangeRings: [5, 15, 30, 60],

  /* ---- Threat thresholds (miles to nearest fire edge) ------------------ */
  // Tuned for mountainous wildland-urban-interface terrain.
  threat: {
    critical: 5,   // fire essentially on top of the area
    high: 15,      // close — be ready to go
    elevated: 30,  // watch closely
    watch: 60,     // on the radar
    // beyond `watch` => informational only
  },

  /* ---- Refresh cadence ------------------------------------------------- */
  refreshMinutes: 5,        // incidents/perimeters/alerts
  firmsDayRange: 3,         // how many days of satellite hotspots to show
  firmsMaxDayRange: 7,

  /* ---- Data sources ---------------------------------------------------- */
  sources: {
    // NIFC / WFIGS — authoritative interagency fire data (ArcGIS Online,
    // CORS-enabled, no key required).
    nifcIncidents:
      "https://services3.arcgis.com/T4QMspbfLg3qTGWY/arcgis/rest/services/WFIGS_Incident_Locations_Current/FeatureServer/0/query",
    nifcPerimeters:
      "https://services3.arcgis.com/T4QMspbfLg3qTGWY/arcgis/rest/services/WFIGS_Interagency_Perimeters_Current/FeatureServer/0/query",

    // NASA FIRMS — near-real-time satellite thermal hotspots. Requires a
    // free MAP_KEY from https://firms.modaps.eosdis.nasa.gov/api/area/
    firmsBase: "https://firms.modaps.eosdis.nasa.gov/api/area/csv",
    firmsSensors: ["VIIRS_SNPP_NRT", "VIIRS_NOAA20_NRT", "MODIS_NRT"],
    firmsKey: "", // filled in via Settings, persisted to localStorage

    // NWS / NOAA — fire-weather alerts (Red Flag, etc.) and wind. CORS-ok.
    nwsAlerts: "https://api.weather.gov/alerts/active",
    nwsPoints: "https://api.weather.gov/points",

    // OpenStreetMap Nominatim — one-shot geocode of the cabin address.
    nominatim: "https://nominatim.openstreetmap.org/search",
  },

  // A polite contact string for APIs (NWS asks for one).
  userAgent: "OurayWildfireTracker/1.0 (personal cabin-safety use)",

  /* ---- Helpful human-facing links (no API, just deep links) ----------- */
  referenceLinks: [
    { name: "Watch Duty (live fire app)", url: "https://app.watchduty.org/" },
    { name: "InciWeb incidents", url: "https://inciweb.wildfire.gov/" },
    { name: "NIFC national map", url: "https://maps.nwcg.gov/sa/" },
    { name: "CO COTREX fire map", url: "https://dfpc.colorado.gov/" },
    {
      name: "San Miguel County emergency",
      url: "https://www.sanmiguelcountyco.gov/185/Emergency-Management",
    },
    {
      name: "Ouray County alerts (CodeRED)",
      url: "https://www.ouraycountyco.gov/",
    },
    { name: "NWS Grand Junction", url: "https://www.weather.gov/gjt/" },
  ],
};

/* ---- localStorage overrides -------------------------------------------- */
const STORAGE_KEY = "ouray-wildfire-tracker:settings:v1";

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw);
    if (saved.cabin) Object.assign(CONFIG.cabin, saved.cabin);
    if (typeof saved.firmsKey === "string")
      CONFIG.sources.firmsKey = saved.firmsKey;
    if (saved.refreshMinutes) CONFIG.refreshMinutes = saved.refreshMinutes;
    if (saved.firmsDayRange) CONFIG.firmsDayRange = saved.firmsDayRange;
    if (saved.searchRadiusMiles)
      CONFIG.searchRadiusMiles = saved.searchRadiusMiles;
  } catch (e) {
    console.warn("Could not load saved settings:", e);
  }
}

function saveSettings() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        cabin: CONFIG.cabin,
        firmsKey: CONFIG.sources.firmsKey,
        refreshMinutes: CONFIG.refreshMinutes,
        firmsDayRange: CONFIG.firmsDayRange,
        searchRadiusMiles: CONFIG.searchRadiusMiles,
      })
    );
  } catch (e) {
    console.warn("Could not save settings:", e);
  }
}

loadSettings();
