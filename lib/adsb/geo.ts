const EARTH_RADIUS_NM = 3440.065; // nautical miles

const WIDEBODY_PREFIXES = ['A33', 'A34', 'A35', 'A38', 'B74', 'B76', 'B77', 'B78'];
const WIDEBODY_EXACT = new Set([
  'A332', 'A333', 'A338', 'A339',
  'A342', 'A343', 'A345', 'A346',
  'A350', 'A359', 'A35K',
  'A380', 'A388',
  'B742', 'B743', 'B744', 'B748',
  'B762', 'B763', 'B764',
  'B772', 'B773', 'B77L', 'B77W',
  'B788', 'B789', 'B78X',
  'IL96', 'MD11',
]);

export function isWidebody(aircraftType: string | null): boolean {
  if (!aircraftType) return false;
  const t = aircraftType.toUpperCase();
  return WIDEBODY_EXACT.has(t) || WIDEBODY_PREFIXES.some((p) => t.startsWith(p));
}

const NARROWBODY_PREFIXES = ['A31', 'A32', 'B73', 'B75', 'B71', 'E17', 'E19', 'E29', 'C91', 'CRJ'];
const NARROWBODY_EXACT = new Set([
  'A318', 'A319', 'A320', 'A321', 'A19N', 'A20N', 'A21N',
  'B712', 'B731', 'B732', 'B733', 'B734', 'B735', 'B736', 'B737', 'B738', 'B739', 'B38M', 'B39M', 'B37M',
  'B752', 'B753',
  'E170', 'E175', 'E190', 'E195', 'E290', 'E295',
  'CRJ2', 'CRJ7', 'CRJ9', 'CRJX',
  'C919', 'BCS1', 'BCS3',
  'MD80', 'MD81', 'MD82', 'MD83', 'MD87', 'MD88', 'MD90',
  'B461', 'B462', 'B463',
  'DC93', 'DC95',
  'T204', 'SU95',
]);

export type AircraftSizeClass = 'small' | 'narrowbody' | 'widebody';

export function getAircraftSizeClass(aircraftType: string | null): AircraftSizeClass {
  if (!aircraftType) return 'small';
  const t = aircraftType.toUpperCase();
  if (WIDEBODY_EXACT.has(t) || WIDEBODY_PREFIXES.some((p) => t.startsWith(p))) return 'widebody';
  if (NARROWBODY_EXACT.has(t) || NARROWBODY_PREFIXES.some((p) => t.startsWith(p))) return 'narrowbody';
  return 'small';
}

/**
 * Haversine formula — returns distance in nautical miles between two lat/lon points.
 */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_NM * Math.asin(Math.sqrt(a));
}

/**
 * Predicts when an aircraft will enter the watch circle, assuming straight-line
 * flight at constant speed and heading.
 *
 * Works in a flat 2-D coordinate system (nm) centered on the watch point.
 * Solves the quadratic: |pos + vel*t|² = R²  →  at² + bt + c = 0
 *
 * Returns estimated minutes until entry, or null if the aircraft won't intersect
 * the circle (or is already inside it).
 */
export function predictEntryMinutes(
  aircraftLat: number,
  aircraftLon: number,
  headingDeg: number,
  groundSpeedKts: number,
  centerLat: number,
  centerLon: number,
  radiusNm: number,
): number | null {
  // Convert position to nm offsets from center (flat-earth approx, fine for < 500nm)
  const cosLat = Math.cos((centerLat * Math.PI) / 180);
  const x = (aircraftLon - centerLon) * cosLat * 60;
  const y = (aircraftLat - centerLat) * 60;

  const dist = Math.sqrt(x * x + y * y);
  if (dist <= radiusNm) return null; // already inside

  // Velocity in nm/min
  const speedNmPerMin = groundSpeedKts / 60;
  const hdRad = (headingDeg * Math.PI) / 180;
  const vx = speedNmPerMin * Math.sin(hdRad);
  const vy = speedNmPerMin * Math.cos(hdRad);

  // Quadratic coefficients
  const a = vx * vx + vy * vy;
  if (a === 0) return null; // stationary

  const b = 2 * (x * vx + y * vy);
  const c = x * x + y * y - radiusNm * radiusNm;
  const discriminant = b * b - 4 * a * c;

  if (discriminant < 0) return null; // no intersection

  const sqrtD = Math.sqrt(discriminant);
  const t1 = (-b - sqrtD) / (2 * a);
  const t2 = (-b + sqrtD) / (2 * a);

  // We want the smallest positive t (first entry into the circle)
  const t = t1 > 0 ? t1 : t2 > 0 ? t2 : null;
  if (t === null || t > 120) return null; // beyond 2 hours — not useful

  return Math.round(t);
}

/**
 * Returns a lat/lon bounding box for a given center point and radius in nautical miles.
 */
export function boundingBox(
  lat: number,
  lon: number,
  radiusNm: number,
): { lamin: number; lamax: number; lomin: number; lomax: number } {
  const latDeg = radiusNm / 60; // 1 nm ≈ 1 arcminute ≈ 1/60 degree
  const lonDeg = radiusNm / (60 * Math.cos((lat * Math.PI) / 180));
  return {
    lamin: lat - latDeg,
    lamax: lat + latDeg,
    lomin: lon - lonDeg,
    lomax: lon + lonDeg,
  };
}
