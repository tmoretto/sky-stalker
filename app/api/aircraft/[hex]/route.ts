import { NextRequest, NextResponse } from 'next/server';

const AIRPLANES_LIVE_BASE = 'https://api.airplanes.live/v2';
const PLANESPOTTERS_BASE = 'https://api.planespotters.net/pub/photos/hex';

interface AirplanesLiveHexResponse {
  ac: Array<{
    hex: string;
    flight?: string;
    r?: string;
    t?: string;
    desc?: string;
    ownOp?: string;
    lat?: number;
    lon?: number;
    alt_baro?: number | 'ground';
    alt_geom?: number;
    gs?: number;
    track?: number;
    baro_rate?: number;
    squawk?: string;
    emergency?: string;
    seen?: number;
    category?: string;
    nav_qnh?: number;
    nav_altitude_mcp?: number;
    nav_heading?: number;
    nic?: number;
    rc?: number;
    seen_pos?: number;
    rssi?: number;
    dbFlags?: number;
    // mil flag
  }>;
  msg: string;
  now: number;
  total: number;
}

interface PlanespottersPhoto {
  id: string;
  thumbnail: { src: string; size: { width: number; height: number } };
  thumbnail_large: { src: string; size: { width: number; height: number } };
  link: string;
  photographer: string;
}

interface PlanespottersResponse {
  photos: PlanespottersPhoto[];
}

export interface AircraftDetailResponse {
  hex: string;
  callsign: string | null;
  registration: string | null;
  aircraftType: string | null;
  typeDescription: string | null;
  operator: string | null;
  lat: number | null;
  lon: number | null;
  altitude: number | null;
  altitudeGeometric: number | null;
  groundSpeed: number | null;
  heading: number | null;
  verticalRate: number | null;
  squawk: string | null;
  emergency: boolean;
  onGround: boolean;
  category: string | null;
  navQnh: number | null;
  navAltitude: number | null;
  navHeading: number | null;
  rssi: number | null;
  lastSeen: number;
  military: boolean;
  photos: Array<{
    src: string;
    link: string;
    photographer: string;
    width: number;
    height: number;
  }>;
  _stale?: boolean;
}

function emptyDetail(hex: string): AircraftDetailResponse {
  return {
    hex,
    callsign: null,
    registration: null,
    aircraftType: null,
    typeDescription: null,
    operator: null,
    lat: null,
    lon: null,
    altitude: null,
    altitudeGeometric: null,
    groundSpeed: null,
    heading: null,
    verticalRate: null,
    squawk: null,
    emergency: false,
    onGround: false,
    category: null,
    navQnh: null,
    navAltitude: null,
    navHeading: null,
    rssi: null,
    lastSeen: Date.now(),
    military: false,
    photos: [],
  };
}

const HEX_REGEX = /^[0-9a-f]{6}$/i;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ hex: string }> },
) {
  const { hex } = await params;

  if (!HEX_REGEX.test(hex)) {
    return NextResponse.json({ error: 'Invalid hex address' }, { status: 400 });
  }

  const hexLower = hex.toLowerCase();

  try {
    // Fetch aircraft data and photo in parallel
    const [acResult, photoResult] = await Promise.allSettled([
      fetch(`${AIRPLANES_LIVE_BASE}/hex/${hexLower}`, { next: { revalidate: 0 } }).then(
        async (res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return (await res.json()) as AirplanesLiveHexResponse;
        },
      ),
      fetch(`${PLANESPOTTERS_BASE}/${hexLower}`).then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return (await res.json()) as PlanespottersResponse;
      }),
    ]);

    const photos: AircraftDetailResponse['photos'] =
      photoResult.status === 'fulfilled'
        ? photoResult.value.photos.map((p) => ({
            src: p.thumbnail_large.src,
            link: p.link,
            photographer: p.photographer,
            width: p.thumbnail_large.size.width,
            height: p.thumbnail_large.size.height,
          }))
        : [];

    if (acResult.status === 'rejected') {
      console.warn('[/api/aircraft/hex] ADS-B fetch failed:', acResult.reason);
      // Return partial response with just hex + photos
      return NextResponse.json({
        ...emptyDetail(hexLower),
        photos,
        _stale: true,
      });
    }

    const raw = acResult.value.ac[0];
    if (!raw) {
      return NextResponse.json({
        ...emptyDetail(hexLower),
        photos,
        _stale: true,
      });
    }

    const altBaro =
      raw.alt_baro === 'ground' ? 0 : (raw.alt_baro ?? null);

    const detail: AircraftDetailResponse = {
      hex: hexLower,
      callsign: raw.flight?.trim() || null,
      registration: raw.r?.trim() || null,
      aircraftType: raw.t?.trim() || null,
      typeDescription: raw.desc?.trim() || null,
      operator: raw.ownOp?.trim() || null,
      lat: raw.lat ?? null,
      lon: raw.lon ?? null,
      altitude: altBaro != null ? Math.round(altBaro) : null,
      altitudeGeometric: raw.alt_geom != null ? Math.round(raw.alt_geom) : null,
      groundSpeed: raw.gs != null ? Math.round(raw.gs) : null,
      heading: raw.track != null ? Math.round(raw.track) : null,
      verticalRate: raw.baro_rate != null ? Math.round(raw.baro_rate) : null,
      squawk: raw.squawk ?? null,
      emergency: !!raw.emergency && raw.emergency !== 'none',
      onGround: raw.alt_baro === 'ground',
      category: raw.category ?? null,
      navQnh: raw.nav_qnh ?? null,
      navAltitude: raw.nav_altitude_mcp != null ? Math.round(raw.nav_altitude_mcp) : null,
      navHeading: raw.nav_heading != null ? Math.round(raw.nav_heading) : null,
      rssi: raw.rssi ?? null,
      lastSeen: Date.now() - (raw.seen ?? 0) * 1000,
      military: (raw.dbFlags ?? 0) === 1,
      photos,
    };

    return NextResponse.json(detail);
  } catch (err) {
    console.error('[/api/aircraft/hex] unexpected error:', err);
    return NextResponse.json({ error: 'Failed to fetch aircraft details' }, { status: 502 });
  }
}
