// NeoWs feed for today; returns陣列 of simplified objects
export async function fetchNEOToday(){
  const apiKey = import.meta.env.VITE_NASA_API_KEY;
  const today = new Date().toISOString().slice(0,10);
  const url = `https://api.nasa.gov/neo/rest/v1/feed?start_date=${today}&end_date=${today}&api_key=${encodeURIComponent(apiKey)}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error("NeoWs feed failed");
  const j = await r.json();

  const day = Object.keys(j.near_earth_objects)[0];
  const list = j.near_earth_objects[day] || [];
  return list.map(o => ({
    id: o.id,
    name: o.name,
    est_diameter_m: Number(
      (o.estimated_diameter?.meters?.estimated_diameter_min +
       o.estimated_diameter?.meters?.estimated_diameter_max)/2
    ),
    velocity_kms: Number(o.close_approach_data?.[0]?.relative_velocity?.kilometers_per_second)
  })).filter(x=>Number.isFinite(x.est_diameter_m) && Number.isFinite(x.velocity_kms));
}

export async function fetchNEOLookup(neoId){
  const apiKey = import.meta.env.VITE_NASA_API_KEY;
  const url = `https://api.nasa.gov/neo/rest/v1/neo/${encodeURIComponent(neoId)}?api_key=${encodeURIComponent(apiKey)}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error("NeoWs lookup failed");
  const d = await r.json();
  return {
    id: d.id,
    name: d.name,
    est_diameter_m: Number(
      (d.estimated_diameter?.meters?.estimated_diameter_min +
       d.estimated_diameter?.meters?.estimated_diameter_max)/2
    ),
    velocity_kms: Number(d.close_approach_data?.[0]?.relative_velocity?.kilometers_per_second || 19)
  };
}
