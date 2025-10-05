import React from "react";

export function Button({ intent="neutral", className="", children, ...props }){
  const styles = {
    primary: "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-lg hover:shadow-xl glow-effect",
    success: "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg hover:shadow-xl deflection-glow",
    danger: "bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-lg hover:shadow-xl impact-glow",
    meteor: "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white shadow-lg hover:shadow-xl meteor-glow",
    neutral: "bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 text-slate-200 border border-slate-600/50 hover:border-purple-500/50"
  }[intent];
  
  return (
    <button 
      className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 active:scale-95 ${styles} ${className}`} 
      {...props}
    >
      {children}
    </button>
  );
}
