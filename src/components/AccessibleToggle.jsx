import React from "react";
import { useApp } from "../context/AppContext.jsx";

export function AccessibleToggle(){
  const { settings, setSettings } = useApp();
  return (
    <label className="inline-flex items-center gap-2 text-xs">
      <input
        type="checkbox"
        checked={!!settings.colorblind}
        onChange={e=>setSettings(s=>({...s, colorblind: e.target.checked}))}
      />
      <span>Colorblind palette</span>
    </label>
  );
}
