import React from "react";
export function Panel({ title, children }){
  return (
    <div className="p-4 rounded-2xl bg-brand-panel border border-slate-800">
      <h2 className="text-lg font-semibold mb-2">{title}</h2>
      {children}
    </div>
  );
}
