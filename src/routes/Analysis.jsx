import React, { useMemo, useState, useEffect } from "react";
import { impactModel, metersToLatLonDelta, fmt, calculateKineticImpactorDeltaV, getKineticImpactorInfo } from "../lib/physics.js";
import { fetchNEOToday, fetchNEOLookup } from "../services/nasa.js";
import { calculateEarthquakeMagnitude, calculateMMI, getEarthquakeEffects, estimateEarthquakeCasualties, analyzeTsunamiRisk } from "../services/earthquake.js";
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
  const [days_to_hit_surface, setDaysToHitSurface] = useState(0);
  const [selectedCity, setSelectedCity] = useState("Karachi");

  // Sample fallback meteor
  const sampleMeteor = useMemo(()=>({
    id:"0000", name:"Impactor-2025 (sample)", est_diameter_m:150, velocity_kms:19
  }),[]);

  // Famous cities data
  const famousCities = [
    { name: "Karachi", lat: 24.8607, lon: 67.0011, country: "Pakistan", population: 15741000 },
    { name: "New York", lat: 40.7128, lon: -74.0060, country: "USA", population: 8336817 },
    { name: "London", lat: 51.5074, lon: -0.1278, country: "UK", population: 8982000 },
    { name: "Tokyo", lat: 35.6762, lon: 139.6503, country: "Japan", population: 13929286 },
    { name: "Mumbai", lat: 19.0760, lon: 72.8777, country: "India", population: 12478447 },
    { name: "Shanghai", lat: 31.2304, lon: 121.4737, country: "China", population: 24870895 },
    { name: "São Paulo", lat: -23.5505, lon: -46.6333, country: "Brazil", population: 12325232 },
    { name: "Mexico City", lat: 19.4326, lon: -99.1332, country: "Mexico", population: 9209944 },
    { name: "Cairo", lat: 30.0444, lon: 31.2357, country: "Egypt", population: 10230350 },
    { name: "Istanbul", lat: 41.0082, lon: 28.9784, country: "Turkey", population: 15519267 },
    { name: "Los Angeles", lat: 34.0522, lon: -118.2437, country: "USA", population: 3971883 },
    { name: "Moscow", lat: 55.7558, lon: 37.6176, country: "Russia", population: 12500000 },
    { name: "Delhi", lat: 28.7041, lon: 77.1025, country: "India", population: 32941000 },
    { name: "Beijing", lat: 39.9042, lon: 116.4074, country: "China", population: 21540000 },
    { name: "Lagos", lat: 6.5244, lon: 3.3792, country: "Nigeria", population: 15388000 }
  ];

  // Compute inputs from state
  const inputs = useMemo(()=>({
    diameter_m,
    density_kgm3,
    velocity_kms,
    angle_deg,
    impact_lat,
    impact_lon,
    elevation_m,
    days_to_hit_surface
  }), [diameter_m, density_kgm3, velocity_kms, angle_deg, impact_lat, impact_lon, elevation_m, days_to_hit_surface]);

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
    const selectedCityData = famousCities.find(c => c.name === selectedCity);
    
    // Earthquake analysis
    const earthquakeMagnitude = calculateEarthquakeMagnitude(physics.energy_J);
    const mmi = calculateMMI(earthquakeMagnitude, 0); // At epicenter
    const earthquakeEffects = getEarthquakeEffects(mmi);
    const earthquakeCasualties = estimateEarthquakeCasualties(earthquakeMagnitude, selectedCityData?.population || 1000000, 0);
    
    // Tsunami analysis
    const tsunamiAnalysis = analyzeTsunamiRisk(physics.energy_J, inputs.impact_lat, inputs.impact_lon);
    
    const comprehensive = {
      ...report,
      timestamp: new Date().toISOString(),
      location: {
        city: selectedCity,
        country: selectedCityData?.country || "Unknown",
        population: selectedCityData?.population || 1000000,
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
      },
      seismic_impact: {
        earthquake_magnitude: earthquakeMagnitude,
        mmi_scale: mmi,
        earthquake_effects: earthquakeEffects,
        casualties: earthquakeCasualties
      },
      tsunami_impact: tsunamiAnalysis
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

  // Handle city selection
  function handleCityChange(cityName) {
    const city = famousCities.find(c => c.name === cityName);
    if (city) {
      setSelectedCity(cityName);
      setImpactLat(city.lat);
      setImpactLon(city.lon);
    }
  }

  // Two deflection scenarios using kinetic impactor
  const scenarioA = useMemo(()=>{
    const lead_days = 180;
    const meteorMass = physics.mass_kg;
    const meteorVelocity = inputs.velocity_kms * 1000; // Convert km/s to m/s
    const calculatedDeltaV = calculateKineticImpactorDeltaV(meteorMass, meteorVelocity, lead_days, inputs.diameter_m);
    const dv_mps = calculatedDeltaV/1000;         // mm/s -> m/s
    const t_s = lead_days*86400;         // s
    const along_m = dv_mps * t_s;
    const { dLat, dLon } = metersToLatLonDelta(along_m, 0, inputs.impact_lat);
    const point = { lat: inputs.impact_lat + dLat, lon: inputs.impact_lon + dLon };
    return { label: "A (Conservative: 180 days to hit surface)", dv_mm_s: calculatedDeltaV, lead_days, along_m, point };
  }, [inputs, physics]);

  const scenarioB = useMemo(()=>{
    const lead_days = 365;
    const meteorMass = physics.mass_kg;
    const meteorVelocity = inputs.velocity_kms * 1000; // Convert km/s to m/s
    const calculatedDeltaV = calculateKineticImpactorDeltaV(meteorMass, meteorVelocity, lead_days, inputs.diameter_m);
    const dv_mps = calculatedDeltaV/1000;
    const t_s = lead_days*86400;
    const along_m = dv_mps * t_s;
    const { dLat, dLon } = metersToLatLonDelta(along_m, 0, inputs.impact_lat);
    const point = { lat: inputs.impact_lat + dLat, lon: inputs.impact_lon + dLon };
    return { label: "B (Aggressive: 365 days to hit surface)", dv_mm_s: calculatedDeltaV, lead_days, along_m, point };
  }, [inputs, physics]);

  // User's custom deflection scenario
  const customScenario = useMemo(()=>{
    if (inputs.days_to_hit_surface === 0) return null;
    const meteorMass = physics.mass_kg;
    const meteorVelocity = inputs.velocity_kms * 1000;
    const calculatedDeltaV = calculateKineticImpactorDeltaV(meteorMass, meteorVelocity, inputs.days_to_hit_surface, inputs.diameter_m);
    const dv_mps = calculatedDeltaV/1000;
    const t_s = inputs.days_to_hit_surface*86400;
    const along_m = dv_mps * t_s;
    const { dLat, dLon } = metersToLatLonDelta(along_m, 0, inputs.impact_lat);
    const point = { lat: inputs.impact_lat + dLat, lon: inputs.impact_lon + dLon };
    return { label: `Custom (${inputs.days_to_hit_surface} days to hit surface)`, dv_mm_s: calculatedDeltaV, lead_days: inputs.days_to_hit_surface, along_m, point };
  }, [inputs, physics]);

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
      ["KINETIC IMPACTOR DEFLECTION SCENARIOS"],
      ["Scenario", "Days to hit surface", "Calculated Δv (mm/s)", "Shift (m)", "New lat", "New lon"],
      ["A (Conservative)", analysisResults.deflection.scenario_A.lead_days, analysisResults.deflection.scenario_A.dv_mm_s, analysisResults.deflection.scenario_A.along_track_m, analysisResults.deflection.scenario_A.shifted_point.lat, analysisResults.deflection.scenario_A.shifted_point.lon],
      ["B (Aggressive)", analysisResults.deflection.scenario_B.lead_days, analysisResults.deflection.scenario_B.dv_mm_s, analysisResults.deflection.scenario_B.along_track_m, analysisResults.deflection.scenario_B.shifted_point.lat, analysisResults.deflection.scenario_B.shifted_point.lon],
      [""],
      ["IMPACTOR SPECIFICATIONS"],
      ["Mass (kg)", getKineticImpactorInfo().mass_kg],
      ["Velocity (km/s)", getKineticImpactorInfo().velocity_ms/1000],
      ["Energy (GJ)", getKineticImpactorInfo().energy_J/1e9],
      ["TNT Equivalent (tons)", getKineticImpactorInfo().energy_tnt_tons]
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
    <div className="max-w-6xl mx-auto p-2 sm:p-3 md:p-4 lg:p-6 space-y-3 sm:space-y-4 lg:space-y-6">
      <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold text-center sm:text-left">Advanced Impact Analysis</h1>

      <Panel title="Meteor Selection">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mb-3 sm:mb-4">
          <Button onClick={loadToday} intent="primary" className="text-xs sm:text-sm">🌌 Load Today's NEOs</Button>
          <Button onClick={()=>{ setSelectedMeteor(sampleMeteor); setDiameterM(sampleMeteor.est_diameter_m); setVelocity(sampleMeteor.velocity_kms); }} intent="meteor" className="text-xs sm:text-sm">☄️ Use Sample</Button>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-3 sm:mb-4">
          <select value={selectedId} onChange={e=>setSelectedId(e.target.value)} className="flex-1 px-2 sm:px-3 py-2 rounded bg-slate-900 border border-slate-700 text-xs sm:text-sm">
            <option value="">— pick from feed —</option>
            {feed.map(o=> <option key={o.id} value={o.id}>{o.name} (≈{fmt(o.est_diameter_m)} m)</option>)}
          </select>
          <Button onClick={doLookup} className="text-xs sm:text-sm">Lookup</Button>
        </div>
        {selectedMeteor && <p className="text-xs text-slate-400">Selected: <b>{selectedMeteor.name}</b> • D≈{fmt(selectedMeteor.est_diameter_m)} m • v≈{fmt(selectedMeteor.velocity_kms)} km/s</p>}
      </Panel>

      <Panel title="Impact Parameters">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
          <Label text="Diameter (m)">
            <input type="number" value={diameter_m} onChange={e=>setDiameterM(+e.target.value)} className="w-full px-2 sm:px-3 py-2 rounded bg-slate-900 border border-slate-700 text-sm"/>
          </Label>
          <Label text="Density (kg/m³)">
            <input type="number" value={density_kgm3} onChange={e=>setDensity(+e.target.value)} className="w-full px-2 sm:px-3 py-2 rounded bg-slate-900 border border-slate-700 text-sm"/>
          </Label>
          <Label text="Velocity (km/s)">
            <input type="number" value={velocity_kms} onChange={e=>setVelocity(+e.target.value)} className="w-full px-2 sm:px-3 py-2 rounded bg-slate-900 border border-slate-700 text-sm"/>
          </Label>
          <Label text="Impact angle (°)">
            <input type="number" value={angle_deg} onChange={e=>setAngle(+e.target.value)} className="w-full px-2 sm:px-3 py-2 rounded bg-slate-900 border border-slate-700 text-sm"/>
          </Label>
        </div>
        <>
          <Button onClick={runAnalysis} intent="primary" className="w-full text-sm">🔬 Run Comprehensive Analysis</Button>
        </>
      </Panel>

      <Panel title="Impact Location & Timing">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
          <Label text="Famous Cities">
            <select 
              value={selectedCity} 
              onChange={e=>handleCityChange(e.target.value)} 
              className="w-full px-2 sm:px-3 py-2 rounded bg-slate-900 border border-slate-700 text-sm"
            >
              {famousCities.map(city => (
                <option key={city.name} value={city.name}>
                  {city.name}, {city.country} (Pop: {fmt(city.population/1000000, 1)}M)
                </option>
              ))}
            </select>
          </Label>
          <Label text="Days to hit the surface">
            <input 
              type="number" 
              value={days_to_hit_surface} 
              onChange={e=>setDaysToHitSurface(+e.target.value)} 
              className="w-full px-2 sm:px-3 py-2 rounded bg-slate-900 border border-slate-700 text-sm"
              min="0"
              max="3650"
            />
          </Label>
        </div>
        <div className="text-xs text-slate-400 mb-3 sm:mb-4">
          Selected: <b>{selectedCity}</b> at {impact_lat.toFixed(4)}°, {impact_lon.toFixed(4)}° 
          {famousCities.find(c => c.name === selectedCity)?.population && 
            ` (Population: ${fmt(famousCities.find(c => c.name === selectedCity).population/1000000, 1)}M)`
          }
        </div>
      </Panel>

      <Panel title="Kinetic Impactor System">
        <div className="space-y-3 sm:space-y-4">
          {diameter_m < 25 ? (
            <div className="p-3 sm:p-4 rounded-lg bg-green-900/20 border border-green-500/20">
              <h4 className="font-semibold text-green-300 mb-2 sm:mb-3">No Deflection Needed</h4>
              <div className="text-sm text-green-200 space-y-1 sm:space-y-2">
                <p>• Meteor diameter: {fmt(diameter_m)} m (less than 25m)</p>
                <p>• This meteor will burn up in the upper atmosphere</p>
                <p>• No surface impact is expected</p>
                <p>• Kinetic impactor deflection is not required</p>
                <p>• The atmospheric resistance will naturally break up the meteor</p>
              </div>
            </div>
          ) : (
            <div className="p-3 sm:p-4 rounded-lg bg-blue-900/20 border border-blue-500/20">
              <h4 className="font-semibold text-blue-300 mb-2 sm:mb-3">Deflection Method: Kinetic Impactor</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 text-sm">
                <div>
                  <h5 className="font-medium text-blue-200 mb-1 sm:mb-2">Impactor Specifications</h5>
                  <div className="text-blue-100 space-y-1">
                    <p>• Mass: {fmt(getKineticImpactorInfo().mass_kg)} kg</p>
                    <p>• Velocity: {fmt(getKineticImpactorInfo().velocity_ms/1000)} km/s</p>
                    <p>• Energy: {fmt(getKineticImpactorInfo().energy_J/1e9, 1)} GJ</p>
                    <p>• TNT Equivalent: {fmt(getKineticImpactorInfo().energy_tnt_tons, 1)} tons</p>
                  </div>
                </div>
                <div>
                  <h5 className="font-medium text-blue-200 mb-1 sm:mb-2">How It Works</h5>
                  <div className="text-blue-100 space-y-1 text-xs">
                    <p>• High-speed impactor hits meteor</p>
                    <p>• Transfers momentum to deflect trajectory</p>
                    <p>• Effectiveness depends on meteor properties</p>
                    <p>• More days to hit surface = greater deflection</p>
                    <p>• Larger/slower meteors deflect easier</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {diameter_m >= 25 && (
            <div className="p-3 sm:p-4 rounded-lg bg-green-900/20 border border-green-500/20">
              <h4 className="font-semibold text-green-300 mb-2 sm:mb-3">Deflection Scenarios</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 text-sm">
                <div>
                  <h5 className="font-medium text-green-200 mb-1 sm:mb-2">Scenario A (Conservative)</h5>
                  <div className="text-green-100 space-y-1">
                    <p>• Days to hit the surface: 180 days</p>
                    <p>• Calculated Δv: {fmt(scenarioA.dv_mm_s, 3)} mm/s</p>
                    <p>• Deflection: {fmt(scenarioA.along_m/1000, 2)} km</p>
                  </div>
                </div>
                <div>
                  <h5 className="font-medium text-green-200 mb-1 sm:mb-2">Scenario B (Aggressive)</h5>
                  <div className="text-green-100 space-y-1">
                    <p>• Days to hit the surface: 365 days</p>
                    <p>• Calculated Δv: {fmt(scenarioB.dv_mm_s, 3)} mm/s</p>
                    <p>• Deflection: {fmt(scenarioB.along_m/1000, 2)} km</p>
                  </div>
                </div>
                {customScenario && (
                  <div>
                    <h5 className="font-medium text-green-200 mb-1 sm:mb-2">Custom Scenario</h5>
                    <div className="text-green-100 space-y-1">
                      <p>• Days to hit the surface: {customScenario.lead_days} days</p>
                      <p>• Calculated Δv: {fmt(customScenario.dv_mm_s, 3)} mm/s</p>
                      <p>• Deflection: {fmt(customScenario.along_m/1000, 2)} km</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
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
                
                <div className="p-4 rounded-lg bg-red-900/20 border border-red-500/20">
                  <h4 className="font-semibold text-red-300 mb-2">Seismic Impact</h4>
                  <p className="text-sm"><strong>Earthquake magnitude:</strong> {fmt(analysisResults.seismic_impact.earthquake_magnitude, 1)}</p>
                  <p className="text-sm"><strong>MMI scale:</strong> {analysisResults.seismic_impact.mmi_scale} ({analysisResults.seismic_impact.earthquake_effects.level})</p>
                  <p className="text-sm"><strong>Fatalities:</strong> {fmt(analysisResults.seismic_impact.casualties.fatalities)} ({fmt(analysisResults.seismic_impact.casualties.fatalityRate, 2)}%)</p>
                  <p className="text-sm"><strong>Injuries:</strong> {fmt(analysisResults.seismic_impact.casualties.injuries)} ({fmt(analysisResults.seismic_impact.casualties.injuryRate, 2)}%)</p>
                </div>
                
                <div className="p-4 rounded-lg bg-cyan-900/20 border border-cyan-500/20">
                  <h4 className="font-semibold text-cyan-300 mb-2">Tsunami Impact</h4>
                  <p className="text-sm"><strong>Risk level:</strong> {analysisResults.tsunami_impact.risk}</p>
                  <p className="text-sm"><strong>Height:</strong> {fmt(analysisResults.tsunami_impact.height_m, 1)}m</p>
                  <p className="text-sm"><strong>Description:</strong> {analysisResults.tsunami_impact.description}</p>
                </div>
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-3 sm:mt-4">
              <Button onClick={downloadExcel} intent="primary" className="flex-1 sm:flex-none">📊 Download Excel Report</Button>
              <Button onClick={downloadJSON} intent="meteor" className="flex-1 sm:flex-none">📄 Download JSON Data</Button>
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
            <table className="min-w-[600px] w-full text-xs sm:text-sm">
              <thead className="text-left text-slate-300">
                <tr>
                  <th className="py-2 pr-2 sm:pr-4">Mass (kg)</th>
                  <th className="py-2 pr-2 sm:pr-4">Energy (KJ)</th>
                  <th className="py-2 pr-2 sm:pr-4">Yield (Mt TNT)</th>
                  <th className="py-2 pr-2 sm:pr-4">Crater dia (m)</th>
                  <th className="py-2 pr-2 sm:pr-4">Ring severe (km)</th>
                  <th className="py-2 pr-2 sm:pr-4">Ring heavy (km)</th>
                  <th className="py-2 pr-2 sm:pr-4">Ring light (km)</th>
                </tr>
              </thead>
              <tbody className="border-t border-slate-800">
                <tr>
                  <td className="py-2 pr-2 sm:pr-4">{fmt(physics.mass_kg)}</td>
                  <td className="py-2 pr-2 sm:pr-4">{fmt(physics.energy_J)}</td>
                  <td className="py-2 pr-2 sm:pr-4">{fmt(physics.energy_MtTNT)}</td>
                  <td className="py-2 pr-2 sm:pr-4">{fmt(physics.final_crater_diameter_m)}</td>
                  <td className="py-2 pr-2 sm:pr-4">{fmt(physics.rings_km.severe)}</td>
                  <td className="py-2 pr-2 sm:pr-4">{fmt(physics.rings_km.heavy)}</td>
                  <td className="py-2 pr-2 sm:pr-4">{fmt(physics.rings_km.light)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel title="Deflection Outcomes">
        {physics.atmospheric_burst ? (
          <div className="p-4 rounded-lg bg-green-900/20 border border-green-500/20">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <h4 className="font-semibold text-green-300">No Deflection Needed</h4>
            </div>
            <p className="text-sm text-green-200 mb-4">
              Since this meteor (diameter: {fmt(diameter_m)}m) will burst in the upper atmosphere, no deflection is necessary. 
              The atmospheric resistance will naturally break up the meteor before it can cause any surface damage.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-green-800/20 border border-green-400/20">
                <h5 className="font-medium text-green-300 mb-1">Deflection Required</h5>
                <p className="text-sm text-green-200">None - Kinetic impactor not needed</p>
              </div>
              <div className="p-3 rounded-lg bg-green-800/20 border border-green-400/20">
                <h5 className="font-medium text-green-300 mb-1">Surface Risk</h5>
                <p className="text-sm text-green-200">None - Atmospheric burst</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[600px] w-full text-xs sm:text-sm">
              <thead className="text-left text-slate-300">
                <tr>
                  <th className="py-2 pr-2 sm:pr-4">Scenario</th>
                  <th className="py-2 pr-2 sm:pr-4">Δv (mm/s)</th>
                  <th className="py-2 pr-2 sm:pr-4">Days to hit surface</th>
                  <th className="py-2 pr-2 sm:pr-4">Along-track shift (m)</th>
                  <th className="py-2 pr-2 sm:pr-4">Shifted lat</th>
                  <th className="py-2 pr-2 sm:pr-4">Shifted lon</th>
                </tr>
              </thead>
              <tbody className="border-t border-slate-800">
                <Row s={scenarioA} />
                <Row s={scenarioB} />
                {customScenario && <Row s={customScenario} />}
              </tbody>
            </table>
          </div>
        )}

        <Button className="mt-3 sm:mt-4 w-full sm:w-auto" onClick={downloadJSON}>📄 Download JSON</Button>
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
      <td className="py-2 pr-2 sm:pr-4">{s.label}</td>
      <td className="py-2 pr-2 sm:pr-4">{fmt(s.dv_mm_s)}</td>
      <td className="py-2 pr-2 sm:pr-4">{fmt(s.lead_days)}</td>
      <td className="py-2 pr-2 sm:pr-4">{fmt(s.along_m)}</td>
      <td className="py-2 pr-2 sm:pr-4">{fmt(s.point.lat, 6)}</td>
      <td className="py-2 pr-2 sm:pr-4">{fmt(s.point.lon, 6)}</td>
    </tr>
  );
}
