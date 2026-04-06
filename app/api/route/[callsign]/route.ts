import { NextRequest, NextResponse } from 'next/server';

const ADSBDB_BASE = 'https://api.adsbdb.com/v0';
const CALLSIGN_REGEX = /^[A-Z0-9]{2,8}$/i;

interface AdsbDbRouteResponse {
  response: {
    flightroute?: {
      callsign: string;
      origin: { iata_code: string; icao_code: string; name: string; municipality: string } | null;
      destination: { iata_code: string; icao_code: string; name: string; municipality: string } | null;
    };
  };
}

export interface FlightRouteResponse {
  callsign: string;
  origin: { iata: string; icao: string; name: string; city: string } | null;
  destination: { iata: string; icao: string; name: string; city: string } | null;
}

// Cache to avoid hammering adsbdb — 5 min TTL
const routeCache = new Map<string, { data: FlightRouteResponse; expiresAt: number }>();

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ callsign: string }> },
) {
  const { callsign } = await params;

  if (!CALLSIGN_REGEX.test(callsign)) {
    return NextResponse.json({ error: 'Invalid callsign' }, { status: 400 });
  }

  const key = callsign.toUpperCase();

  // Check cache
  const cached = routeCache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json(cached.data);
  }

  try {
    const res = await fetch(`${ADSBDB_BASE}/callsign/${key}`, {
      next: { revalidate: 0 },
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      // Not found is common — cache the miss too
      const empty: FlightRouteResponse = { callsign: key, origin: null, destination: null };
      routeCache.set(key, { data: empty, expiresAt: Date.now() + 5 * 60_000 });
      return NextResponse.json(empty);
    }

    const body = (await res.json()) as AdsbDbRouteResponse;
    const route = body.response?.flightroute;

    const data: FlightRouteResponse = {
      callsign: key,
      origin: route?.origin
        ? { iata: route.origin.iata_code, icao: route.origin.icao_code, name: route.origin.name, city: route.origin.municipality }
        : null,
      destination: route?.destination
        ? { iata: route.destination.iata_code, icao: route.destination.icao_code, name: route.destination.name, city: route.destination.municipality }
        : null,
    };

    routeCache.set(key, { data, expiresAt: Date.now() + 5 * 60_000 });
    return NextResponse.json(data);
  } catch (err) {
    console.error('[/api/route] fetch failed:', err);
    return NextResponse.json({ callsign: key, origin: null, destination: null });
  }
}
