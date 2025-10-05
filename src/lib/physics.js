export const R_E = 6_371_000; // m
const g = 9.81;
const G = 6.67430e-11; // gravitational constant
const EARTH_MASS = 5.972e24; // kg

export function deg2rad(d){ return d*Math.PI/180; }
export function km2m(x){ return x*1000; }
export function fmt(n, d=2){ return Number(n).toLocaleString(undefined, { maximumFractionDigits:d }); }

export function impactModel(d_m, rho, v_kms, angle_deg){
  const r = d_m/2;
  const mass = (4/3)*Math.PI*r**3*rho;     // kg
  const v = km2m(v_kms);                   // m/s
  const E = (0.5 * mass * v ** 2) / 1000; // now in kilojoules (kJ)
  const Mt = E/4.184e15;                   // megatons TNT

  // Check for atmospheric burst (diameter < 25m)
  const atmosphericBurst = d_m < 25;
  
  if (atmosphericBurst) {
    return {
      mass_kg: mass,
      energy_J: E,
      energy_MtTNT: Mt,
      atmospheric_burst: true,
      burst_altitude_km: 20 + Math.random() * 30, // 20-50 km altitude
      final_crater_diameter_m: 0,
      rings_km: { severe: 0, heavy: 0, light: 0 },
      damage_zones: {
        thermal: { radius_km: 0, description: "No surface impact - meteor bursts in upper atmosphere" },
        seismic: { radius_km: 0, description: "No surface impact - meteor bursts in upper atmosphere" },
        shock: { radius_km: 0, description: "No surface impact - meteor bursts in upper atmosphere" }
      }
    };
  }

  const rho_t = 2500;                      // rock target
  const angleFactor = Math.sin(deg2rad(angle_deg))**0.44;
  const vFactor = (v/1000)**0.44;          // km/s scaling
  const densityFactor = (rho/rho_t)**(1/3);

  const D_final_m = 1.2*Math.pow(g,-0.17)*vFactor*angleFactor*densityFactor*Math.pow(d_m,0.78);

  const severe_km = Math.max(2, 1.3*Math.cbrt(Mt));
  const heavy_km  = severe_km*2.2;
  const light_km  = heavy_km*2.0;

  return {
    mass_kg: mass,
    energy_J: E,
    energy_MtTNT: Mt,
    atmospheric_burst: false,
    final_crater_diameter_m: D_final_m,
    rings_km: { severe: severe_km, heavy: heavy_km, light: light_km },
    damage_zones: {
      thermal: { radius_km: severe_km, description: "Complete devastation - all things will evaporate" },
      seismic: { radius_km: heavy_km, description: "Severe earthquakes. In coastal areas, tsunamis" },
      shock: { radius_km: light_km, description: "Shock waves, shattering glass and weak materials, wiping trees out" }
    }
  };
}

export function metersToLatLonDelta(metersEast, metersNorth, latDeg){
  const dLat = (metersNorth/R_E)*(180/Math.PI);
  const dLon = (metersEast/(R_E*Math.cos(deg2rad(latDeg))))*(180/Math.PI);
  return { dLat, dLon };
}

// Additional orbital mechanics functions that might be needed

/**
 * Calculate orbital velocity at given distance from Earth center
 * @param {number} r - Distance from Earth center in meters
 * @returns {number} Orbital velocity in m/s
 */
export function orbitalVelocity(r) {
  return Math.sqrt(G * EARTH_MASS / r);
}

/**
 * Calculate escape velocity at given distance from Earth center
 * @param {number} r - Distance from Earth center in meters
 * @returns {number} Escape velocity in m/s
 */
export function escapeVelocity(r) {
  return Math.sqrt(2 * G * EARTH_MASS / r);
}

/**
 * Calculate asteroid mass from diameter and density
 * @param {number} diameter_m - Diameter in meters
 * @param {number} density - Density in kg/m³ (default: 2500 for rocky asteroids)
 * @returns {number} Mass in kg
 */
export function calculateMass(diameter_m, density = 2500) {
  const radius = diameter_m / 2;
  const volume = (4/3) * Math.PI * Math.pow(radius, 3);
  return volume * density;
}

/**
 * Kinetic Impactor System
 * Standard impactor specifications:
 * - Mass: 1000 kg
 * - Velocity: 10,000 m/s (10 km/s)
 * - Energy: ~10^10 J (10 GJ)
 * - TNT equivalent: ~12 tons
 */
const IMPACTOR_MASS = 1000; // kg
const IMPACTOR_VELOCITY = 10000; // m/s
const IMPACTOR_ENERGY = 0.5 * IMPACTOR_MASS * IMPACTOR_VELOCITY * IMPACTOR_VELOCITY; // J

/**
 * Calculate delta V (deflection velocity) using kinetic impactor
 * @param {number} meteorMass - Mass of the meteor in kg
 * @param {number} meteorVelocity - Velocity of meteor in m/s
 * @param {number} leadTimeDays - Days to hit the surface
 * @param {number} meteorDiameter - Diameter of meteor in meters
 * @returns {number} Delta V in mm/s
 */
export function calculateKineticImpactorDeltaV(meteorMass, meteorVelocity, leadTimeDays, meteorDiameter) {
  // Impactor effectiveness depends on meteor properties
  // Larger, slower meteors are easier to deflect
  const sizeFactor = Math.min(1, meteorDiameter / 100); // Normalize by 100m reference
  const velocityFactor = Math.max(0.1, 20 / meteorVelocity); // Slower meteors easier to deflect
  
  // Mass ratio effect - lighter meteors deflect more
  const massRatio = IMPACTOR_MASS / meteorMass;
  const massFactor = Math.min(1, massRatio * 10); // Scale factor
  
  // Days to hit surface effect - more time = more deflection
  const timeFactor = leadTimeDays === 0 ? 0 : Math.min(2, leadTimeDays / 180); // Normalize by 180 days
  
  // Base delta V calculation
  const baseDeltaV = (IMPACTOR_ENERGY / meteorMass) * 1000; // Convert to mm/s
  
  // Apply all factors
  const deltaV = baseDeltaV * sizeFactor * velocityFactor * massFactor * timeFactor;
  
  return Math.max(0, deltaV); // Ensure non-negative
}

/**
 * Get kinetic impactor information
 * @returns {object} Impactor specifications
 */
export function getKineticImpactorInfo() {
  return {
    mass_kg: IMPACTOR_MASS,
    velocity_ms: IMPACTOR_VELOCITY,
    energy_J: IMPACTOR_ENERGY,
    energy_tnt_tons: IMPACTOR_ENERGY / (4.184e9), // Convert to tons TNT
    description: "Standard kinetic impactor: 1000kg mass, 10km/s velocity, ~12 tons TNT equivalent"
  };
}