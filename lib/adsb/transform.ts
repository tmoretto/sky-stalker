import type { Aircraft } from '@/types';
import type { AirplanesLiveAircraft, OpenSkyStateVector } from './types';
import { icaoHexToCountry } from './icao-country';

function metersToFeet(m: number): number {
  return Math.round(m * 3.28084);
}

function msToKnots(ms: number): number {
  return Math.round(ms * 1.94384);
}

export function transformAirplanesLive(raw: AirplanesLiveAircraft): Aircraft | null {
  // Require a valid position
  if (raw.lat == null || raw.lon == null) return null;

  const altBaro = raw.alt_baro === 'ground' ? 0 : (raw.alt_baro ?? raw.alt_geom ?? null);

  return {
    hex: raw.hex.toLowerCase(),
    callsign: raw.flight?.trim() || null,
    registration: raw.r?.trim() || null,
    aircraftType: raw.t?.trim() || null,
    airline: raw.flight ? deriveAirline(raw.flight.trim()) : null,
    countryCode: icaoHexToCountry(raw.hex),
    lat: raw.lat,
    lon: raw.lon,
    altitude: altBaro != null ? Math.round(altBaro) : null,
    groundSpeed: raw.gs != null ? Math.round(raw.gs) : null,
    heading: raw.track != null ? Math.round(raw.track) : null,
    verticalRate: raw.baro_rate != null ? Math.round(raw.baro_rate) : null,
    squawk: raw.squawk ?? null,
    emergency: !!raw.emergency && raw.emergency !== 'none',
    onGround: raw.alt_baro === 'ground',
    lastSeen: Date.now() - (raw.seen ?? 0) * 1000,
    origin: raw.from_iata?.trim() || null,
    destination: raw.to_iata?.trim() || null,
  };
}

export function transformOpenSky(state: OpenSkyStateVector): Aircraft | null {
  const lon = state[5];
  const lat = state[6];
  if (lat == null || lon == null) return null;

  const altMeters = state[7];
  const velocityMs = state[9];
  const vertRateMs = state[11];

  return {
    hex: state[0].toLowerCase(),
    callsign: state[1]?.trim() || null,
    registration: null,
    aircraftType: null,
    airline: state[1] ? deriveAirline(state[1].trim()) : null,
    countryCode: icaoHexToCountry(state[0]),
    lat,
    lon,
    altitude: altMeters != null ? metersToFeet(altMeters) : null,
    groundSpeed: velocityMs != null ? msToKnots(velocityMs) : null,
    heading: state[10] != null ? Math.round(state[10]!) : null,
    verticalRate: vertRateMs != null ? metersToFeet(vertRateMs) : null,
    squawk: state[14] ?? null,
    emergency: state[15],
    onGround: state[8],
    lastSeen: state[4] * 1000,
    origin: null,
    destination: null,
  };
}

/**
 * Derives a 3-letter ICAO airline code from a callsign (first 3 alpha chars).
 * Returns null for private/numeric callsigns.
 */
function deriveAirline(callsign: string): string | null {
  const match = callsign.match(/^([A-Z]{3})/);
  return match ? match[1] : null;
}
