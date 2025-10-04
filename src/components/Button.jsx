import React from "react";
export function Button({ intent="neutral", className="", ...props }){
  const styles = {
    primary: "bg-indigo-600 hover:bg-indigo-500",
    success: "bg-emerald-600 hover:bg-emerald-500",
    neutral: "bg-slate-700 hover:bg-slate-600"
  }[intent];
  return <button className={`px-3 py-2 rounded-xl ${styles} ${className}`} {...props} />;
}
