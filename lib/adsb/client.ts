import type { Aircraft, NearbyAircraftResponse } from '@/types';
import type { AirplanesLiveResponse, OpenSkyResponse } from './types';
import { transformAirplanesLive, transformOpenSky } from './transform';
import { boundingBox } from './geo';

const AIRPLANES_LIVE_BASE = 'https://api.airplanes.live/v2';
const OPENSKY_BASE = 'https://opensky-network.org/api';

// Server-side rate limiter: track last request time
let lastRequestAt = 0;

async function enforceRateLimit(): Promise<void> {
  const now = Date.now();
  const elapsed = now - lastRequestAt;
  if (elapsed < 1000) {
    await new Promise((resolve) => setTimeout(resolve, 1000 - elapsed));
  }
  lastRequestAt = Date.now();
}

async function fetchWithRetry(url: string, attempts = 3): Promise<Response> {
  let lastError: Error | null = null;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, { next: { revalidate: 0 } });
      if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
      return res;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (i < attempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, 2 ** i * 500));
      }
    }
  }
  throw lastError!;
}

export async function fetchNearbyAircraft(
  lat: number,
  lon: number,
  radiusNm: number,
): Promise<NearbyAircraftResponse> {
  await enforceRateLimit();

  try {
    const url = `${AIRPLANES_LIVE_BASE}/point/${lat}/${lon}/${radiusNm}`;
    const res = await fetchWithRetry(url);
    const data = (await res.json()) as AirplanesLiveResponse;

    const aircraft = data.ac
      .map(transformAirplanesLive)
      .filter((a): a is Aircraft => a !== null);

    return { aircraft, fetchedAt: data.now, source: 'airplanes.live' };
  } catch (primaryError) {
    console.warn('Airplanes.live failed, falling back to OpenSky:', primaryError);
    return fetchOpenSkyFallback(lat, lon, radiusNm);
  }
}

async function fetchOpenSkyFallback(
  lat: number,
  lon: number,
  radiusNm: number,
): Promise<NearbyAircraftResponse> {
  const { lamin, lamax, lomin, lomax } = boundingBox(lat, lon, radiusNm);
  const url = `${OPENSKY_BASE}/states/all?lamin=${lamin}&lomin=${lomin}&lamax=${lamax}&lomax=${lomax}`;
  const res = await fetchWithRetry(url);
  const data = (await res.json()) as OpenSkyResponse;

  const aircraft = (data.states ?? [])
    .map(transformOpenSky)
    .filter((a): a is Aircraft => a !== null);

  return { aircraft, fetchedAt: data.time * 1000, source: 'opensky' };
}
