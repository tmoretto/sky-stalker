'use client';

import { Circle } from 'react-leaflet';

const NM_TO_METERS = 1852;

interface RadiusOverlayProps {
  lat: number;
  lon: number;
  radiusNm: number;
}

export function RadiusOverlay({ lat, lon, radiusNm }: RadiusOverlayProps) {
  return (
    <Circle
      center={[lat, lon]}
      radius={radiusNm * NM_TO_METERS}
      pathOptions={{
        color: '#38bdf8',
        fillColor: '#38bdf8',
        fillOpacity: 0.04,
        dashArray: '6 4',
        weight: 1.5,
      }}
    />
  );
}
