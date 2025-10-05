import React from "react";

export function Panel({ title, children, className = "" }){
  return (
    <div className={`group relative p-6 rounded-2xl bg-gradient-to-br from-slate-900/80 to-slate-800/60 border border-slate-700/50 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 hover:border-purple-500/30 hover:bg-gradient-to-br hover:from-slate-900/90 hover:to-slate-800/70 hover-lift ${className}`}>
      {/* Subtle glow effect on hover */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      {/* Panel header */}
      <div className="relative flex items-center gap-3 mb-4">
        <div className="w-2 h-2 bg-gradient-to-r from-orange-400 to-red-500 rounded-full glow-effect"></div>
        <h2 className="text-xl font-bold bg-gradient-to-r from-slate-200 to-slate-400 bg-clip-text text-transparent">
          {title}
        </h2>
        <div className="flex-1 h-px bg-gradient-to-r from-slate-600/50 to-transparent"></div>
      </div>
      
      {/* Panel content */}
      <div className="relative">
        {children}
      </div>
    </div>
  );
}
