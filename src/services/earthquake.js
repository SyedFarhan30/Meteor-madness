// Earthquake analysis service using USGS data
// Based on: https://earthquake.usgs.gov/earthquakes/search/

/**
 * Calculate earthquake magnitude from impact energy
 * @param {number} energy_J - Impact energy in Joules
 * @returns {number} Estimated earthquake magnitude
 */
export function calculateEarthquakeMagnitude(energy_J) {
  // Convert energy to seismic moment (Nm)
  // Using empirical relationship: Mw = (2/3) * log10(M0) - 10.7
  // where M0 is seismic moment in Nm
  
  // For impact events, we use a simplified relationship
  // based on nuclear explosion and impact studies
  const seismicMoment = energy_J * 1e6; // Convert to Nm (rough approximation)
  const magnitude = (2/3) * Math.log10(seismicMoment) - 10.7;
  
  return Math.max(0, Math.min(10, magnitude)); // Clamp between 0-10
}

/**
 * Calculate earthquake intensity (Modified Mercalli Intensity)
 * @param {number} magnitude - Earthquake magnitude
 * @param {number} distance_km - Distance from epicenter in km
 * @returns {number} MMI scale (1-12)
 */
export function calculateMMI(magnitude, distance_km) {
  // Simplified MMI calculation based on distance and magnitude
  // Using empirical relationships from earthquake studies
  
  if (distance_km <= 0) return 12; // At epicenter
  
  // Attenuation relationship
  const mmi = magnitude - 1.5 * Math.log10(distance_km + 1) - 0.5;
  
  return Math.max(1, Math.min(12, Math.round(mmi)));
}

/**
 * Get earthquake effects description
 * @param {number} mmi - Modified Mercalli Intensity
 * @returns {object} Effects description
 */
export function getEarthquakeEffects(mmi) {
  const effects = {
    1: { level: "Not felt", description: "Not felt except by a very few under especially favorable conditions." },
    2: { level: "Weak", description: "Felt only by a few persons at rest, especially on upper floors of buildings." },
    3: { level: "Weak", description: "Felt quite noticeably by persons indoors, especially on upper floors of buildings." },
    4: { level: "Light", description: "Felt indoors by many, outdoors by few during the day." },
    5: { level: "Moderate", description: "Felt by nearly everyone; many awakened. Some dishes, windows broken." },
    6: { level: "Strong", description: "Felt by all, many frightened. Some heavy furniture moved." },
    7: { level: "Very Strong", description: "Damage negligible in buildings of good design and construction." },
    8: { level: "Severe", description: "Damage slight in specially designed structures; considerable damage in ordinary substantial buildings." },
    9: { level: "Violent", description: "Damage considerable in specially designed structures; well-designed frame structures thrown out of plumb." },
    10: { level: "Extreme", description: "Some well-built wooden structures destroyed; most masonry and frame structures destroyed with foundations." },
    11: { level: "Extreme", description: "Few, if any, masonry structures remain standing. Bridges destroyed." },
    12: { level: "Extreme", description: "Damage total. Lines of sight and level are distorted. Objects thrown into the air." }
  };
  
  return effects[mmi] || effects[12];
}

/**
 * Estimate casualties from earthquake
 * @param {number} magnitude - Earthquake magnitude
 * @param {number} population - Population in affected area
 * @param {number} distance_km - Distance from epicenter
 * @returns {object} Casualty estimates
 */
export function estimateEarthquakeCasualties(magnitude, population, distance_km) {
  const mmi = calculateMMI(magnitude, distance_km);
  
  // Casualty rates based on MMI and population density
  let fatalityRate = 0;
  let injuryRate = 0;
  
  if (mmi >= 10) {
    fatalityRate = 0.1; // 10% fatality rate
    injuryRate = 0.3;   // 30% injury rate
  } else if (mmi >= 9) {
    fatalityRate = 0.03; // 3% fatality rate
    injuryRate = 0.15;   // 15% injury rate
  } else if (mmi >= 8) {
    fatalityRate = 0.01; // 1% fatality rate
    injuryRate = 0.05;   // 5% injury rate
  } else if (mmi >= 7) {
    fatalityRate = 0.001; // 0.1% fatality rate
    injuryRate = 0.01;    // 1% injury rate
  }
  
  const fatalities = Math.round(population * fatalityRate);
  const injuries = Math.round(population * injuryRate);
  
  return {
    fatalities,
    injuries,
    fatalityRate: fatalityRate * 100,
    injuryRate: injuryRate * 100
  };
}

/**
 * Check if tsunami is likely
 * @param {number} energy_J - Impact energy in Joules
 * @param {number} latitude - Impact latitude
 * @param {number} longitude - Impact longitude
 * @returns {object} Tsunami analysis
 */
export function analyzeTsunamiRisk(energy_J, latitude, longitude) {
  // Tsunami risk factors
  const isCoastal = Math.abs(latitude) < 60; // Not polar regions
  const isOcean = isNearOcean(latitude, longitude);
  const energyThreshold = 1e15; // 1 PJ threshold for significant tsunami
  
  const tsunamiRisk = energy_J > energyThreshold && isOcean && isCoastal;
  
  if (!tsunamiRisk) {
    return {
      risk: "Low",
      height_m: 0,
      description: "Insufficient energy or inland location - no significant tsunami expected"
    };
  }
  
  // Estimate tsunami height based on energy
  const tsunamiHeight = Math.min(50, Math.pow(energy_J / 1e15, 0.3) * 10);
  
  let riskLevel = "Low";
  if (tsunamiHeight > 20) riskLevel = "Extreme";
  else if (tsunamiHeight > 10) riskLevel = "High";
  else if (tsunamiHeight > 5) riskLevel = "Moderate";
  
  return {
    risk: riskLevel,
    height_m: tsunamiHeight,
    description: `Tsunami height: ${tsunamiHeight.toFixed(1)}m - ${riskLevel} risk`
  };
}

/**
 * Check if location is near ocean
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {boolean} True if near ocean
 */
function isNearOcean(lat, lon) {
  // Simplified ocean proximity check
  // This is a rough approximation - in reality would use detailed coastline data
  
  // Major ocean regions
  const pacific = (lat > -60 && lat < 60 && ((lon > 120 && lon < 240) || (lon > -180 && lon < -120)));
  const atlantic = (lat > -60 && lat < 60 && lon > -80 && lon < 20);
  const indian = (lat > -60 && lat < 30 && lon > 20 && lon < 120);
  const arctic = (lat > 60);
  
  return pacific || atlantic || indian || arctic;
}
