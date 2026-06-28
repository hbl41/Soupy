# 🔥 Placerville Wildfire Watch

A live wildfire tracker focused on one question:

> **Is a wildfire getting near my uncle's cabin at 137 Bristol Rd, Placerville, CO?**

It pulls from **multiple independent fire data sources**, plots everything on a
map (with topo + satellite basemaps), measures the distance and direction from
each fire to the cabin, and boils it down to a single color-coded **threat
level** that refreshes automatically.

It's a self-contained static web app — no server, no build step, no API keys
required to get started (one optional free key unlocks satellite hotspots).

---

## What it shows

| Feature | Detail |
| --- | --- |
| **Threat banner** | ALL CLEAR → WATCH → ELEVATED → HIGH → CRITICAL, based on distance to the nearest fire, fire-weather alerts, and wind direction |
| **Distance & bearing** | "8.2 mi to the WNW" — exactly how far and which way the closest fire is |
| **Map** | Cabin pin, range rings (5/15/30/60 mi), fire perimeters, incident markers sized by acreage, and satellite hotspots colored by age |
| **Progression** | Satellite hotspots are colored by detection age (red = fresh, yellow = older) so you can watch the fire's leading edge advance day to day |
| **Fire weather** | NWS Red Flag Warnings / Fire Weather Watches + current wind near the cabin |
| **Nearby fires list** | Every active incident within range, closest first, with size & containment |
| **Auto-refresh** | Re-checks every 5 minutes (configurable) with a live countdown |

## Data sources (the "many sources")

1. **NIFC / WFIGS** (National Interagency Fire Center) — authoritative active
   **incident locations** and **fire perimeters**. No key, CORS-enabled.
2. **NASA FIRMS** — near-real-time **satellite thermal hotspots** from VIIRS
   (Suomi-NPP & NOAA-20) and MODIS. *Requires a free MAP_KEY* (see below).
3. **NWS / NOAA** (api.weather.gov) — **fire-weather alerts** and **wind**.
4. **OpenStreetMap Nominatim** — one-time geocode of the cabin address.

The dashboard also deep-links to **Watch Duty**, **InciWeb**, the **NIFC national
map**, **Colorado COTREX**, and the **San Miguel / Ouray County** emergency pages
for official evacuation orders.

> Every source is independent: if one is down, the rest still work, and the
> "Sources" panel shows the live status of each.

---

## Running it

Because browsers block some data requests from `file://` pages, serve it over
HTTP. Any of these work:

```bash
# Python (built in on most systems)
python3 -m http.server 8000
# then open http://localhost:8000

# or Node
npx serve .
```

### Deploy free on GitHub Pages

1. Push this repo (already on branch `claude/ouray-wildfire-tracker-hd0jff`).
2. Repo **Settings → Pages → Build from branch**, pick the branch, root folder.
3. Open the published URL on any phone or laptop. The `.nojekyll` file is
   already included so the `assets/` folder serves correctly.

---

## Enabling satellite hotspots (optional but recommended)

Satellite hotspots are the earliest signal — they often light up *before* an
incident is formally reported. To turn them on:

1. Get a **free** FIRMS `MAP_KEY`: <https://firms.modaps.eosdis.nasa.gov/api/area/>
2. Open the app → **⚙ Settings** → paste the key → **Save**.

The key is stored only in your browser (`localStorage`); it is never committed
or sent anywhere except NASA's FIRMS API.

---

## Setting the exact cabin location

The app ships with the Placerville community coordinates and tries to geocode
`137 Bristol Rd` automatically on first load. To pin the **exact** spot:

- **Drag the 🏠 marker** on the map to the cabin, **or**
- Enter precise **lat/lon** in **⚙ Settings**.

Either way it's saved in your browser for next time.

---

## How the threat level is decided

```
distance to nearest fire edge ─┐
                               ├─► base level (CRITICAL ≤5mi, HIGH ≤15, ELEVATED ≤30, WATCH ≤60)
fire-weather alert ────────────┤
wind blowing toward cabin ─────┘   modifiers raise it by at most one notch;
                                   CRITICAL is reserved for genuinely close fires
```

- **Perimeter edge** distance is used when a fire polygon is available (more
  accurate than the incident point), falling back to the incident point, then
  to fresh satellite hotspots.
- Wind is compared against the fire→cabin bearing: a fire that's *upwind* and
  being pushed your way nudges the threat up.

Thresholds, refresh rate, search radius, and hotspot day-range are all tunable
in **Settings** (and in `assets/js/config.js`).

---

## File layout

```
index.html              page shell + dashboard markup
assets/css/styles.css   dark dashboard styling
assets/js/config.js     all tunables + cabin location + localStorage
assets/js/util.js       geo math (haversine, bearing, point-in-polygon), CSV
assets/js/sources.js    fetchers for NIFC, FIRMS, NWS, geocoding
assets/js/threat.js     distance + weather → threat level
assets/js/map.js        Leaflet map, markers, rings, hotspot coloring
assets/js/app.js        orchestration, rendering, refresh timer
```

---

## ⚠️ Important

This is an **informational aid, not an official warning system.** Satellite
hotspots can be false positives (e.g. industrial heat), data can lag, and an
empty map is **not** proof of safety. In any emergency, follow official orders
from the **San Miguel County / Ouray County Sheriff**, local fire authorities,
and **InciWeb**. Make sure your uncle is signed up for the county's emergency
alert system (CodeRED / Everbridge).
