/* =========================================================================
 * map.js  —  Leaflet map: basemaps, cabin marker, range rings, fire
 * perimeters, incident markers, and FIRMS hotspots (colored by age to show
 * progression over time).
 * ========================================================================= */

const MapView = (() => {
  let map;
  let cabinMarker;
  const layers = {
    rings: null,
    perimeters: null,
    incidents: null,
    hotspots: null,
  };
  let onCabinMoved = null;

  function init(onMove) {
    onCabinMoved = onMove;

    const topo = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
      { attribution: "Tiles © Esri", maxZoom: 19 }
    );
    const sat = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      { attribution: "Imagery © Esri", maxZoom: 19 }
    );
    const osm = L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      { attribution: "© OpenStreetMap", maxZoom: 19 }
    );

    map = L.map("map", {
      center: [CONFIG.cabin.lat, CONFIG.cabin.lon],
      zoom: 9,
      layers: [topo],
    });

    L.control
      .layers(
        { Topographic: topo, Satellite: sat, Streets: osm },
        {},
        { position: "topright" }
      )
      .addTo(map);

    layers.rings = L.layerGroup().addTo(map);
    layers.perimeters = L.geoJSON(null, {
      style: { color: "#c1121f", weight: 2, fillColor: "#e85d04", fillOpacity: 0.25 },
    }).addTo(map);
    layers.incidents = L.layerGroup().addTo(map);
    layers.hotspots = L.layerGroup().addTo(map);

    L.control.scale({ imperial: true, metric: false }).addTo(map);

    placeCabin();
    drawRings();
  }

  function placeCabin() {
    const icon = L.divIcon({
      className: "cabin-icon",
      html: '<div class="cabin-pin" title="Cabin">🏠</div>',
      iconSize: [34, 34],
      iconAnchor: [17, 30],
    });
    cabinMarker = L.marker([CONFIG.cabin.lat, CONFIG.cabin.lon], {
      icon,
      draggable: true,
      zIndexOffset: 1000,
    }).addTo(map);
    cabinMarker.bindPopup(
      `<b>${escapeHtml(CONFIG.cabin.label)}</b><br>` +
        `<small>Drag this pin to set the exact location.</small>`
    );
    cabinMarker.on("dragend", () => {
      const { lat, lng } = cabinMarker.getLatLng();
      CONFIG.cabin.lat = lat;
      CONFIG.cabin.lon = lng;
      CONFIG.cabin.geocoded = true;
      saveSettings();
      drawRings();
      if (onCabinMoved) onCabinMoved();
    });
  }

  function recenterCabin() {
    cabinMarker.setLatLng([CONFIG.cabin.lat, CONFIG.cabin.lon]);
    map.setView([CONFIG.cabin.lat, CONFIG.cabin.lon], map.getZoom());
    drawRings();
  }

  function drawRings() {
    layers.rings.clearLayers();
    CONFIG.rangeRings.forEach((mi) => {
      const circle = L.circle([CONFIG.cabin.lat, CONFIG.cabin.lon], {
        radius: mi * 1609.34,
        color: "#5b6472",
        weight: 1,
        dashArray: "4 6",
        fill: false,
        interactive: false,
      }).addTo(layers.rings);
      // ring label
      const labelPt = destinationPoint(
        CONFIG.cabin.lat, CONFIG.cabin.lon, mi, 0
      );
      L.marker(labelPt, {
        interactive: false,
        icon: L.divIcon({
          className: "ring-label",
          html: `${mi} mi`,
          iconSize: [40, 16],
        }),
      }).addTo(layers.rings);
    });
  }

  function renderPerimeters(perims) {
    layers.perimeters.clearLayers();
    perims.forEach((p) => {
      layers.perimeters.addData(p.geojson);
    });
    layers.perimeters.eachLayer((layer) => {
      const props = (layer.feature && layer.feature.properties) || {};
      const name = props.poly_IncidentName || props.attr_IncidentName || "Fire";
      layer.bindPopup(
        `<b>${escapeHtml(name)}</b><br>Perimeter — ${fmtAcres(
          props.poly_GISAcres
        )}<br>${
          props.attr_PercentContained != null
            ? props.attr_PercentContained + "% contained"
            : ""
        }`
      );
    });
  }

  function renderIncidents(incidents) {
    layers.incidents.clearLayers();
    incidents.forEach((f) => {
      const size = acresToSize(f.acres);
      const icon = L.divIcon({
        className: "fire-icon",
        html: `<div class="fire-dot" style="width:${size}px;height:${size}px">🔥</div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });
      L.marker([f.lat, f.lon], { icon })
        .addTo(layers.incidents)
        .bindPopup(incidentPopup(f));
    });
  }

  function incidentPopup(f) {
    return (
      `<b>${escapeHtml(f.name)}</b><br>` +
      `<span class="pop-dist">${fmtMiles(f.distanceMi)} ${compass(
        f.bearing
      )} of cabin</span><br>` +
      `Size: ${fmtAcres(f.acres)}<br>` +
      (f.contained != null ? `Contained: ${f.contained}%<br>` : "") +
      (f.cause ? `Cause: ${escapeHtml(f.cause)}<br>` : "") +
      (f.discovered
        ? `Discovered: ${f.discovered.toLocaleDateString()}<br>`
        : "") +
      (f.county ? `<small>${escapeHtml(f.county)} County, ${escapeHtml(f.state || "")}</small>` : "")
    );
  }

  /* FIRMS hotspots colored by age: fresh=red, older=orange/yellow. This is
   * the "progression" view — watch the leading edge advance day by day. */
  function renderHotspots(hotspots) {
    layers.hotspots.clearLayers();
    hotspots.forEach((h) => {
      const color = ageColor(h.ageDays);
      const r = h.frp > 50 ? 6 : h.frp > 15 ? 5 : 4;
      L.circleMarker([h.lat, h.lon], {
        radius: r,
        color: "#222",
        weight: 0.5,
        fillColor: color,
        fillOpacity: 0.85,
      })
        .addTo(layers.hotspots)
        .bindPopup(
          `<b>Satellite hotspot</b><br>${h.sensor}<br>` +
            `${fmtMiles(h.distanceMi)} from cabin<br>` +
            `Detected: ${h.acq ? h.acq.toLocaleString() : "—"}<br>` +
            `FRP: ${h.frp.toFixed(1)} MW · ${escapeHtml(h.daynight === "D" ? "day" : "night")}<br>` +
            `Confidence: ${escapeHtml(h.confidence || "—")}`
        );
    });
  }

  function ageColor(days) {
    if (days <= 0.5) return "#ff0000";
    if (days <= 1) return "#ff5a00";
    if (days <= 2) return "#ff9500";
    if (days <= 4) return "#ffd000";
    return "#ffe98a";
  }

  function acresToSize(acres) {
    const a = Number(acres) || 0;
    if (a >= 10000) return 30;
    if (a >= 1000) return 24;
    if (a >= 100) return 20;
    return 16;
  }

  function destinationPoint(lat, lon, distMi, bearingDeg) {
    const R = 3958.7613;
    const br = (bearingDeg * Math.PI) / 180;
    const lat1 = (lat * Math.PI) / 180;
    const lon1 = (lon * Math.PI) / 180;
    const lat2 = Math.asin(
      Math.sin(lat1) * Math.cos(distMi / R) +
        Math.cos(lat1) * Math.sin(distMi / R) * Math.cos(br)
    );
    const lon2 =
      lon1 +
      Math.atan2(
        Math.sin(br) * Math.sin(distMi / R) * Math.cos(lat1),
        Math.cos(distMi / R) - Math.sin(lat1) * Math.sin(lat2)
      );
    return [(lat2 * 180) / Math.PI, (lon2 * 180) / Math.PI];
  }

  function fitToFires(incidents, perims) {
    const pts = [[CONFIG.cabin.lat, CONFIG.cabin.lon]];
    incidents.slice(0, 5).forEach((f) => pts.push([f.lat, f.lon]));
    if (pts.length > 1) {
      try {
        map.fitBounds(L.latLngBounds(pts).pad(0.3), { maxZoom: 11 });
      } catch (e) {}
    }
  }

  return {
    init,
    renderPerimeters,
    renderIncidents,
    renderHotspots,
    recenterCabin,
    fitToFires,
    drawRings,
  };
})();
