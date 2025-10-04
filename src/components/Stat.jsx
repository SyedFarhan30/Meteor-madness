import React from "react";
export function Stat({ label, value }){
  return (
    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
      <div className="text-xs text-slate-400">{label}</div>
      <div className="text-base font-semibold">{value}</div>
    </div>
  );
}
