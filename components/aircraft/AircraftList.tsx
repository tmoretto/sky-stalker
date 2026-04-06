'use client';

import { useEffect, useRef, useState } from 'react';
import type { Aircraft } from '@/types';
import { AircraftCard } from './AircraftCard';
import { haversineDistance } from '@/lib/adsb/geo';

interface AircraftListProps {
  aircraft: Aircraft[];
  centerLat: number;
  centerLon: number;
  selectedHex: string | null;
  onSelectAircraft: (hex: string | null) => void;
  unitSystem?: 'imperial' | 'metric';
}

export function AircraftList({
  aircraft,
  centerLat,
  centerLon,
  selectedHex,
  onSelectAircraft,
  unitSystem = 'imperial',
}: AircraftListProps) {
  const prevHexes = useRef<Set<string>>(new Set());
  const [newHexes, setNewHexes] = useState<Set<string>>(new Set());
  const [exitingAircraft, setExitingAircraft] = useState<Aircraft[]>([]);
  const exitCacheRef = useRef<Map<string, Aircraft>>(new Map());

  // Stabilize: only recompute when the actual hex list changes
  const hexKey = aircraft.map((ac) => ac.hex).sort().join(',');

  useEffect(() => {
    const currentHexes = new Set(aircraft.map((ac) => ac.hex));
    const prev = prevHexes.current;

    // Skip on first render (nothing to compare)
    if (prev.size === 0) {
      prevHexes.current = currentHexes;
      return;
    }

    // Detect new entries
    const entering = new Set<string>();
    for (const hex of currentHexes) {
      if (!prev.has(hex)) entering.add(hex);
    }

    // Detect exits
    const exiting: Aircraft[] = [];
    for (const hex of prev) {
      if (!currentHexes.has(hex)) {
        const cached = exitCacheRef.current.get(hex);
        if (cached) exiting.push(cached);
      }
    }

    // Always update prevHexes
    prevHexes.current = currentHexes;

    if (entering.size > 0) {
      setNewHexes(entering);
      const t = setTimeout(() => setNewHexes(new Set()), 500);
      // Can't return cleanup for both, so handle exit timeout separately
      if (exiting.length > 0) {
        setExitingAircraft(exiting);
        setTimeout(() => setExitingAircraft([]), 400);
      }
      return () => clearTimeout(t);
    }

    if (exiting.length > 0) {
      setExitingAircraft(exiting);
      const t = setTimeout(() => setExitingAircraft([]), 400);
      return () => clearTimeout(t);
    }
  }, [hexKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cache aircraft data so exiting planes still have their info
  useEffect(() => {
    const cache = exitCacheRef.current;
    for (const ac of aircraft) {
      cache.set(ac.hex, ac);
    }
    if (cache.size > 200) {
      const keys = [...cache.keys()];
      for (let i = 0; i < keys.length - 100; i++) {
        cache.delete(keys[i]);
      }
    }
  }, [aircraft]);

  const sorted = [...aircraft].sort((a, b) => {
    const da = haversineDistance(centerLat, centerLon, a.lat, a.lon);
    const db = haversineDistance(centerLat, centerLon, b.lat, b.lon);
    return da - db;
  });

  if (sorted.length === 0 && exitingAircraft.length === 0) {
    return (
      <div className="flex h-40 flex-col items-center justify-center gap-2 font-mono text-sm text-slate-600">
        <span className="text-3xl">📭</span>
        NO AIRCRAFT IN RANGE
      </div>
    );
  }

  return (
    <div className="flex flex-col overflow-hidden">
      {/* Exiting aircraft — fade out */}
      {exitingAircraft.map((ac) => (
        <div key={`exit-${ac.hex}`} className="ac-card-exit">
          <AircraftCard
            aircraft={ac}
            distanceNm={haversineDistance(centerLat, centerLon, ac.lat, ac.lon)}
            isSelected={false}
            onClick={() => {}}
            unitSystem={unitSystem}
          />
        </div>
      ))}
      {sorted.map((ac) => (
        <div
          key={ac.hex}
          className={newHexes.has(ac.hex) ? 'ac-card-enter' : undefined}
        >
          <AircraftCard
            aircraft={ac}
            distanceNm={haversineDistance(centerLat, centerLon, ac.lat, ac.lon)}
            isSelected={ac.hex === selectedHex}
            onClick={() => onSelectAircraft(ac.hex === selectedHex ? null : ac.hex)}
            unitSystem={unitSystem}
          />
        </div>
      ))}
    </div>
  );
}
