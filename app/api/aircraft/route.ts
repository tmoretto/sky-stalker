import { NextRequest, NextResponse } from 'next/server';
import { fetchNearbyAircraft } from '@/lib/adsb/client';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const lat = parseFloat(searchParams.get('lat') ?? '');
  const lon = parseFloat(searchParams.get('lon') ?? '');
  const radius = parseInt(searchParams.get('radius') ?? '25', 10);

  if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    return NextResponse.json({ error: 'Invalid lat/lon parameters' }, { status: 400 });
  }

  const clampedRadius = Math.min(250, Math.max(1, isNaN(radius) ? 25 : radius));

  try {
    const result = await fetchNearbyAircraft(lat, lon, clampedRadius);
    return NextResponse.json(result);
  } catch (err) {
    console.error('[/api/aircraft] fetch failed:', err);
    return NextResponse.json({ error: 'Failed to fetch aircraft data' }, { status: 502 });
  }
}
