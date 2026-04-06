import { NextRequest, NextResponse } from 'next/server';
import { fetchNearbyAircraft } from '@/lib/adsb/client';
import { isWidebody, haversineDistance, predictEntryMinutes } from '@/lib/adsb/geo';
import type { Aircraft } from '@/types';

export interface PredictedAircraft {
  aircraft: Aircraft;
  etaMinutes: number;
  currentDistanceNm: number;
}

export interface PredictResponse {
  predictions: PredictedAircraft[];
  fetchedAt: number;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const lat = parseFloat(searchParams.get('lat') ?? '');
  const lon = parseFloat(searchParams.get('lon') ?? '');
  const radius = parseInt(searchParams.get('radius') ?? '25', 10);

  if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    return NextResponse.json({ error: 'Invalid lat/lon' }, { status: 400 });
  }

  try {
    // Search a 3× radius to catch inbound aircraft well before they arrive
    const clampedRadius = Math.min(250, Math.max(1, radius));
    const searchRadius = Math.min(250, clampedRadius * 3);
    const result = await fetchNearbyAircraft(lat, lon, searchRadius);

    const predictions: PredictedAircraft[] = [];

    for (const ac of result.aircraft) {
      if (!isWidebody(ac.aircraftType)) continue;
      if (ac.onGround) continue;
      if (ac.heading === null || ac.groundSpeed === null || ac.groundSpeed < 100) continue;

      const currentDist = haversineDistance(lat, lon, ac.lat, ac.lon);

      // Already inside — skip (the live view shows these)
      if (currentDist <= clampedRadius) continue;

      const eta = predictEntryMinutes(
        ac.lat, ac.lon,
        ac.heading, ac.groundSpeed,
        lat, lon, clampedRadius,
      );

      if (eta !== null) {
        predictions.push({ aircraft: ac, etaMinutes: eta, currentDistanceNm: currentDist });
      }
    }

    // Sort by soonest arrival
    predictions.sort((a, b) => a.etaMinutes - b.etaMinutes);

    return NextResponse.json({ predictions: predictions.slice(0, 10), fetchedAt: result.fetchedAt });
  } catch (err) {
    console.error('[/api/aircraft/predict]', err);
    return NextResponse.json({ error: 'Prediction failed' }, { status: 502 });
  }
}
