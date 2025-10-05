import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export function MapPane({ point, onMove, rings, deflectPoint, crater, simPoint }){
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const ringLayers = useRef([]);
  const deflectLayers = useRef([]);
  const craterLayer = useRef(null);

  useEffect(()=>{
    if (mapRef.current) return;
    const map = L.map("map-root", { zoomControl: true }).setView([point.lat, point.lon], 3);
    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{
      maxZoom: 10, attribution: "© OpenStreetMap"
    }).addTo(map);

    const mk = L.marker([point.lat, point.lon], { draggable: true }).addTo(map);
    markerRef.current = mk;

    mk.on("dragend", (e)=>{
      const { lat, lng } = e.target.getLatLng();
      onMove && onMove(lat, lng);
    });

    map.on("click", (e)=>{
      const { lat, lng } = e.latlng;
      mk.setLatLng([lat, lng]);
      map.panTo([lat, lng]);
      onMove && onMove(lat, lng);
    });

    // ensure visible even if CSS fails
    const el = document.getElementById("map-root");
    if (el && !el.style.minHeight) el.style.minHeight = "400px";
  },[]);

  // update marker on external move
  useEffect(()=>{
    const mk = markerRef.current, map = mapRef.current;
    if (mk && map) {
      mk.setLatLng([point.lat, point.lon]);
      map.panTo([point.lat, point.lon], { animate: true });
    }
  },[point.lat, point.lon]);

  // draw rings
  useEffect(()=>{
    const map = mapRef.current;
    if (!map) return;
    ringLayers.current.forEach(l=>map.removeLayer(l));
    ringLayers.current = [];

    if (!rings) return;
    
    const addRing = (km, color, op=0.25)=>{
      const c = L.circle([simPoint.lat, simPoint.lon], {
        radius: km*1000, 
        color: color, 
        fillColor: color, 
        fillOpacity: op, 
        weight: 3,
        dashArray: null
      }).addTo(map);
      
      ringLayers.current.push(c);
    };
    
    // Make sure we have valid radius values and simulation point
    if (simPoint && simPoint.lat && simPoint.lon) {
      if (rings.severe && rings.severe > 0) {
        addRing(rings.severe, "#DC2626", 0.25);
      }
      if (rings.heavy && rings.heavy > 0) {
        addRing(rings.heavy, "#F59E0B", 0.20);
      }
      if (rings.light && rings.light > 0) {
        addRing(rings.light, "#16A34A", 0.15);
      }
    }
  },[rings, simPoint?.lat, simPoint?.lon]);

  // draw crater
  useEffect(()=>{
    const map = mapRef.current;
    if (!map) return;
    if (craterLayer.current) {
      map.removeLayer(craterLayer.current);
      craterLayer.current = null;
    }

    if (!crater || !crater.diameter_m) return;
    
    const craterRadiusM = crater.diameter_m / 2; // radius in meters
    craterLayer.current = L.circle([simPoint.lat, simPoint.lon], {
      radius: craterRadiusM,
      color: "#FBBF24", // yellow-orange
      fillColor: "#FCD34D", // lighter yellow
      fillOpacity: 0.7,
      weight: 2,
      dashArray: "5, 5"
    }).addTo(map);
    
  },[crater, simPoint?.lat, simPoint?.lon]);

  // draw deflection
  useEffect(()=>{
    const map = mapRef.current;
    if (!map) return;
    deflectLayers.current.forEach(l=>map.removeLayer(l));
    deflectLayers.current = [];

    if (!deflectPoint || !simPoint) return;
    const line = L.polyline([[simPoint.lat, simPoint.lon],[deflectPoint.lat, deflectPoint.lon]], { color:"#F59E0B", weight:3, dashArray:"6,6" }).addTo(map);
    const dot = L.circleMarker([deflectPoint.lat, deflectPoint.lon], { radius:6, color:"#F59E0B", fillColor:"#F59E0B", fillOpacity:0.9 }).bindTooltip("Deflected impact (viz)").addTo(map);
    deflectLayers.current.push(line, dot);
  },[deflectPoint, simPoint?.lat, simPoint?.lon]);

  return (
    <section className="relative rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl border border-slate-700/50" style={{ minHeight: "40vh", height: "50vh" }}>
      <div id="map-root" className="absolute inset-0" />
      
      {/* Enhanced cosmic gradient overlay */}
      <div aria-hidden className="pointer-events-none absolute inset-0
        bg-[radial-gradient(circle_at_30%_20%,rgba(79,70,229,0.1)_0%,transparent_40%),
            radial-gradient(circle_at_80%_60%,rgba(234,88,12,0.1)_0%,transparent_35%),
            radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.05)_0%,transparent_50%)]
        opacity-30" />
      
      {/* Map border glow effect */}
      <div className="absolute inset-0 rounded-xl sm:rounded-2xl border-2 border-transparent bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-purple-500/20 opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
    </section>
  );
}
