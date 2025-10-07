import React, { useEffect, useRef, useState } from "react";
import { Panel } from "../components/Panel.jsx";
import { Button } from "../components/Button.jsx";
import { MapPane } from "../components/MapPane.jsx";
import { impactModel, metersToLatLonDelta } from "../lib/physics.js";

export default function DefendEarth(){
  const [timeLeft, setTimeLeft] = useState(60);
  const [score, setScore] = useState(0);
  const [running, setRunning] = useState(false);
  const timerRef = useRef(null);

  const [impact, setImpact] = useState({ lat: 24.86, lon: 67.00, elev: null });
  const [dia, setDia] = useState(120 + Math.floor(Math.random()*80));
  const [vel, setVel] = useState(18 + Math.random()*6);
  const [rho, setRho] = useState(3000);
  const [angle, setAngle] = useState(45);

  const [dv, setDv] = useState(0);
  const [lead, setLead] = useState(0);
  const [result, setResult] = useState(null);

  function start(){
    setRunning(true); setTimeLeft(60); setScore(0);
    timerRef.current = setInterval(()=> setTimeLeft(t=>t-1), 1000);
  }
  function stop(){
    setRunning(false);
    if (timerRef.current) clearInterval(timerRef.current);
  }

  useEffect(()=>{
    if (!running) return;
    if (timeLeft<=0) { stop(); return; }
  },[timeLeft, running]);

  function randomizeThreat(){
    setImpact({ lat: (Math.random()*140-70), lon: (Math.random()*360-180), elev:null });
    setDia(80 + Math.floor(Math.random()*160));
    setVel(15 + Math.random()*10);
    setRho(2500 + Math.random()*2000);
    setAngle(25 + Math.random()*50);
    setResult(null);
    setDv(0); setLead(0);
  }

  function applyDv(){
    const m = impactModel(dia, rho, vel, angle);
    
    // If atmospheric burst, no deflection needed
    if (m.atmospheric_burst) {
      setResult({ rings: null, deflect: null, atmospheric_burst: true });
      setScore(s => s + 50); // Bonus points for atmospheric burst
      return;
    }
    
    const dv_mps = (dv||0)/1000;
    const t_s = (lead||0)*86400;
    const shift = dv_mps * t_s;

    const { dLat, dLon } = metersToLatLonDelta(shift,0,impact.lat);
    const def = { lat: impact.lat + dLat, lon: impact.lon + dLon };
    setResult({ rings:m.rings_km, deflect:def, atmospheric_burst: false });

    // scoring: more shift = more points; quick heuristic
    setScore(s => s + Math.min(100, Math.floor(shift/1000)));
  }

  useEffect(()=>{ if (running) randomizeThreat(); },[running]);

  return (
    <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-[minmax(0,380px)_1fr] gap-4 p-4">
      <section className="space-y-4">
        <Panel title="Defend Earth (Arcade)">
          <p className="text-sm text-slate-300">You have <b>{timeLeft}s</b>. Apply Δv early to push impacts away. Score more for bigger shifts.</p>
          {result?.atmospheric_burst && (
            <div className="p-3 rounded-lg bg-blue-900/20 border border-blue-500/20 mt-2">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium text-blue-300">Atmospheric Burst!</span>
              </div>
              <p className="text-xs text-blue-200">This meteor will burst in the atmosphere - no deflection needed!</p>
            </div>
          )}
          <div className="flex gap-2 mt-2">
            {!running ? <Button intent="primary" onClick={start}>Start</Button> : <Button onClick={stop}>Stop</Button>}
            <Button onClick={randomizeThreat}>New Threat</Button>
          </div>
          <p className="text-xs text-slate-400 mt-2">Score: <b>{score}</b></p>
        </Panel>

        <Panel title="Threat Parameters">
          <div className="text-xs text-slate-400 mb-2">@ lat {impact.lat.toFixed(3)}, lon {impact.lon.toFixed(3)}</div>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm">Diameter (m)
              <input type="number" value={dia} onChange={e=>setDia(+e.target.value)} className="w-full px-2 py-2 rounded bg-slate-900 border border-slate-700"/>
            </label>
            <label className="text-sm">Density (kg/m³)
              <input type="number" value={rho} onChange={e=>setRho(+e.target.value)} className="w-full px-2 py-2 rounded bg-slate-900 border border-slate-700"/>
            </label>
            <label className="text-sm">Velocity (km/s)
              <input type="number" value={vel} onChange={e=>setVel(+e.target.value)} className="w-full px-2 py-2 rounded bg-slate-900 border border-slate-700"/>
            </label>
            <label className="text-sm">Angle (°)
              <input type="number" value={angle} onChange={e=>setAngle(+e.target.value)} className="w-full px-2 py-2 rounded bg-slate-900 border border-slate-700"/>
            </label>
          </div>
        </Panel>

        <Panel title="Your Move (Δv)">
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm">Δv (mm/s)
              <input type="number" value={dv} onChange={e=>setDv(+e.target.value)} className="w-full px-2 py-2 rounded bg-slate-900 border border-slate-700"/>
            </label>
            <label className="text-sm">Lead (days)
              <input type="number" value={lead} onChange={e=>setLead(+e.target.value)} className="w-full px-2 py-2 rounded bg-slate-900 border border-slate-700"/>
            </label>
          </div>
          <Button className="mt-3 w-full" intent="success" onClick={applyDv}>Apply</Button>
        </Panel>
      </section>

      <div className="order-last md:order-none w-full min-h-[52vh] md:min-h-[60vh]">
        <MapPane
          point={impact}
          onMove={(lat,lon)=>setImpact({ ...impact, lat, lon })}
          rings={result?.atmospheric_burst ? null : result?.rings}
          deflectPoint={result?.atmospheric_burst ? null : result?.deflect}
        />
      </div>
    </div>
  );
}
