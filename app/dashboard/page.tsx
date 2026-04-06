'use client';

import { useState } from 'react';
import { useAircraft } from '@/lib/hooks/useAircraft';
import { useGeolocation } from '@/lib/hooks/useGeolocation';
import { useSettings } from '@/lib/store/settings';
import { AircraftMap } from '@/components/map/AircraftMap';
import { AircraftList } from '@/components/aircraft/AircraftList';
import { AircraftListSkeleton } from '@/components/aircraft/Skeleton';
import { FlipCounter } from '@/components/ui/FlipCounter';
import { NotificationPermission } from '@/components/notifications/NotificationPermission';
import { Header } from '@/components/layout/Header';
import { isWidebody } from '@/lib/adsb/geo';
import { usePredictions } from '@/lib/hooks/usePredictions';

export default function DashboardPage() {
  const { lat, lon, radiusNm, unitSystem, setUnitSystem, ambientMode, setAmbientMode } = useSettings();
  const { permissionState, requestPermission } = useGeolocation();
  const { aircraft: allAircraft, isLoading, fetchedAt } = useAircraft();
  const [selectedHex, setSelectedHex] = useState<string | null>(null);
  const [widebodyOnly, setWidebodyOnly] = useState(false);
  const { predictions } = usePredictions();

  const aircraft = allAircraft.filter((ac) => {
    if (ac.onGround) return false;
    if (widebodyOnly && !isWidebody(ac.aircraftType)) return false;
    return true;
  });

  const hasLocation = lat != null && lon != null;

  return (
    <div className="flex h-full flex-col bg-[var(--fids-bg)]">
      <Header />
      <div className="px-4 pt-3">
        <NotificationPermission userId={null} />
      </div>

      {!hasLocation ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-6">
          <span className="text-7xl">🛫</span>
          <div className="rounded-xl bg-[var(--sign-blue)] px-8 py-5 text-center shadow-[0_4px_30px_rgba(0,61,165,0.4)]">
            <h2 className="mb-2 font-mono text-xl font-bold uppercase tracking-[0.15em] text-white">Location Required</h2>
            <p className="text-sm tracking-wide text-blue-200">Share your location to begin tracking overhead aircraft</p>
          </div>
          <button
            onClick={requestPermission}
            disabled={permissionState === 'requesting'}
            className="rounded-lg bg-[var(--sign-yellow)] px-8 py-3 font-mono text-sm font-bold uppercase tracking-[0.15em] text-[var(--sign-black)] shadow-lg transition-all hover:brightness-110 disabled:opacity-50"
          >
            {permissionState === 'requesting' ? '⏳ LOCATING…' : '📡 SHARE LOCATION'}
          </button>
          {permissionState === 'denied' && (
            <div className="rounded-lg bg-[var(--sign-red)] px-5 py-2 font-mono text-xs font-bold uppercase tracking-wider text-white">
              🚫 LOCATION ACCESS DENIED — UPDATE BROWSER PERMISSIONS
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden">
          {/* Map */}
          <div className="relative flex-1">
            <AircraftMap
              aircraft={aircraft}
              centerLat={lat}
              centerLon={lon}
              radiusNm={radiusNm}
              selectedHex={selectedHex}
              onSelectAircraft={setSelectedHex}
            />

            {/* Map controls — top-right */}
            <div className="absolute right-3 top-3 z-[1000] flex flex-col gap-2">
              <button
                onClick={() => setWidebodyOnly((v) => !v)}
                className={`rounded-lg px-3 py-2 font-mono text-[11px] font-bold uppercase tracking-wider shadow-lg transition-all ${
                  widebodyOnly
                    ? 'bg-[var(--sign-yellow)] text-[var(--sign-black)]'
                    : 'bg-[var(--sign-blue)] text-white hover:brightness-125'
                }`}
              >
                ✈️ WIDEBODY
              </button>
              <button
                onClick={() => setUnitSystem(unitSystem === 'imperial' ? 'metric' : 'imperial')}
                className="rounded-lg bg-[var(--sign-blue)] px-3 py-2 font-mono text-[11px] font-bold uppercase tracking-wider text-white shadow-lg transition-all hover:brightness-125"
              >
                {unitSystem === 'imperial' ? '🇺🇸 NM / FT' : '🌍 KM / M'}
              </button>
              <button
                onClick={() => setAmbientMode(!ambientMode)}
                className={`rounded-lg px-3 py-2 font-mono text-[11px] font-bold uppercase tracking-wider shadow-lg transition-all ${
                  ambientMode
                    ? 'bg-indigo-600 text-white shadow-[0_0_16px_rgba(99,102,241,0.5)]'
                    : 'bg-[var(--sign-blue)] text-white hover:brightness-125'
                }`}
              >
                🌙 AMBIENT
              </button>
            </div>

            {/* Status bar */}
            <div className="absolute bottom-3 left-3 z-[1000] flex items-center gap-2 rounded-lg bg-[var(--sign-black)] px-3 py-2 font-mono text-xs tabular-nums text-[var(--fids-green)] shadow-lg">
              {isLoading ? (
                <><span className="animate-pulse">●</span> UPDATING…</>
              ) : (
                <><span>●</span> <FlipCounter value={String(aircraft.length)} /> TRACKED · {fetchedAt ? new Date(fetchedAt).toLocaleTimeString() : '—'}</>
              )}
            </div>
          </div>

          {/* Sidebar — FIDS board */}
          <aside className="ambient-sidebar hidden w-80 flex-col border-l-2 border-[var(--fids-border)] bg-[var(--fids-bg)] md:flex">
            {/* Board header — blue sign */}
            <div className="flex items-center justify-between bg-[var(--sign-blue)] px-4 py-3">
              <span className="font-mono text-xs font-bold uppercase tracking-[0.15em] text-white">
                ✈️ OVERHEAD (<FlipCounter value={String(aircraft.length)} />)
              </span>
              <button
                onClick={() => setWidebodyOnly((v) => !v)}
                className={`rounded px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider transition-colors ${
                  widebodyOnly
                    ? 'bg-[var(--sign-yellow)] text-[var(--sign-black)]'
                    : 'bg-white/15 text-white/70 hover:bg-white/25 hover:text-white'
                }`}
              >
                WIDEBODY
              </button>
            </div>
            {/* Column header row */}
            <div className="flex items-center border-b border-[var(--fids-border)] bg-[var(--fids-row-alt)] px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-slate-600">
              <span className="flex-1">Flight</span>
              <span className="w-14 text-right">Alt</span>
              <span className="w-14 text-right">Dist</span>
            </div>
            <div className="flex-1 overflow-y-auto">
              {isLoading && aircraft.length === 0 ? (
                <AircraftListSkeleton count={6} />
              ) : (
                <AircraftList
                  aircraft={aircraft}
                  centerLat={lat}
                  centerLon={lon}
                  selectedHex={selectedHex}
                  onSelectAircraft={setSelectedHex}
                  unitSystem={unitSystem}
                />
              )}
            </div>

            {/* Incoming widebodies prediction panel */}
            {predictions.length > 0 && (
              <div className="border-t-2 border-[var(--fids-border)] bg-[var(--fids-bg)]">
                <div className="bg-[var(--sign-blue)] px-4 py-2">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-white">
                    🛬 INCOMING WIDEBODIES
                  </span>
                </div>
                <div className="divide-y divide-[var(--fids-border)]">
                  {predictions.map(({ aircraft: ac, etaMinutes, currentDistanceNm }) => {
                    const callsign = ac.callsign ?? ac.hex.toUpperCase();
                    const arrivalTime = new Date(Date.now() + etaMinutes * 60_000);
                    return (
                      <div key={ac.hex} className="flex items-center gap-2 bg-[var(--fids-row)] px-3 py-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-mono text-xs font-bold tracking-wider text-[var(--fids-green)] truncate">
                            {callsign}
                          </p>
                          <p className="font-mono text-[10px] text-slate-500 truncate">
                            {ac.aircraftType} · <FlipCounter value={currentDistanceNm.toFixed(0)} /> nm out
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-mono text-sm font-bold tabular-nums text-[var(--fids-amber)]">
                            ~<FlipCounter value={String(etaMinutes)} /> min
                          </p>
                          <p className="font-mono text-[10px] tabular-nums text-slate-600">
                            {arrivalTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
