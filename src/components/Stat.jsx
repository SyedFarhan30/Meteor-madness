import React from "react";

export function Stat({ label, value, className = "" }){
  return (
    <div className={`group relative p-4 rounded-xl bg-gradient-to-br from-slate-800/80 to-slate-900/60 border border-slate-700/50 hover:border-purple-500/30 transition-all duration-300 hover:shadow-lg hover-lift ${className}`}>
      {/* Subtle glow on hover */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-purple-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      <div className="relative">
        <div className="text-xs text-slate-400 font-medium mb-1">{label}</div>
        <div className="text-lg font-bold bg-gradient-to-r from-slate-200 to-slate-300 bg-clip-text text-transparent">
          {value}
        </div>
      </div>
    </div>
  );
}
