import React, { useMemo, useState, useEffect } from "react";
import { impactModel, metersToLatLonDelta, fmt } from "../lib/physics.js";
import { fetchNEOToday, fetchNEOLookup } from "../services/nasa.js";
import { Panel } from "../components/Panel.jsx";
import { Button } from "../components/Button.jsx";
import { Label } from "../components/Label.jsx";

/**
 * Analysis page:
 * Uses the same simplified model as the simulator and displays results
 * for two deflection scenarios (A and B) with a JSON download.
 */
export default function Analysis(){
  // State for meteor selection and input parameters
  const [selectedMeteor, setSelectedMeteor] = useState(null);
  const [feed, setFeed] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  
  // Editable input parameters
  const [diameter_m, setDiameterM] = useState(150);
  const [density_kgm3, setDensity] = useState(3000);
  const [velocity_kms, setVelocity] = useState(19);
  const [angle_deg, setAngle] = useState(45);
  const [impact_lat, setImpactLat] = useState(24.8607);
  const [impact_lon, setImpactLon] = useState(67.0011);
  const [elevation_m, setElevation] = useState(null);

  // Sample fallback meteor
  const sampleMeteor = useMemo(()=>({
    id:"0000", name:"Impactor-2025 (sample)", est_diameter_m:150, velocity_kms:19
  }),[]);

  // Compute inputs from state
  const inputs = useMemo(()=>({
    diameter_m,
    density_kgm3,
    velocity_kms,
    angle_deg,
    impact_lat,
    impact_lon,
    elevation_m
  }), [diameter_m, density_kgm3, velocity_kms, angle_deg, impact_lat, impact_lon, elevation_m]);

  // Load today's NEOs
  async function loadToday(){
    try {
      const list = await fetchNEOToday();
      setFeed(list);
    } catch(e){
      console.error(e);
      alert("Failed to load today's NEO data");
    }
  }

  // Lookup specific NEO
  async function doLookup(){
    if (!selectedId) return;
    try {
      const neo = await fetchNEOLookup(selectedId);
      const obj = {
        id: neo.id, name: neo.name,
        est_diameter_m: neo.est_diameter_m, velocity_kms: neo.velocity_kms
      };
      setSelectedMeteor(obj);
      if (obj.est_diameter_m) setDiameterM(obj.est_diameter_m);
      if (obj.velocity_kms) setVelocity(obj.velocity_kms);
    } catch(e){
      console.error(e);
      alert("Failed to lookup NEO data");
    }
  }

  // Analysis results state
  const [analysisResults, setAnalysisResults] = useState(null);

  // Run comprehensive analysis
  function runAnalysis(){
    const comprehensive = {
      ...report,
      timestamp: new Date().toISOString(),
      location: {
        city: "Karachi", // Could be enhanced with geocoding
        country: "Pakistan",
        population_affected: calculatePopulationAffected(physics.rings_km.light),
        major_cities_in_blast_radius: getNearbyCities(inputs.impact_lat, inputs.impact_lon, physics.rings_km.light)
      },
      environmental_impact: {
        atmospheric_dust_tons: physics.mass_kg * 0.1, // Rough estimate
        wildfires_risk: physics.energy_MtTNT > 5 ? "High" : physics.energy_MtTNT > 1 ? "Medium" : "Low",
        climate_impact_years: physics.energy_MtTNT > 10 ? "5-10" : physics.energy_MtTNT > 5 ? "2-5" : "1-2"
      },
      economic_impact: {
        infrastructure_damage_estimate_usd: calculateInfrastructureDamage(physics.rings_km),
        evacuation_costs_usd: physics.rings_km.light > 50 ? 1000000000 : physics.rings_km.light > 20 ? 500000000 : 100000000,
        recovery_time_years: physics.energy_MtTNT > 10 ? "10-50" : physics.energy_MtTNT > 5 ? "5-20" : "1-10"
      }
    };
    
    setAnalysisResults(comprehensive);
  }

  // Helper functions
  function calculatePopulationAffected(radiusKm) {
    // Rough estimate based on ring area (km^2) * urban density
    const areaKm2 = Math.PI * radiusKm * radiusKm;
    const densityPerKm2 = 1000; // Rough urban density
    return Math.round(areaKm2 * densityPerKm2);
  }

  function getNearbyCities(lat, lon, radiusKm) {
    // Simplified - in real app would use geocoding service
    const cities = [
      {name: "Karachi", lat: 24.8607, lon: 67.0011},
      {name: "Hyderabad", lat: 25.3971, lon: 68.3730},
      {name: "Lahore", lat: 31.5590, lon: 74.3587}
    ];
    
    return cities.filter(city => {
      const distance = calculateDistance(lat, lon, city.lat, city.lon);
      return distance <= radiusKm;
    }).map(city => city.name);
  }

  function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  function calculateInfrastructureDamage(rings) {
    const baseValue = 100000000; // $100M base
    const multiplier = Math.pow(rings.light / 10, 2); // Quadratic scaling
    return Math.round(baseValue * multiplier);
  }

  // Compute physics once
  const physics = useMemo(()=>(
    impactModel(inputs.diameter_m, inputs.density_kgm3, inputs.velocity_kms, inputs.angle_deg)
  ), [inputs]);

  // Two deflection scenarios
  const scenarioA = useMemo(()=>{
    const dv_mm_s = 1;
    const lead_days = 180;
    const dv_mps = dv_mm_s/1000;         // mm/s -> m/s
    const t_s = lead_days*86400;         // s
    const along_m = dv_mps * t_s;
    const { dLat, dLon } = metersToLatLonDelta(along_m, 0, inputs.impact_lat);
    const point = { lat: inputs.impact_lat + dLat, lon: inputs.impact_lon + dLon };
    return { label: "A (Δv = 1 mm/s, lead = 180 d)", dv_mm_s, lead_days, along_m, point };
  }, [inputs]);

  const scenarioB = useMemo(()=>{
    const dv_mm_s = 5;
    const lead_days = 365;
    const dv_mps = dv_mm_s/1000;
    const t_s = lead_days*86400;
    const along_m = dv_mps * t_s;
    const { dLat, dLon } = metersToLatLonDelta(along_m, 0, inputs.impact_lat);
    const point = { lat: inputs.impact_lat + dLat, lon: inputs.impact_lon + dLon };
    return { label: "B (Δv = 5 mm/s, lead = 365 d)", dv_mm_s, lead_days, along_m, point };
  }, [inputs]);

  const report = useMemo(()=>({
    inputs,
    physics,
    deflection: {
      scenario_A: {
        dv_mm_s: scenarioA.dv_mm_s,
        lead_days: scenarioA.lead_days,
        along_track_m: scenarioA.along_m,
        shifted_point: scenarioA.point
      },
      scenario_B: {
        dv_mm_s: scenarioB.dv_mm_s,
        lead_days: scenarioB.lead_days,
        along_track_m: scenarioB.along_m,
        shifted_point: scenarioB.point
      }
    }
  }), [inputs, physics, scenarioA, scenarioB]);

  // Excel export functionality
  function downloadExcel(){
    if (!analysisResults) {
      alert("Please run analysis first!");
      return;
    }

    const data = [
      ["IMPACT ANALYSIS REPORT"],
      ["Generated:", analysisResults.timestamp],
      [""],
      ["INPUT PARAMETERS"],
      ["Diameter (m)", analysisResults.inputs.diameter_m],
      ["Density (kg/m³)", analysisResults.inputs.density_kgm3],
      ["Velocity (km/s)", analysisResults.inputs.velocity_kms],
      ["Impact angle (°)", analysisResults.inputs.angle_deg],
      ["Impact lat", analysisResults.inputs.impact_lat],
      ["Impact lon", analysisResults.inputs.impact_lon],
      ["Elevation (m)", analysisResults.inputs.elevation_m || "Unknown"],
      [""],
      ["IMPACT PHYSICS"],
      ["Mass (kg)", analysisResults.physics.mass_kg],
      ["Energy (KJ)", analysisResults.physics.energy_J],
      ["Yield (Mt TNT)", analysisResults.physics.energy_MtTNT],
      ["Crater diameter (m)", analysisResults.physics.final_crater_diameter_m],
      ["Thermal zone radius (km)", analysisResults.physics.rings_km.severe],
      ["Seismic zone radius (km)", analysisResults.physics.rings_km.heavy],
      ["Shock zone radius (km)", analysisResults.physics.rings_km.light],
      [""],
      ["LOCATION IMPACT"],
      ["City", analysisResults.location.city],
      ["Country", analysisResults.location.country],
      ["Population affected", analysisResults.location.population_affected],
      ["Cities in blast radius", analysisResults.location.major_cities_in_blast_radius.join(", ")],
      [""],
      ["ENVIRONMENTAL IMPACT"],
      ["Atmospheric dust (tons)", analysisResults.environmental_impact.atmospheric_dust_tons],
      ["Wildfire risk", analysisResults.environmental_impact.wildfires_risk],
      ["Climate impact duration", analysisResults.environmental_impact.climate_impact_years + " years"],
      [""],
      ["ECONOMIC IMPACT"],
      ["Infrastructure damage (USD)", "$" + fmt(analysisResults.economic_impact.infrastructure_damage_estimate_usd)],
      ["Evacuation costs (USD)", "$" + fmt(analysisResults.economic_impact.evacuation_costs_usd)],
      ["Recovery time", analysisResults.economic_impact.recovery_time_years + " years"],
      [""],
      ["DEFLECTION SCENARIOS"],
      ["Scenario", "Δv (mm/s)", "Lead (days)", "Shift (m)", "New lat", "New lon"],
      ["A (Conservative)", analysisResults.deflection.scenario_A.dv_mm_s, analysisResults.deflection.scenario_A.lead_days, analysisResults.deflection.scenario_A.along_track_m, analysisResults.deflection.scenario_A.shifted_point.lat, analysisResults.deflection.scenario_A.shifted_point.lon],
      ["B (Aggressive)", analysisResults.deflection.scenario_B.dv_mm_s, analysisResults.deflection.scenario_B.lead_days, analysisResults.deflection.scenario_B.along_track_m, analysisResults.deflection.scenario_B.shifted_point.lat, analysisResults.deflection.scenario_B.shifted_point.lon]
    ];

    // Convert to CSV format
    const csv = data.map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");
    
    // Create blob and download
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `impactor_analysis_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadJSON(){
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "impactor_analysis_report.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
      <h1 className="text-2xl md:text-3xl font-semibold">Advanced Impact Analysis</h1>

      <Panel title="Meteor Selection">
        <div className="grid grid-cols-2 gap-2 mb-4">
          <Button onClick={loadToday} intent="primary">Load Today's NEOs</Button>
          <Button onClick={()=>{ setSelectedMeteor(sampleMeteor); setDiameterM(sampleMeteor.est_diameter_m); setVelocity(sampleMeteor.velocity_kms); }} >Use Sample</Button>
        </div>
        <div className="flex gap-2 mb-4">
          <select value={selectedId} onChange={e=>setSelectedId(e.target.value)} className="flex-1 px-2 py-2 rounded bg-slate-900 border border-slate-700">
            <option value="">— pick from feed —</option>
            {feed.map(o=> <option key={o.id} value={o.id}>{o.name} (≈{fmt(o.est_diameter_m)} m)</option>)}
          </select>
          <Button onClick={doLookup}>Lookup</Button>
        </div>
        {selectedMeteor && <p className="text-xs text-slate-400">Selected: <b>{selectedMeteor.name}</b> • D≈{fmt(selectedMeteor.est_diameter_m)} m • v≈{fmt(selectedMeteor.velocity_kms)} km/s</p>}
      </Panel>

      <Panel title="Impact Parameters">
        <div className="grid grid-cols-2 gap-3 mb-4">
          <Label text="Diameter (m)">
            <input type="number" value={diameter_m} onChange={e=>setDiameterM(+e.target.value)} className="w-full px-2 py-2 rounded bg-slate-900 border border-slate-700"/>
          </Label>
          <Label text="Density (kg/m³)">
            <input type="number" value={density_kgm3} onChange={e=>setDensity(+e.target.value)} className="w-full px-2 py-2 rounded bg-slate-900 border border-slate-700"/>
          </Label>
          <Label text="Velocity (km/s)">
            <input type="number" value={velocity_kms} onChange={e=>setVelocity(+e.target.value)} className="w-full px-2 py-2 rounded bg-slate-900 border border-slate-700"/>
          </Label>
          <Label text="Impact angle (°)">
            <input type="number" value={angle_deg} onChange={e=>setAngle(+e.target.value)} className="w-full px-2 py-2 rounded bg-slate-900 border border-slate-700"/>
          </Label>
        </div>
        <>
          <Button onClick={runAnalysis} intent="primary" className="w-full">Run Comprehensive Analysis</Button>
        </>
      </Panel>

      {analysisResults && (
        <Panel title="Comprehensive Analysis Results">
          <div className="space-y-4">
            {analysisResults.physics.atmospheric_burst ? (
              <div className="p-4 rounded-lg bg-blue-900/20 border border-blue-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <h4 className="font-semibold text-blue-300">Atmospheric Burst Analysis</h4>
                </div>
                <p className="text-sm text-blue-200 mb-2">
                  This meteor (diameter: {fmt(analysisResults.inputs.diameter_m)}m) will burst in the upper atmosphere 
                  at approximately {fmt(analysisResults.physics.burst_altitude_km)} km altitude due to atmospheric resistance.
                </p>
                <p className="text-sm text-blue-200 mb-4">
                  <strong>No surface impact will occur.</strong> The meteor will disintegrate completely 
                  before reaching the ground, creating a bright fireball visible from great distances but 
                  causing no ground-level damage.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-3 rounded-lg bg-blue-800/20 border border-blue-400/20">
                    <h5 className="font-medium text-blue-300 mb-1">Burst Altitude</h5>
                    <p className="text-sm text-blue-200">{fmt(analysisResults.physics.burst_altitude_km)} km</p>
                  </div>
                  <div className="p-3 rounded-lg bg-blue-800/20 border border-blue-400/20">
                    <h5 className="font-medium text-blue-300 mb-1">Surface Impact</h5>
                    <p className="text-sm text-blue-200">None</p>
                  </div>
                  <div className="p-3 rounded-lg bg-blue-800/20 border border-blue-400/20">
                    <h5 className="font-medium text-blue-300 mb-1">Ground Damage</h5>
                    <p className="text-sm text-blue-200">None</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-red-900/20 border border-red-500/20">
                  <h4 className="font-semibold text-red-300 mb-2">Location Impact</h4>
                  <p className="text-sm"><strong>City:</strong> {analysisResults.location.city}</p>
                  <p className="text-sm"><strong>Population affected:</strong> {fmt(analysisResults.location.population_affected)}</p>
                  <p className="text-sm"><strong>Cities in blast radius:</strong> {analysisResults.location.major_cities_in_blast_radius.join(", ")}</p>
                </div>
                
                <div className="p-4 rounded-lg bg-green-900/20 border border-green-500/20">
                  <h4 className="font-semibold text-green-300 mb-2">Environmental Impact</h4>
                  <p className="text-sm"><strong>Wildfire risk:</strong> {analysisResults.environmental_impact.wildfires_risk}</p>
                  <p className="text-sm"><strong>Climate duration:</strong> {analysisResults.environmental_impact.climate_impact_years} years</p>
                  <p className="text-sm"><strong>Dust ejected:</strong> {fmt(analysisResults.environmental_impact.atmospheric_dust_tons)} tons</p>
                </div>
                
                <div className="p-4 rounded-lg bg-blue-900/20 border border-blue-500/20">
                  <h4 className="font-semibold text-blue-300 mb-2">Economic Impact</h4>
                  <p className="text-sm"><strong>Infrastructure damage:</strong> ${fmt(analysisResults.economic_impact.infrastructure_damage_estimate_usd)}</p>
                  <p className="text-sm"><strong>Evacuation costs:</strong> ${fmt(analysisResults.economic_impact.evacuation_costs_usd)}</p>
                  <p className="text-sm"><strong>Recovery time:</strong> {analysisResults.economic_impact.recovery_time_years} years</p>
                </div>
              </div>
            )}
            
            <div className="flex gap-2 mt-4">
              <Button onClick={downloadExcel} intent="primary">Download Excel Report</Button>
              <Button onClick={downloadJSON}>Download JSON Data</Button>
            </div>
          </div>
        </Panel>
      )}

      <Panel title="Impact Physics (Computed)">
        {physics.atmospheric_burst ? (
          <div className="p-4 rounded-lg bg-blue-900/20 border border-blue-500/20">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <h4 className="font-semibold text-blue-300">Atmospheric Burst Physics</h4>
            </div>
            <p className="text-sm text-blue-200 mb-4">
              This meteor will burst in the upper atmosphere. No surface impact physics apply.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-blue-800/20 border border-blue-400/20">
                <h5 className="font-medium text-blue-300 mb-1">Meteor Mass</h5>
                <p className="text-sm text-blue-200">{fmt(physics.mass_kg)} kg</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-800/20 border border-blue-400/20">
                <h5 className="font-medium text-blue-300 mb-1">Burst Altitude</h5>
                <p className="text-sm text-blue-200">{fmt(physics.burst_altitude_km)} km</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-800/20 border border-blue-400/20">
                <h5 className="font-medium text-blue-300 mb-1">Surface Impact</h5>
                <p className="text-sm text-blue-200">None</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-800/20 border border-blue-400/20">
                <h5 className="font-medium text-blue-300 mb-1">Ground Damage</h5>
                <p className="text-sm text-blue-200">None</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[520px] w-full text-sm">
              <thead className="text-left text-slate-300">
                <tr>
                  <th className="py-2 pr-4">Mass (kg)</th>
                  <th className="py-2 pr-4">Energy (KJ)</th>
                  <th className="py-2 pr-4">Yield (Mt TNT)</th>
                  <th className="py-2 pr-4">Crater diameter (m)</th>
                  <th className="py-2 pr-4">Ring severe (km)</th>
                  <th className="py-2 pr-4">Ring heavy (km)</th>
                  <th className="py-2 pr-4">Ring light (km)</th>
                </tr>
              </thead>
              <tbody className="border-t border-slate-800">
                <tr>
                  <td className="py-2 pr-4">{fmt(physics.mass_kg)}</td>
                  <td className="py-2 pr-4">{fmt(physics.energy_J)}</td>
                  <td className="py-2 pr-4">{fmt(physics.energy_MtTNT)}</td>
                  <td className="py-2 pr-4">{fmt(physics.final_crater_diameter_m)}</td>
                  <td className="py-2 pr-4">{fmt(physics.rings_km.severe)}</td>
                  <td className="py-2 pr-4">{fmt(physics.rings_km.heavy)}</td>
                  <td className="py-2 pr-4">{fmt(physics.rings_km.light)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel title="Deflection Outcomes">
        {physics.atmospheric_burst ? (
          <div className="p-4 rounded-lg bg-blue-900/20 border border-blue-500/20">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <h4 className="font-semibold text-blue-300">No Deflection Needed</h4>
            </div>
            <p className="text-sm text-blue-200 mb-4">
              Since this meteor will burst in the upper atmosphere, no deflection is necessary. 
              The atmospheric resistance will naturally break up the meteor before it can cause any surface damage.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-blue-800/20 border border-blue-400/20">
                <h5 className="font-medium text-blue-300 mb-1">Deflection Required</h5>
                <p className="text-sm text-blue-200">None</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-800/20 border border-blue-400/20">
                <h5 className="font-medium text-blue-300 mb-1">Surface Risk</h5>
                <p className="text-sm text-blue-200">None</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[520px] w-full text-sm">
              <thead className="text-left text-slate-300">
                <tr>
                  <th className="py-2 pr-4">Scenario</th>
                  <th className="py-2 pr-4">Δv (mm/s)</th>
                  <th className="py-2 pr-4">Lead (days)</th>
                  <th className="py-2 pr-4">Along-track shift (m)</th>
                  <th className="py-2 pr-4">Shifted lat</th>
                  <th className="py-2 pr-4">Shifted lon</th>
                </tr>
              </thead>
              <tbody className="border-t border-slate-800">
                <Row s={scenarioA} />
                <Row s={scenarioB} />
              </tbody>
            </table>
          </div>
        )}

        <Button className="mt-4" onClick={downloadJSON}>Download JSON</Button>
      </Panel>
    </div>
  );
}

function KV({ k, v }){
  return (
    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
      <div className="text-xs text-slate-400">{k}</div>
      <div className="font-semibold">{v}</div>
    </div>
  );
}
function Row({ s }){
  return (
    <tr>
      <td className="py-2 pr-4">{s.label}</td>
      <td className="py-2 pr-4">{fmt(s.dv_mm_s)}</td>
      <td className="py-2 pr-4">{fmt(s.lead_days)}</td>
      <td className="py-2 pr-4">{fmt(s.along_m)}</td>
      <td className="py-2 pr-4">{fmt(s.point.lat, 6)}</td>
      <td className="py-2 pr-4">{fmt(s.point.lon, 6)}</td>
    </tr>
  );
}
