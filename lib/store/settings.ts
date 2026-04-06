'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  // Watch zone
  lat: number | null;
  lon: number | null;
  radiusNm: number;

  // Display
  unitSystem: 'imperial' | 'metric';
  ambientMode: boolean;

  // Filters
  showMilitary: boolean;
  showHelicopters: boolean;
  minAltitude: number | null;
  maxAltitude: number | null;

  // Actions
  setLocation: (lat: number, lon: number) => void;
  setRadius: (nm: number) => void;
  setUnitSystem: (system: 'imperial' | 'metric') => void;
  setAmbientMode: (on: boolean) => void;
  setFilters: (filters: Partial<Pick<SettingsState, 'showMilitary' | 'showHelicopters' | 'minAltitude' | 'maxAltitude'>>) => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      lat: null,
      lon: null,
      radiusNm: 10,
      unitSystem: 'imperial',
      ambientMode: false,
      showMilitary: true,
      showHelicopters: true,
      minAltitude: null,
      maxAltitude: null,

      setLocation: (lat, lon) => set({ lat, lon }),
      setRadius: (nm) => set({ radiusNm: Math.min(250, Math.max(1, nm)) }),
      setUnitSystem: (system) => set({ unitSystem: system }),
      setAmbientMode: (on) => set({ ambientMode: on }),
      setFilters: (filters) => set(filters),
    }),
    { name: 'skystalker-settings' },
  ),
);
