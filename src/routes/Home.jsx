import React from "react";
import { Panel } from "../components/Panel.jsx";
import { Button } from "../components/Button.jsx";

export default function Home({ onNavigate }){
  return (
    <div className="max-w-6xl mx-auto p-2 sm:p-3 md:p-4 lg:p-6 space-y-3 sm:space-y-4 lg:space-y-6">
      {/* Hero section */}
      <section className="relative overflow-hidden rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-900/80 to-slate-800/60 p-6 sm:p-8 shadow-xl">
        <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full blur-3xl opacity-20 bg-gradient-to-br from-orange-500/40 to-purple-600/40" />
        <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full blur-3xl opacity-20 bg-gradient-to-br from-blue-500/30 to-purple-500/30" />
        <div className="relative">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-orange-400 via-red-500 to-purple-500 bg-clip-text text-transparent">
            Meteor Madness: Planetary Defense Simulator
          </h1>
          <p className="mt-3 text-slate-300 text-sm sm:text-base max-w-3xl">
            A scientific, interactive platform to simulate meteor impacts, visualize damage zones, assess risk, and explore deflection strategies using a kinetic impactor. Built with React, Tailwind, Leaflet, and NASA data.
          </p>
          <div className="mt-4 flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Button intent="primary" onClick={()=>onNavigate?.("sim")} className="flex-1 sm:flex-none">🚀 Start Simulator</Button>
            <Button intent="meteor" onClick={()=>onNavigate?.("analysis")} className="flex-1 sm:flex-none">📊 Open Analysis</Button>
          </div>
        </div>
      </section>

      {/* What you can do */}
      <Panel title="What You Can Simulate">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
          <Card title="Simulate Meteors" icon="☄️" desc="Set diameter, density, velocity, angle, and location. See mass, energy, crater size, and damage radii."/>
          <Card title="Visualize Impact Effects" icon="🌋" desc="Thermal radiation, seismic waves, and shock wave zones rendered on an interactive map."/>
          <Card title="Deflect with Kinetic Impactor" icon="🛡️" desc="Compute Δv and along-track shift for multiple lead times to mitigate threats."/>
        </div>
      </Panel>

      {/* How mitigation works */}
      <Panel title="Mitigation Strategy: Kinetic Impactor">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 items-start">
          <div className="space-y-2 text-slate-300 text-sm">
            <p>
              We model a standard 1000 kg impactor at 10 km/s transferring momentum to the meteor. Effectiveness depends on meteor mass, speed, size, and available lead time before surface impact.
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>More days to hit surface → larger deflection</li>
              <li>Smaller/slower meteors → easier to deflect</li>
              <li>If diameter &lt; 25 m → atmospheric burn-up, no surface impact</li>
            </ul>
          </div>
          <div className="rounded-xl p-4 bg-slate-900/60 border border-slate-700/50">
            <h4 className="font-semibold mb-2">Impactor Specs</h4>
            <dl className="grid grid-cols-2 gap-2 text-sm">
              <DT k="Mass" v="1000 kg" />
              <DT k="Velocity" v="10 km/s" />
              <DT k="Energy" v="~10 GJ" />
              <DT k="TNT Equivalent" v="~12 tons" />
            </dl>
          </div>
        </div>
      </Panel>

      {/* APIs and Services */}
      <Panel title="APIs, Libraries & Data">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <InfoItem title="NASA NeoWs (Near-Earth Object Web Service)" link="https://api.nasa.gov/" badge="API">
            Live NEO feed and lookup for diameter and velocity. Requires `VITE_NASA_API_KEY`.
          </InfoItem>
          <InfoItem title="USGS EPQS (Elevation Point Query Service)" link="https://epqs.nationalmap.gov/" badge="API">
            Elevation at impact coordinates (US coverage). Used to enrich location context.
          </InfoItem>
          <InfoItem title="Leaflet" link="https://leafletjs.com/" badge="Map">
            Interactive map for selecting impact point and visualizing rings, crater, and deflection.
          </InfoItem>
          <InfoItem title="React + Vite + Tailwind" link="https://vite.dev/" badge="Stack">
            Modern front-end stack powering the UI, styles, and fast dev experience.
          </InfoItem>
          <InfoItem title="Physics Engine (custom)" link="#" badge="Model">
            Impact energy, crater scaling, damage zones, and kinetic-impactor Δv calculations.
          </InfoItem>
        </div>
      </Panel>

      {/* Extra details */}
      <Panel title="Relevant Scenarios & Insights">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 text-sm text-slate-300">
          <div className="space-y-2">
            <h4 className="font-semibold text-slate-200">Impact Effects</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>Thermal radiation (severe zone)</li>
              <li>Seismic activity and potential tsunamis</li>
              <li>Shock waves and structural damage</li>
              <li>Crater formation for larger meteors</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold text-slate-200">How to Use</h4>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Load today's NEOs or choose the sample</li>
              <li>Adjust impact parameters and location</li>
              <li>Simulate and review results</li>
              <li>Explore deflection scenarios and export data</li>
            </ol>
          </div>
        </div>
      </Panel>
    </div>
  );
}

function Card({ title, icon, desc }){
  return (
    <div className="p-4 rounded-xl bg-gradient-to-br from-slate-800/80 to-slate-900/60 border border-slate-700/50 hover:border-purple-500/30 transition-all hover-lift">
      <div className="text-2xl mb-2">{icon}</div>
      <h3 className="text-base sm:text-lg font-semibold text-slate-100">{title}</h3>
      <p className="text-sm text-slate-300 mt-1">{desc}</p>
    </div>
  );
}

function DT({ k, v }){
  return (
    <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-700/50">
      <div className="text-xs text-slate-400">{k}</div>
      <div className="font-semibold">{v}</div>
    </div>
  );
}

function InfoItem({ title, link, badge, children }){
  return (
    <div className="p-4 rounded-xl bg-gradient-to-br from-slate-800/80 to-slate-900/60 border border-slate-700/50">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700/60 border border-slate-600/50">{badge}</span>
        <a href={link} target="_blank" rel="noreferrer" className="font-semibold text-slate-100 hover:text-white underline decoration-purple-500/40">
          {title}
        </a>
      </div>
      <div className="text-sm text-slate-300">{children}</div>
    </div>
  );
}


