'use client';

import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import type { Aircraft } from '@/types';

interface ContrailsProps {
  aircraft: Aircraft[];
}

const DEG_TO_RAD = Math.PI / 180;

function projectBack(lat: number, lon: number, headingDeg: number, distanceNm: number): L.LatLng {
  const bearing = ((headingDeg + 180) % 360) * DEG_TO_RAD;
  const distRad = distanceNm / 3440.065;
  const latRad = lat * DEG_TO_RAD;
  const lonRad = lon * DEG_TO_RAD;

  const newLat = Math.asin(
    Math.sin(latRad) * Math.cos(distRad) +
    Math.cos(latRad) * Math.sin(distRad) * Math.cos(bearing),
  );
  const newLon = lonRad + Math.atan2(
    Math.sin(bearing) * Math.sin(distRad) * Math.cos(latRad),
    Math.cos(distRad) - Math.sin(latRad) * Math.sin(newLat),
  );

  return L.latLng(newLat / DEG_TO_RAD, newLon / DEG_TO_RAD);
}

/**
 * Draws contrail lines directly on the Leaflet map using L.polyline.
 * Uses heading + speed to project a trail behind each aircraft.
 */
export function Contrails({ aircraft }: ContrailsProps) {
  const map = useMap();

  useEffect(() => {
    const lines: L.Polyline[] = [];

    for (const ac of aircraft) {
      if (ac.heading == null || ac.onGround) continue;

      const speedKts = ac.groundSpeed ?? 200;
      const altNorm = Math.min(1, Math.max(0, (ac.altitude ?? 0) / 45000));
      if (altNorm < 0.05 && speedKts < 60) continue;

      const isHigh = altNorm > 0.4;
      const color = isHigh ? '#ffffff' : '#cbd5e1';
      const baseWeight = isHigh ? 4.5 : 3;
      const trailLengthNm = Math.min(10, 2 + (speedKts / 500) * 4 + altNorm * 4);

      const NUM_SEGMENTS = 8;
      const segLen = trailLengthNm / NUM_SEGMENTS;

      for (let i = 0; i < NUM_SEGMENTS; i++) {
        const startDist = segLen * i;
        const endDist = segLen * (i + 1);
        const startPt = i === 0
          ? L.latLng(ac.lat, ac.lon)
          : projectBack(ac.lat, ac.lon, ac.heading, startDist);
        const endPt = projectBack(ac.lat, ac.lon, ac.heading, endDist);

        const fadeRatio = i / NUM_SEGMENTS;
        const opacity = 0.75 * (1 - fadeRatio);
        const weight = baseWeight * (1 - fadeRatio * 0.5);

        const line = L.polyline([startPt, endPt], {
          color,
          weight,
          opacity,
          lineCap: 'round',
          lineJoin: 'round',
          interactive: false,
        });
        line.addTo(map);
        lines.push(line);
      }
    }

    return () => {
      for (const line of lines) {
        map.removeLayer(line);
      }
    };
  }, [map, aircraft]);

  return null;
}
