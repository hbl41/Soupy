/* =========================================================================
 * util.js  —  Geometry / formatting helpers (no external deps).
 * ========================================================================= */

const EARTH_RADIUS_MI = 3958.7613;
const toRad = (d) => (d * Math.PI) / 180;
const toDeg = (r) => (r * 180) / Math.PI;

/* Great-circle distance between two [lat, lon] points, in miles. */
function haversineMiles(aLat, aLon, bLat, bLon) {
  const dLat = toRad(bLat - aLat);
  const dLon = toRad(bLon - aLon);
  const lat1 = toRad(aLat);
  const lat2 = toRad(bLat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_MI * Math.asin(Math.sqrt(h));
}

/* Initial bearing (compass degrees, 0=N) from A to B. */
function bearingDeg(aLat, aLon, bLat, bLon) {
  const dLon = toRad(bLon - aLon);
  const lat1 = toRad(aLat);
  const lat2 = toRad(bLat);
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

/* Compass label for a bearing, e.g. 200 -> "SSW". */
function compass(deg) {
  const dirs = [
    "N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
    "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW",
  ];
  return dirs[Math.round(deg / 22.5) % 16];
}

/* A degree-box (west,south,east,north) around a center for a given radius.
 * Used to build FIRMS / spatial-query bounding boxes. */
function bboxAround(lat, lon, radiusMiles) {
  const dLat = radiusMiles / 69.0; // ~69 mi per degree latitude
  const dLon = radiusMiles / (69.0 * Math.cos(toRad(lat)) || 1e-6);
  return {
    west: lon - dLon,
    south: lat - dLat,
    east: lon + dLon,
    north: lat + dLat,
  };
}

/* Distance from a point to a polygon: nearest distance to any vertex OR
 * segment, returning 0 if the point is inside. Good enough for "how far is
 * the fire edge from the cabin" at these scales. Rings are GeoJSON-style
 * arrays of [lon, lat]. */
function pointToPolygonMiles(lat, lon, rings) {
  if (pointInPolygon(lat, lon, rings)) return 0;
  let best = Infinity;
  for (const ring of rings) {
    for (let i = 0; i < ring.length - 1; i++) {
      const d = pointToSegmentMiles(
        lat, lon,
        ring[i][1], ring[i][0],
        ring[i + 1][1], ring[i + 1][0]
      );
      if (d < best) best = d;
    }
  }
  return best;
}

/* Approximate point-to-segment distance in miles using a local equirect
 * projection (fine for fire-scale distances). */
function pointToSegmentMiles(plat, plon, alat, alon, blat, blon) {
  const latRef = toRad(plat);
  const x = (p) => toRad(p) * Math.cos(latRef) * EARTH_RADIUS_MI;
  const y = (p) => toRad(p) * EARTH_RADIUS_MI;
  const px = x(plon), py = y(plat);
  const ax = x(alon), ay = y(alat);
  const bx = x(blon), by = y(blat);
  const dx = bx - ax, dy = by - ay;
  const len2 = dx * dx + dy * dy;
  let t = len2 ? ((px - ax) * dx + (py - ay) * dy) / len2 : 0;
  t = Math.max(0, Math.min(1, t));
  const cx = ax + t * dx, cy = ay + t * dy;
  return Math.hypot(px - cx, py - cy);
}

/* Standard ray-casting point-in-polygon over the outer ring(s). */
function pointInPolygon(lat, lon, rings) {
  let inside = false;
  for (const ring of rings) {
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const xi = ring[i][0], yi = ring[i][1];
      const xj = ring[j][0], yj = ring[j][1];
      const intersect =
        yi > lat !== yj > lat &&
        lon < ((xj - xi) * (lat - yi)) / (yj - yi || 1e-12) + xi;
      if (intersect) inside = !inside;
    }
  }
  return inside;
}

/* Minimal CSV parser that tolerates quoted fields. Returns array of objects
 * keyed by the header row. */
function parseCSV(text) {
  const rows = [];
  let row = [], field = "", inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQ = false;
      } else field += c;
    } else if (c === '"') inQ = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (field !== "" || row.length) { row.push(field); rows.push(row); }
      row = []; field = "";
      if (c === "\r" && text[i + 1] === "\n") i++;
    } else field += c;
  }
  if (field !== "" || row.length) { row.push(field); rows.push(row); }
  if (!rows.length) return [];
  const header = rows[0].map((h) => h.trim());
  return rows.slice(1).map((r) => {
    const o = {};
    header.forEach((h, idx) => (o[h] = r[idx]));
    return o;
  });
}

function fmtMiles(mi) {
  if (mi == null || !isFinite(mi)) return "—";
  if (mi < 10) return mi.toFixed(1) + " mi";
  return Math.round(mi) + " mi";
}

function fmtAcres(a) {
  if (a == null || a === "" || isNaN(a)) return "—";
  a = Number(a);
  if (a >= 1000) return Math.round(a).toLocaleString() + " ac";
  return a.toFixed(a < 10 ? 1 : 0) + " ac";
}

function timeAgo(date) {
  if (!date) return "";
  const s = (Date.now() - date.getTime()) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return Math.floor(s / 60) + "m ago";
  if (s < 86400) return Math.floor(s / 3600) + "h ago";
  return Math.floor(s / 86400) + "d ago";
}

function escapeHtml(s) {
  return String(s == null ? "" : s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );
}
