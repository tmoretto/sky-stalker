'use client';

import dynamic from 'next/dynamic';
import type { Aircraft } from '@/types';
import { MapSkeleton } from '@/components/aircraft/Skeleton';

// Leaflet accesses `window` at import — must be dynamically imported with ssr: false
const AircraftMapInner = dynamic(() => import('./AircraftMapInner'), {
  ssr: false,
  loading: () => <MapSkeleton />,
});

interface AircraftMapProps {
  aircraft: Aircraft[];
  centerLat: number;
  centerLon: number;
  radiusNm: number;
  selectedHex: string | null;
  onSelectAircraft: (hex: string | null) => void;
}

export function AircraftMap(props: AircraftMapProps) {
  return <AircraftMapInner {...props} />;
}
