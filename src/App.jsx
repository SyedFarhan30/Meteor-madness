import React, { useState } from "react";
import { AppProvider } from "./context/AppContext.jsx";
import Simulator from "./routes/Simulator.jsx";
import DefendEarth from "./routes/DefendEarth.jsx";
import Analysis from "./routes/Analysis.jsx";
import { AccessibleToggle } from "./components/AccessibleToggle.jsx";
import { t, setLocale, getLocale } from "./utils/i18n.js";

export default function App(){
  const [route, setRoute] = useState("sim"); // "sim" | "defend" | "analysis"
  const [lang, setLang] = useState(getLocale());

  function switchLang(e){
    const v = e.target.value;
    setLang(v);
    setLocale(v);
  }

  return (
    <AppProvider>
      <div className="min-h-screen text-slate-100 bg-brand-bg">
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-brand-bg/80 backdrop-blur border-b border-slate-800">
          <div className="max-w-7xl mx-auto px-3 py-3 flex items-center gap-3">
            <h1 className="text-lg md:text-2xl font-semibold">Impactor NEO</h1>

            <nav className="ml-4 flex gap-2">
              <button
                className={`px-3 py-1 rounded ${route==='sim' ? 'bg-slate-700' : 'bg-slate-800 hover:bg-slate-700'}`}
                onClick={()=>setRoute('sim')}
                aria-current={route==='sim' ? 'page' : undefined}
              >
                {t('simulator')}
              </button>

              <button
                className={`px-3 py-1 rounded ${route==='defend' ? 'bg-slate-700' : 'bg-slate-800 hover:bg-slate-700'}`}
                onClick={()=>setRoute('defend')}
                aria-current={route==='defend' ? 'page' : undefined}
              >
                {t('defend')}
              </button>

              <button
                className={`px-3 py-1 rounded ${route==='analysis' ? 'bg-slate-700' : 'bg-slate-800 hover:bg-slate-700'}`}
                onClick={()=>setRoute('analysis')}
                aria-current={route==='analysis' ? 'page' : undefined}
              >
                Analysis
              </button>
            </nav>

            <div className="ml-auto flex items-center gap-2">
              <label className="text-xs">{t('language')}</label>
              <select
                aria-label={t('language')}
                value={lang}
                onChange={switchLang}
                className="px-2 py-1 rounded bg-slate-800 border border-slate-700"
              >
                <option value="en">English</option>
                <option value="ur">Urdu (stub)</option>
              </select>
              <AccessibleToggle />
            </div>
          </div>
        </header>

        {/* Route switch */}
        {route === "sim" && <Simulator />}
        {route === "defend" && <DefendEarth />}
        {route === "analysis" && <Analysis />}

        <footer className="px-4 py-6 text-xs text-slate-400 border-t border-slate-800">
          NASA NeoWs / JPL SBDB; USGS EPQS. Physics simplified for education. Verify units before decisions.
        </footer>
      </div>
    </AppProvider>
  );
}
