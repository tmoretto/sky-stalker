import Link from 'next/link';
import { useState } from 'react';
import type { Aircraft } from '@/types';
import { countryCodeToFlag } from '@/lib/adsb/icao-country';
import { useFlightRoute } from '@/lib/hooks/useFlightRoute';
import { FlipCounter } from '@/components/ui/FlipCounter';

function airlineLogoUrl(icaoCode: string): string {
  return `https://www.flightaware.com/images/airline_logos/90p/${icaoCode}.png`;
}

interface AircraftCardProps {
  aircraft: Aircraft;
  distanceNm?: number;
  isSelected?: boolean;
  onClick?: () => void;
  unitSystem?: 'imperial' | 'metric';
}

export function AircraftCard({ aircraft, distanceNm, isSelected, onClick, unitSystem = 'imperial' }: AircraftCardProps) {
  const isMetric = unitSystem === 'metric';
  const callsign = aircraft.callsign ?? aircraft.hex.toUpperCase();
  const flag = aircraft.countryCode ? countryCodeToFlag(aircraft.countryCode) : null;
  const [logoError, setLogoError] = useState(false);
  // Prefer real-time origin/destination from Airplanes.live; fall back to adsbdb
  const hasLiveRoute = !!(aircraft.origin || aircraft.destination);
  const { origin: dbOrigin, destination: dbDestination } = useFlightRoute(
    hasLiveRoute ? null : aircraft.callsign,
  );
  const originIata = aircraft.origin ?? dbOrigin?.iata ?? null;
  const destIata = aircraft.destination ?? dbDestination?.iata ?? null;
  return (
    <div
      onClick={onClick}
      className={`ambient-card w-full border-b border-[var(--fids-border)] px-3 py-2.5 text-left font-mono transition-colors cursor-pointer ${
        isSelected
          ? 'bg-[var(--sign-blue)]/20'
          : 'bg-[var(--fids-row)] hover:bg-[var(--fids-row-alt)]'
      }`}
    >
      {/* Row 1: Callsign + Distance — like a FIDS departure row */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {aircraft.airline && !logoError ? (
            <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white shadow-sm">
              <img
                src={airlineLogoUrl(aircraft.airline)}
                alt={aircraft.airline}
                width={18}
                height={18}
                className="h-[18px] w-[18px] rounded-full object-contain"
                onError={() => setLogoError(true)}
                loading="lazy"
              />
            </span>
          ) : flag ? (
            <span className="text-base">{flag}</span>
          ) : null}
          <span className="ambient-glow-green text-sm font-bold tracking-wider text-[var(--fids-green)]">{callsign}</span>
          {aircraft.aircraftType && (
            <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] tracking-wider text-slate-400">{aircraft.aircraftType}</span>
          )}
        </div>
        {distanceNm != null && (
          <span className="ambient-glow-amber font-mono text-xs tabular-nums text-[var(--fids-amber)]">
            <FlipCounter value={isMetric ? (distanceNm * 1.852).toFixed(1) : distanceNm.toFixed(1)} /> {isMetric ? 'km' : 'nm'}
          </span>
        )}
      </div>
      {/* Row 2: Data chips */}
      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-[11px] tabular-nums text-slate-500">
        {aircraft.altitude != null && (
          <span>ALT <FlipCounter value={isMetric ? String(Math.round(aircraft.altitude * 0.3048)) : String(aircraft.altitude)} />{isMetric ? 'm' : 'ft'}</span>
        )}
        {aircraft.groundSpeed != null && (
          <span>SPD <FlipCounter value={isMetric ? String(Math.round(aircraft.groundSpeed * 1.852)) : String(aircraft.groundSpeed)} />{isMetric ? 'km/h' : 'kts'}</span>
        )}
        {aircraft.heading != null && <span>HDG <FlipCounter value={String(aircraft.heading)} />°</span>}
        {aircraft.emergency && (
          <span className="font-bold tracking-widest text-[var(--sign-red)]">🚨 EMERG</span>
        )}
      </div>
      {/* Row 3: Route + Detail link */}
      <div className="mt-1.5 flex items-center justify-between gap-2">
        {originIata || destIata ? (
          <span className="text-[11px] tracking-wider text-slate-400">
            <span className="font-bold text-white">{originIata ?? '???'}</span>
            <span className="mx-1 text-[var(--fids-amber)]">→</span>
            <span className="font-bold text-white">{destIata ?? '???'}</span>
          </span>
        ) : (
          <span />
        )}
        <Link
          href={`/aircraft/${aircraft.hex}?${new URLSearchParams({
            ...(aircraft.callsign ? { callsign: aircraft.callsign } : {}),
            ...(aircraft.aircraftType ? { type: aircraft.aircraftType } : {}),
            ...(aircraft.registration ? { reg: aircraft.registration } : {}),
          }).toString()}`}
          onClick={(e) => e.stopPropagation()}
          className="shrink-0 rounded bg-[var(--sign-blue)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white transition-all hover:brightness-125"
        >
          DETAILS ↗
        </Link>
      </div>
    </div>
  );
}
