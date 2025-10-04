import React from "react";
export function Label({ text, children }){
  return (
    <label className="text-sm">
      <span className="block">{text}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
