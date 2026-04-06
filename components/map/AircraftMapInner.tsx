'use client';

import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import type { Aircraft } from '@/types';
import { PlaneMarker } from './PlaneMarker';
import { RadiusOverlay } from './RadiusOverlay';
import { RadarSweep } from './RadarSweep';
import { Contrails } from './Contrails';
import { useEffect } from 'react';
import { LatLng } from 'leaflet';

interface Props {
  aircraft: Aircraft[];
  centerLat: number;
  centerLon: number;
  radiusNm: number;
  selectedHex: string | null;
  onSelectAircraft: (hex: string | null) => void;
}

/** Pick a zoom level that fits the watch radius comfortably. */
function radiusToZoom(radiusNm: number): number {
  if (radiusNm <= 5) return 13;
  if (radiusNm <= 15) return 12;
  if (radiusNm <= 30) return 11;
  if (radiusNm <= 60) return 10;
  if (radiusNm <= 120) return 9;
  return 8;
}

function MapRecenter({ lat, lon }: { lat: number; lon: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(new LatLng(lat, lon), map.getZoom(), { animate: true });
  }, [lat, lon, map]);
  return null;
}

export default function AircraftMapInner({
  aircraft,
  centerLat,
  centerLon,
  radiusNm,
  selectedHex,
  onSelectAircraft,
}: Props) {
  return (
    <MapContainer
      center={[centerLat, centerLon]}
      zoom={radiusToZoom(radiusNm)}
      className="h-full w-full"
      zoomControl={true}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <MapRecenter lat={centerLat} lon={centerLon} />
      <RadiusOverlay lat={centerLat} lon={centerLon} radiusNm={radiusNm} />
      <RadarSweep lat={centerLat} lon={centerLon} radiusNm={radiusNm} />
      <Contrails aircraft={aircraft} />
      {aircraft.map((ac) => (
        <PlaneMarker
          key={ac.hex}
          aircraft={ac}
          isSelected={ac.hex === selectedHex}
          onClick={() => onSelectAircraft(ac.hex === selectedHex ? null : ac.hex)}
        />
      ))}
    </MapContainer>
  );
}
