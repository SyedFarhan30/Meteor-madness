import React, { useEffect, useMemo, useState } from "react";
import "leaflet/dist/leaflet.css";
import { useApp } from "../context/AppContext.jsx";
import { MapPane } from "../components/MapPane.jsx";
import { Panel } from "../components/Panel.jsx";
import { Button } from "../components/Button.jsx";
import { Label } from "../components/Label.jsx";
import { Tooltip } from "../components/Tooltip.jsx";
import { Stat } from "../components/Stat.jsx";
import { fetchNEOToday, fetchNEOLookup } from "../services/nasa.js";
import { epqsElevation } from "../services/usgs.js";
import { impactModel, metersToLatLonDelta, fmt } from "../lib/physics.js";

export default function Simulator(){
  // No longer need to access apiKey from context

  // UI + physics state
  const [asteroid, setAsteroid] = useState(null);
  const [feed, setFeed] = useState([]);
  const [selectedId, setSelectedId] = useState("");

  const [dia_m, setDiaM] = useState(150);
  const [rho, setRho] = useState(3000);
  const [vel_kms, setVel] = useState(19);
  const [angle_deg, setAngle] = useState(45);

  const [dv_mms, setDv] = useState(1);
  const [lead_days, setLead] = useState(180);

  const [impact, setImpact] = useState({ lat: 24.8607, lon: 67.0011, elev: null }); // Karachi default
  const [result, setResult] = useState(null);

  // Sample fallback
  const sample = useMemo(()=>({
    id:"0000", name:"Impactor-2025 (sample)", est_diameter_m:150, velocity_kms:19
  }),[]);

  // elevation update on point change
  async function updateElevation(lat, lon){
    const elev = await epqsElevation(lat, lon); // null outside US
    setImpact(prev=>({...prev, lat, lon, elev}));
  }

  async function loadToday(){
    try {
      const j = await fetchNEOToday();
      setFeed(j);
      if (j[0]) {
        setSelectedId(j[0].id);
        setAsteroid(j[0]);
        setDiaM(j[0].est_diameter_m || 150);
        setVel(j[0].velocity_kms || 19);
      }
    } catch {
      setAsteroid(sample);
      setDiaM(sample.est_diameter_m);
      setVel(sample.velocity_kms);
    }
  }

  async function doLookup(){
    if (!selectedId) return;
    try {
      const d = await fetchNEOLookup(selectedId);
      const obj = {
        id: d.id, name: d.name,
        est_diameter_m: d.est_diameter_m, velocity_kms: d.velocity_kms
      };
      setAsteroid(obj);
      if (obj.est_diameter_m) setDiaM(obj.est_diameter_m);
      if (obj.velocity_kms) setVel(obj.velocity_kms);
    } catch {}
  }

  function simulate(){
    const model = impactModel(dia_m, rho, vel_kms, angle_deg);

    // Δv deflection (simple along-track shift)
    const dv_mps = dv_mms/1000;
    const t_s = lead_days * 86400;
    const alongTrack_m = dv_mps * t_s;

    const { dLat, dLon } = metersToLatLonDelta(alongTrack_m, 0, impact.lat);
    const deflect = { lat: impact.lat + dLat, lon: impact.lon + dLon };

    setResult({
      model,
      impactPoint: impact,
      deflection: { alongTrack_m, point: deflect }
    });
  }

  // Update impact position without moving simulation circles
  function updateImpactPosition(lat, lon) {
    setImpact(prev => ({ ...prev, lat, lon }));
    // Don't update result circles - keep them fixed at simulated position
  }

  // on mount: initial elevation
  useEffect(()=>{ updateElevation(impact.lat, impact.lon); },[]);

  return (
    <div className="max-w-7xl mx-auto grid md:grid-cols-[380px_1fr] gap-4 p-4">
      {/* Controls */}
      <section className="space-y-4">
        <Panel title="Data">
          <div className="grid grid-cols-2 gap-2 mt-2">
            <Button onClick={loadToday} intent="primary">Load Today’s NEOs</Button>
            <Button onClick={()=>{ setAsteroid(sample); setDiaM(sample.est_diameter_m); setVel(sample.velocity_kms); }} >Use Sample</Button>
          </div>
          <div className="flex gap-2 mt-2">
            <select value={selectedId} onChange={e=>setSelectedId(e.target.value)} className="flex-1 px-2 py-2 rounded bg-slate-900 border border-slate-700">
              <option value="">— pick from feed —</option>
              {feed.map(o=> <option key={o.id} value={o.id}>{o.name} (≈{fmt(o.est_diameter_m)} m)</option>)}
            </select>
            <Button onClick={doLookup}>Lookup</Button>
          </div>
          {asteroid && <p className="text-xs text-slate-400 mt-2">Loaded: <b>{asteroid.name}</b> • D≈{fmt(asteroid.est_diameter_m)} m • v≈{fmt(asteroid.velocity_kms)} km/s</p>}
        </Panel>

        <Panel title="Impact Parameters">
          <div className="grid grid-cols-2 gap-3">
            <Label text={<>Diameter (m) <Tooltip label="Projectile diameter at entry."/></>}>
              <input type="number" value={dia_m} onChange={e=>setDiaM(+e.target.value)} className="w-full px-2 py-2 rounded bg-slate-900 border border-slate-700"/>
            </Label>
            <Label text={<>Density (kg/m³) <Tooltip label="Use ~3000 kg/m³ for stony, ~7800 for iron."/></>}>
              <input type="number" value={rho} onChange={e=>setRho(+e.target.value)} className="w-full px-2 py-2 rounded bg-slate-900 border border-slate-700"/>
            </Label>
            <Label text={<>Velocity (km/s) <Tooltip label="Hyperbolic approach speed at impact."/></>}>
              <input type="number" value={vel_kms} onChange={e=>setVel(+e.target.value)} className="w-full px-2 py-2 rounded bg-slate-900 border border-slate-700"/>
            </Label>
            <Label text={<>Impact angle (°) <Tooltip label="Angle from horizontal; shallow impacts couple less energy."/></>}>
              <input type="number" value={angle_deg} onChange={e=>setAngle(+e.target.value)} className="w-full px-2 py-2 rounded bg-slate-900 border border-slate-700"/>
            </Label>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Click or drag the marker on the map to reposition the impact. US elevation is shown when available.
          </p>
        </Panel>

        <Panel title="Mitigation (Δv)">
          <div className="grid grid-cols-2 gap-3">
            <Label text={<>Δv (mm/s) <Tooltip label="Tiny nudge from a kinetic impactor or gravity tractor."/></>}>
              <input type="number" value={dv_mms} onChange={e=>setDv(+e.target.value)} className="w-full px-2 py-2 rounded bg-slate-900 border border-slate-700"/>
            </Label>
            <Label text={<>Lead time (days) <Tooltip label="How long before impact the nudge is applied."/></>}>
              <input type="number" value={lead_days} onChange={e=>setLead(+e.target.value)} className="w-full px-2 py-2 rounded bg-slate-900 border border-slate-700"/>
            </Label>
          </div>
          <Button className="mt-3 w-full" intent="success" onClick={simulate}>Simulate</Button>
        </Panel>

        <Panel title="Results">
          {!result && <p className="text-slate-400 text-sm">Run a simulation to see outputs.</p>}
          {result && result.model.atmospheric_burst && (
            <div className="p-4 rounded-lg bg-blue-900/20 border border-blue-500/20">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <h4 className="font-medium text-blue-300">Atmospheric Burst Detected</h4>
              </div>
              <p className="text-sm text-blue-200 mb-2">
                This meteor (diameter: {fmt(dia_m)}m) is too small to reach the surface. 
                It will burst in the upper atmosphere at approximately {fmt(result.model.burst_altitude_km)} km altitude 
                due to atmospheric resistance and heating.
              </p>
              <p className="text-xs text-blue-300">
                <strong>No surface impact crater will form.</strong> The meteor will disintegrate 
                completely before reaching the ground, creating a bright fireball visible from great distances.
              </p>
            </div>
          )}
          {result && !result.model.atmospheric_burst && (
            <div className="grid gap-2">
              <div className="grid grid-cols-2 gap-2">
                <Stat label="Mass (kg)" value={fmt(result.model.mass_kg)} />
                <Stat label="Energy (KJ)" value={fmt(result.model.energy_J)} />
                <Stat label="Yield (Mt TNT)" value={fmt(result.model.energy_MtTNT)} />
                <Stat label="Crater dia (m)" value={fmt(result.model.final_crater_diameter_m)} />
              </div>
              <p className="text-xs text-slate-400">
                Rings (km): severe <b>{fmt(result.model.rings_km.severe)}</b>, heavy <b>{fmt(result.model.rings_km.heavy)}</b>, light <b>{fmt(result.model.rings_km.light)}</b>.
              </p>
            </div>
          )}
        </Panel>

        <Panel title="Damage Zones">
          {!result && <p className="text-slate-400 text-sm">Run a simulation to see impact zones.</p>}
          {result && result.model.atmospheric_burst && (
            <div className="p-4 rounded-lg bg-blue-900/20 border border-blue-500/20">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <h4 className="font-medium text-blue-300">No Surface Damage</h4>
              </div>
              <p className="text-sm text-blue-200">
                This meteor will burst in the upper atmosphere. No surface damage zones will be created.
                The atmospheric burst will be visible as a bright fireball but will not cause ground-level damage.
              </p>
            </div>
          )}
          {result && !result.model.atmospheric_burst && result.model.damage_zones && (
            <div className="space-y-3">
              <div className="border border-red-500/20 rounded p-3 bg-red-900/10">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <h4 className="font-medium text-red-300">Thermal Radiation Zone</h4>
                  <span className="text-xs bg-red-500 text-white px-2 py-1 rounded ml-auto">
                    {fmt(result.model.damage_zones.thermal.radius_km)} km
                  </span>
                </div>
                <p className="text-sm text-red-200">{result.model.damage_zones.thermal.description}</p>
              </div>

              <div className="border border-orange-500/20 rounded p-3 bg-orange-900/10">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                  <h4 className="font-medium text-orange-300">Seismic Wave Zone</h4>
                  <span className="text-xs bg-orange-500 text-white px-2 py-1 rounded ml-auto">
                    {fmt(result.model.damage_zones.seismic.radius_km)} km
                  </span>
                </div>
                <p className="text-sm text-orange-200">{result.model.damage_zones.seismic.description}</p>
              </div>

              <div className="border border-green-500/20 rounded p-3 bg-green-900/10">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <h4 className="font-medium text-green-300">Shock Wave Zone</h4>
                  <span className="text-xs bg-green-500 text-white px-2 py-1 rounded ml-auto">
                    {fmt(result.model.damage_zones.shock.radius_km)} km
                  </span>
                </div>
                <p className="text-sm text-green-200">{result.model.damage_zones.shock.description}</p>
              </div>
            </div>
          )}
        </Panel>
      </section>

      {/* Map */}
      <MapPane
        point={impact}
        onMove={(lat, lon) => { updateElevation(lat, lon); updateImpactPosition(lat, lon); }}
        rings={result?.model?.atmospheric_burst ? null : result?.model?.rings_km}
        deflectPoint={result?.model?.atmospheric_burst ? null : result?.deflection?.point}
        crater={result?.model?.atmospheric_burst ? null : (result?.model ? { diameter_m: result.model.final_crater_diameter_m } : null)}
        simPoint={result?.model?.atmospheric_burst ? null : result?.impactPoint}
      />
    </div>
  );
}
