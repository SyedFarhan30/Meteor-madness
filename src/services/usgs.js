// USGS Elevation Point Query Service (meters). Returns null outside US coverage.
export async function epqsElevation(lat, lon){
  try {
    const url = `https://epqs.nationalmap.gov/v1/json?x=${lon}&y=${lat}&units=Meters&wkid=4326`;
    const r = await fetch(url);
    if (!r.ok) return null;
    const j = await r.json();
    return j?.value ?? null;
  } catch { return null; }
}
