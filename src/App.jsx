import React, { useState } from "react";
import { AppProvider } from "./context/AppContext.jsx";
import Simulator from "./routes/Simulator.jsx";
import Analysis from "./routes/Analysis.jsx";

export default function App(){
  const [route, setRoute] = useState("sim"); // "sim" | "analysis"

  return (
    <AppProvider>
      <div className="min-h-screen text-slate-100 bg-brand-bg">
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-brand-bg/80 backdrop-blur border-b border-slate-800">
          <div className="max-w-7xl mx-auto px-3 py-3 flex flex-col sm:flex-row items-center gap-3">
            <h1 className="text-lg sm:text-xl md:text-2xl font-semibold">Impactor NEO</h1>

            <nav className="flex gap-2">
              <button
                className={`px-3 py-1 rounded text-sm sm:text-base ${route==='sim' ? 'bg-slate-700' : 'bg-slate-800 hover:bg-slate-700'}`}
                onClick={()=>setRoute('sim')}
                aria-current={route==='sim' ? 'page' : undefined}
              >
                Simulator
              </button>

              <button
                className={`px-3 py-1 rounded text-sm sm:text-base ${route==='analysis' ? 'bg-slate-700' : 'bg-slate-800 hover:bg-slate-700'}`}
                onClick={()=>setRoute('analysis')}
                aria-current={route==='analysis' ? 'page' : undefined}
              >
                Analysis
              </button>
            </nav>
          </div>
        </header>

        {/* Route switch */}
        {route === "sim" && <Simulator />}
        {route === "analysis" && <Analysis />}

        <footer className="px-4 py-6 text-xs text-slate-400 border-t border-slate-800">
          <p>Designed and Developed  by :</p>
          <p>Saad Hussain, Farhan Ali, Raza Abbas, Ashir Ali, Muhammad Taha</p>
        </footer>
      </div>
    </AppProvider>
  );
}
