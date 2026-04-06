'use client';

import { useEffect, useState } from 'react';
import { useMap } from 'react-leaflet';

const NM_TO_METERS = 1852;

interface RadarSweepProps {
  lat: number;
  lon: number;
  radiusNm: number;
}

/**
 * CSS-based radar sweep overlay that stays synced with the Leaflet map.
 * Renders a rotating conic-gradient line with a fading green trail,
 * sized to match the watch-zone radius.
 */
export function RadarSweep({ lat, lon, radiusNm }: RadarSweepProps) {
  const map = useMap();
  const [style, setStyle] = useState<React.CSSProperties>({ display: 'none' });

  useEffect(() => {
    function update() {
      const center = map.latLngToContainerPoint([lat, lon]);
      // Calculate pixel radius: project a point on the circle edge
      const radiusM = radiusNm * NM_TO_METERS;
      const earthCirc = 40075016.686;
      const latRad = (lat * Math.PI) / 180;
      // Approximate: shift longitude by radiusM
      const dLon = (radiusM / (earthCirc * Math.cos(latRad))) * 360;
      const edge = map.latLngToContainerPoint([lat, lon + dLon]);
      const pxRadius = Math.abs(edge.x - center.x);

      setStyle({
        position: 'absolute',
        left: center.x - pxRadius,
        top: center.y - pxRadius,
        width: pxRadius * 2,
        height: pxRadius * 2,
        pointerEvents: 'none',
        zIndex: 450, // above tiles, below markers (600)
      });
    }

    update();
    map.on('move zoom moveend zoomend resize', update);
    return () => {
      map.off('move zoom moveend zoomend resize', update);
    };
  }, [map, lat, lon, radiusNm]);

  return (
    <div style={style} className="radar-sweep-container">
      {/* Sweep line + trail */}
      <div className="radar-sweep" />
      {/* Center dot */}
      <div className="radar-center-dot" />
      {/* Range rings (inner) */}
      <div className="radar-ring radar-ring-inner" />
      <div className="radar-ring radar-ring-mid" />
    </div>
  );
}
