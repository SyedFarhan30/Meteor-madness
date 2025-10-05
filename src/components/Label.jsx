import React from "react";

export function Label({ text, children, className = "" }){
  return (
    <label className={`block text-sm font-medium ${className}`}>
      <span className="block text-slate-300 mb-2">{text}</span>
      <div className="relative">
        {children}
        {/* Input focus glow effect */}
        <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-purple-500/10 to-blue-500/10 opacity-0 focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
      </div>
    </label>
  );
}
