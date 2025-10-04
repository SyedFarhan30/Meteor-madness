import React, { createContext, useContext, useState } from "react";

const AppCtx = createContext(null);

export function AppProvider({ children }){
  const [settings, setSettings] = useState({
    colorblind: true,
    units: "metric"
  });

  return (
    <AppCtx.Provider value={{ settings, setSettings }}>
      {children}
    </AppCtx.Provider>
  );
}

export function useApp(){ return useContext(AppCtx); }
