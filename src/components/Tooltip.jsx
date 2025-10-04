import React from "react";
export function Tooltip({ label }){
  return (
    <span
      tabIndex={0}
      title={label}
      aria-label={label}
      className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full bg-slate-700 text-[10px]">?</span>
  );
}
