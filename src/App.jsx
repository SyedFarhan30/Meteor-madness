import React, { useState, useEffect } from "react";
import { AppProvider } from "./context/AppContext.jsx";
import Simulator from "./routes/Simulator.jsx";
import Analysis from "./routes/Analysis.jsx";
import Home from "./routes/Home.jsx";

export default function App(){
  const [route, setRoute] = useState("home"); // "home" | "sim" | "analysis"

  // Add meteor shower effect
  useEffect(() => {
    const createMeteor = () => {
      const meteor = document.createElement('div');
      meteor.className = 'meteor';
      meteor.style.left = Math.random() * 100 + '%';
      meteor.style.top = Math.random() * 100 + '%';
      meteor.style.animationDelay = Math.random() * 3 + 's';
      meteor.style.animationDuration = (Math.random() * 3 + 2) + 's';
      
      document.body.appendChild(meteor);
      
      setTimeout(() => {
        meteor.remove();
      }, 5000);
    };

    const createParticle = () => {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.style.left = Math.random() * 100 + '%';
      particle.style.top = Math.random() * 100 + '%';
      particle.style.animationDelay = Math.random() * 6 + 's';
      
      document.body.appendChild(particle);
      
      setTimeout(() => {
        particle.remove();
      }, 6000);
    };

    // Create initial meteors and particles
    for (let i = 0; i < 3; i++) {
      setTimeout(createMeteor, i * 1000);
      setTimeout(createParticle, i * 500);
    }

    // Continue creating meteors and particles
    const meteorInterval = setInterval(createMeteor, 3000);
    const particleInterval = setInterval(createParticle, 2000);

    return () => {
      clearInterval(meteorInterval);
      clearInterval(particleInterval);
    };
  }, []);

  return (
    <AppProvider>
      <div className="min-h-screen text-slate-100 relative overflow-hidden">
        {/* Cosmic background effects */}
        <div className="meteor-shower"></div>
        
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-gradient-to-r from-slate-900/90 via-purple-900/80 to-slate-900/90 backdrop-blur-xl border-b border-purple-500/20 shadow-2xl">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
              {/* Logo and title */}
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center glow-effect">
                  <span className="text-white font-bold text-sm sm:text-lg">☄️</span>
                </div>
                <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-orange-400 via-red-500 to-purple-500 bg-clip-text text-transparent">
                  Impactor NEO
                </h1>
              </div>

              {/* Navigation */}
              <nav className="flex gap-1 sm:gap-2 w-full sm:w-auto justify-center sm:justify-end">
                <button
                  className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm md:text-base font-medium transition-all duration-300 flex-1 sm:flex-none ${
                    route==='home' 
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg glow-effect' 
                      : 'bg-slate-800/50 hover:bg-slate-700/70 text-slate-300 hover:text-white border border-slate-600/50 hover:border-purple-500/50'
                  }`}
                  onClick={()=>setRoute('home')}
                  aria-current={route==='home' ? 'page' : undefined}
                >
                  <span className="hidden sm:inline">🏠 </span>Home
                </button>
                <button
                  className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm md:text-base font-medium transition-all duration-300 flex-1 sm:flex-none ${
                    route==='sim' 
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg glow-effect' 
                      : 'bg-slate-800/50 hover:bg-slate-700/70 text-slate-300 hover:text-white border border-slate-600/50 hover:border-purple-500/50'
                  }`}
                  onClick={()=>setRoute('sim')}
                  aria-current={route==='sim' ? 'page' : undefined}
                >
                  <span className="hidden sm:inline">🚀 </span>Simulator
                </button>

                <button
                  className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm md:text-base font-medium transition-all duration-300 flex-1 sm:flex-none ${
                    route==='analysis' 
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg glow-effect' 
                      : 'bg-slate-800/50 hover:bg-slate-700/70 text-slate-300 hover:text-white border border-slate-600/50 hover:border-purple-500/50'
                  }`}
                  onClick={()=>setRoute('analysis')}
                  aria-current={route==='analysis' ? 'page' : undefined}
                >
                  <span className="hidden sm:inline">📊 </span>Analysis
                </button>
              </nav>
            </div>
          </div>
        </header>

        {/* Route switch with fade animation */}
        <div className="relative">
          {route === "home" && (
            <div className="animate-fadeIn">
              <Home onNavigate={setRoute} />
            </div>
          )}
          {route === "sim" && (
            <div className="animate-fadeIn">
              <Simulator />
            </div>
          )}
          {route === "analysis" && (
            <div className="animate-fadeIn">
              <Analysis />
            </div>
          )}
        </div>

        <footer className="px-3 sm:px-4 lg:px-6 py-6 sm:py-8 text-center text-xs sm:text-sm text-slate-400 border-t border-slate-800/50 bg-gradient-to-r from-slate-900/50 to-purple-900/30">
          <div className="max-w-4xl mx-auto">
            <p className="mb-2 font-medium text-slate-300">Designed and Developed by:</p>
            <p className="text-slate-400 mb-3 sm:mb-4">Saad Hussain, Farhan Ali, Raza Abbas, Ashir Ali, Muhammad Taha</p>
            <div className="flex flex-wrap justify-center gap-2 sm:gap-4 text-xs">
              <span className="px-2 sm:px-3 py-1 bg-slate-800/50 rounded-full border border-slate-600/30">🌌 Space Physics</span>
              <span className="px-2 sm:px-3 py-1 bg-slate-800/50 rounded-full border border-slate-600/30">☄️ Impact Modeling</span>
              <span className="px-2 sm:px-3 py-1 bg-slate-800/50 rounded-full border border-slate-600/30">🚀 Deflection Analysis</span>
            </div>
          </div>
        </footer>
      </div>
    </AppProvider>
  );
}
