'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { countryCodeToFlag, icaoHexToCountry } from '@/lib/adsb/icao-country';
import { isWidebody } from '@/lib/adsb/geo';
import { useFlightRoute } from '@/lib/hooks/useFlightRoute';
import { useSettings } from '@/lib/store/settings';
import type { AircraftDetailResponse } from '@/app/api/aircraft/[hex]/route';

const CATEGORY_LABELS: Record<string, string> = {
  A1: 'Light (< 15,500 lbs)',
  A2: 'Small (15,500–75,000 lbs)',
  A3: 'Large (75,000–300,000 lbs)',
  A4: 'High Vortex Large',
  A5: 'Heavy (> 300,000 lbs)',
  A6: 'High Performance (> 5g & > 400 kts)',
  A7: 'Rotorcraft',
  B1: 'Glider / Sailplane',
  B2: 'Lighter-than-Air',
  B4: 'Skydiver Drop Zone',
  B6: 'UAV / Drone',
  C1: 'Surface Vehicle — Emergency',
  C3: 'Surface Vehicle — Service',
};

function verticalRateArrow(rate: number | null): string {
  if (rate == null || Math.abs(rate) < 100) return '➡️';
  return rate > 0 ? '⬆️' : '⬇️';
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString();
}

export default function AircraftDetailPage() {
  const { hex } = useParams<{ hex: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [data, setData] = useState<AircraftDetailResponse | null>(null);
  const [stale, setStale] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Cached basic data passed from dashboard via query string
  const cachedCallsign = searchParams.get('callsign');
  const cachedType = searchParams.get('type');
  const cachedReg = searchParams.get('reg');

  const { origin, destination } = useFlightRoute(data?.callsign ?? cachedCallsign);
  const unitSystem = useSettings((s) => s.unitSystem);
  const setUnitSystem = useSettings((s) => s.setUnitSystem);
  const isMetric = unitSystem === 'metric';

  useEffect(() => {
    if (!hex) return;
    setLoading(true);
    setError(null);

    fetch(`/api/aircraft/${encodeURIComponent(hex)}`)
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? `HTTP ${res.status}`);
        }
        return res.json() as Promise<AircraftDetailResponse & { _stale?: boolean }>;
      })
      .then((d) => {
        // Merge cached data into stale responses
        if (d._stale) {
          setStale(true);
          d.callsign = d.callsign ?? cachedCallsign;
          d.aircraftType = d.aircraftType ?? cachedType;
          d.registration = d.registration ?? cachedReg;
        } else {
          setStale(false);
        }
        setData(d);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [hex, cachedCallsign, cachedType, cachedReg]);

  // Auto-refresh position every 10s
  useEffect(() => {
    if (!hex || error) return;
    const interval = setInterval(() => {
      fetch(`/api/aircraft/${encodeURIComponent(hex)}`)
        .then(async (res) => (res.ok ? (await res.json()) as AircraftDetailResponse & { _stale?: boolean } : null))
        .then((d) => {
          if (d) {
            setStale(!!d._stale);
            setData(d);
          }
        });
    }, 10_000);
    return () => clearInterval(interval);
  }, [hex, error]);

  const countryCode = hex ? icaoHexToCountry(hex) : null;
  const flag = countryCode ? countryCodeToFlag(countryCode) : null;

  return (
    <div className="flex h-full flex-col bg-[var(--fids-bg)]">
      <Header />

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-4">
        {/* Back button */}
        <div className="mb-4 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--sign-blue)] px-4 py-2 font-mono text-xs font-bold uppercase tracking-[0.15em] text-white shadow transition-all hover:brightness-125"
          >
            ← BACK
          </button>
          <button
            onClick={() => setUnitSystem(isMetric ? 'imperial' : 'metric')}
            className="inline-flex items-center gap-2 rounded-lg border-2 border-[var(--fids-border)] bg-[var(--fids-row)] px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-slate-400 shadow transition-all hover:border-[var(--sign-yellow)] hover:text-white"
          >
            {isMetric ? '🌡️ METRIC' : '🌡️ IMPERIAL'}
          </button>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center gap-4 py-20">
            <span className="text-5xl animate-pulse">✈️</span>
            <span className="font-mono text-sm uppercase tracking-wider text-slate-500">LOADING AIRCRAFT DATA…</span>
          </div>
        )}

        {error && (
          <div className="rounded-xl border-2 border-[var(--sign-red)] bg-[var(--fids-row)] p-8 text-center">
            <span className="text-4xl">🚫</span>
            <p className="mt-3 font-mono text-sm uppercase tracking-wider text-[var(--sign-red)]">{error}</p>
          </div>
        )}

        {data && (
          <div className="space-y-4">
            {/* Stale data banner */}
            {stale && (
              <div className="flex items-center gap-2 rounded-lg border-2 border-[var(--sign-yellow)]/30 bg-[var(--fids-row)] px-4 py-3 font-mono text-xs">
                <span className="text-lg">📡</span>
                <span className="flex-1 uppercase tracking-wider text-[var(--fids-amber)]">
                  Aircraft not currently transmitting — showing last known data &amp; photos
                </span>
              </div>
            )}
            {/* Title card — FIDS hero */}
            <div className="overflow-hidden rounded-xl border-2 border-[var(--fids-border)] shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
              <div className="bg-[var(--sign-blue)] px-5 py-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {flag && <span className="text-3xl">{flag}</span>}
                    <div>
                      <h1 className="font-mono text-2xl font-bold tracking-[0.15em] text-[var(--fids-green)]">
                        {data.callsign ?? data.hex.toUpperCase()}
                      </h1>
                      {data.callsign && (
                        <span className="font-mono text-xs tracking-wider text-blue-200">
                          HEX {data.hex.toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {data.emergency && (
                      <span className="rounded-lg bg-[var(--sign-red)] px-3 py-1 font-mono text-xs font-bold uppercase tracking-wider text-white animate-pulse">
                        🚨 EMERGENCY
                      </span>
                    )}
                    {data.military && (
                      <span className="rounded-lg bg-slate-700 px-3 py-1 font-mono text-xs font-bold uppercase tracking-wider text-[var(--sign-yellow)]">
                        🫡 MILITARY
                      </span>
                    )}
                    {data.onGround && (
                      <span className="rounded-lg bg-slate-700 px-3 py-1 font-mono text-xs font-bold uppercase tracking-wider text-slate-400">
                        ON GROUND
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick stats bar */}
              <div className="flex flex-wrap divide-x divide-[var(--fids-border)] bg-[var(--fids-row)]">
                <QuickStat label="TYPE" value={data.aircraftType} />
                <QuickStat
                  label="ALT"
                  value={data.altitude != null ? (isMetric ? `${Math.round(data.altitude * 0.3048).toLocaleString()} m` : `${data.altitude.toLocaleString()} ft`) : null}
                  icon={verticalRateArrow(data.verticalRate)}
                />
                <QuickStat label="SPD" value={data.groundSpeed != null ? (isMetric ? `${Math.round(data.groundSpeed * 1.852)} km/h` : `${data.groundSpeed} kts`) : null} />
                <QuickStat label="HDG" value={data.heading != null ? `${data.heading}°` : null} />
                <QuickStat label="SQK" value={data.squawk} highlight={data.squawk === '7700' || data.squawk === '7600' || data.squawk === '7500'} />
              </div>

              {/* Route bar — shown when at least one airport is known */}
              {(origin || destination) && (
                <div className="relative flex items-stretch divide-x divide-[var(--fids-border)] bg-[var(--fids-row-alt)] overflow-hidden">
                  <RouteAirport role="FROM" airport={origin} />
                  <div className="relative flex flex-1 items-center py-3 px-2">
                    {/* Dashed flight path */}
                    <div className="absolute inset-x-4 top-1/2 h-px border-t-2 border-dashed border-[var(--fids-amber)]/20" />
                    {/* Progress glow trail */}
                    <div
                      className="absolute left-4 top-1/2 h-0.5 -translate-y-1/2 bg-gradient-to-r from-[var(--fids-amber)]/40 via-[var(--fids-amber)]/20 to-transparent rounded-full"
                      style={{ animation: 'routePulse 3s ease-in-out infinite' }}
                    />
                    {/* Animated plane */}
                    <div
                      className="absolute top-1/2 -translate-y-1/2"
                      style={{ animation: 'flyAcross 4s ease-in-out infinite' }}
                    >
                      <span className="relative inline-flex items-center justify-center">
                        <span className="absolute h-6 w-6 rounded-full bg-[var(--fids-amber)]/20 animate-ping" />
                        <span className="relative text-xl drop-shadow-[0_0_8px_rgba(255,199,44,0.6)]">✈️</span>
                      </span>
                    </div>
                    {/* Departure dot */}
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-[var(--fids-green)] shadow-[0_0_6px_rgba(0,255,100,0.5)]" />
                    {/* Arrival dot */}
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-[var(--fids-amber)] shadow-[0_0_6px_rgba(255,199,44,0.5)]" />
                  </div>
                  <RouteAirport role="TO" airport={destination} />
                </div>
              )}
            </div>

            {/* Photos */}
            {data.photos.length > 0 && (
              <div className="overflow-hidden rounded-xl border-2 border-[var(--fids-border)] shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
                <div className="bg-[var(--sign-blue)] px-4 py-2.5">
                  <h2 className="font-mono text-xs font-bold uppercase tracking-[0.15em] text-white">📸 Photos</h2>
                </div>
                <div className="grid grid-cols-1 gap-0.5 bg-[var(--fids-border)] sm:grid-cols-2">
                  {data.photos.slice(0, 4).map((photo) => (
                    <a
                      key={photo.src}
                      href={photo.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative block overflow-hidden bg-[var(--fids-row)]"
                    >
                      <img
                        src={photo.src}
                        alt={`${data.registration ?? data.hex} by ${photo.photographer}`}
                        width={photo.width}
                        height={photo.height}
                        className="h-48 w-full object-cover transition-transform group-hover:scale-105"
                        loading="lazy"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-3 py-2">
                        <span className="font-mono text-[10px] tracking-wider text-slate-300">
                          📷 {photo.photographer}
                        </span>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Detail sections as FIDS board rows */}
            <div className="grid gap-4 md:grid-cols-2">
              {/* Aircraft Info */}
              <DetailSection title="🛩️ Aircraft">
                <DetailRow label="ICAO HEX" value={data.hex.toUpperCase()} />
                <DetailRow label="CALLSIGN" value={data.callsign} />
                <DetailRow label="REGISTRATION" value={data.registration} />
                <DetailRow label="TYPE" value={data.aircraftType} />
                <DetailRow label="DESCRIPTION" value={data.typeDescription} />
                <DetailRow label="OPERATOR" value={data.operator} />
                {countryCode && <DetailRow label="COUNTRY" value={`${flag} ${countryCode}`} />}
                {data.category && (
                  <DetailRow label="CATEGORY" value={`${data.category} — ${CATEGORY_LABELS[data.category] ?? 'Unknown'}`} />
                )}
                {data.aircraftType && (
                  <DetailRow label="CLASS" value={isWidebody(data.aircraftType) ? 'WIDEBODY ✈️' : 'NARROWBODY'} />
                )}
                {data.military && <DetailRow label="MILITARY" value="YES 🫡" />}
              </DetailSection>

              {/* Flight Data */}
              <DetailSection title="📊 Flight Data">
                <DetailRow label="BARO ALT" value={data.altitude != null ? (isMetric ? `${Math.round(data.altitude * 0.3048).toLocaleString()} m` : `${data.altitude.toLocaleString()} ft`) : null} />
                <DetailRow label="GEO ALT" value={data.altitudeGeometric != null ? (isMetric ? `${Math.round(data.altitudeGeometric * 0.3048).toLocaleString()} m` : `${data.altitudeGeometric.toLocaleString()} ft`) : null} />
                <DetailRow label="GROUND SPEED" value={data.groundSpeed != null ? (isMetric ? `${Math.round(data.groundSpeed * 1.852)} km/h` : `${data.groundSpeed} kts`) : null} />
                <DetailRow label="HEADING" value={data.heading != null ? `${data.heading}°` : null} />
                <DetailRow
                  label="VERT RATE"
                  value={data.verticalRate != null ? (isMetric ? `${data.verticalRate > 0 ? '+' : ''}${Math.round(data.verticalRate * 0.00508)} m/s` : `${data.verticalRate > 0 ? '+' : ''}${data.verticalRate} ft/min`) : null}
                  highlight={data.verticalRate != null && Math.abs(data.verticalRate) > 2000}
                />
                <DetailRow label="SQUAWK" value={data.squawk} highlight={data.squawk === '7700' || data.squawk === '7600' || data.squawk === '7500'} />
                <DetailRow label="ON GROUND" value={data.onGround ? 'YES' : 'NO'} />
              </DetailSection>

              {/* Navigation */}
              <DetailSection title="🧭 Navigation">
                <DetailRow label="LATITUDE" value={data.lat?.toFixed(5) ?? null} />
                <DetailRow label="LONGITUDE" value={data.lon?.toFixed(5) ?? null} />
                <DetailRow label="NAV QNH" value={data.navQnh != null ? `${data.navQnh} hPa` : null} />
                <DetailRow label="NAV ALT (MCP)" value={data.navAltitude != null ? (isMetric ? `${Math.round(data.navAltitude * 0.3048).toLocaleString()} m` : `${data.navAltitude.toLocaleString()} ft`) : null} />
                <DetailRow label="NAV HEADING" value={data.navHeading != null ? `${data.navHeading}°` : null} />
              </DetailSection>

              {/* Signal */}
              <DetailSection title="📡 Signal">
                <DetailRow label="SIGNAL (RSSI)" value={data.rssi != null ? `${data.rssi.toFixed(1)} dBFS` : null} />
                <DetailRow label="LAST SEEN" value={formatTime(data.lastSeen)} />
                {data.emergency && <DetailRow label="EMERGENCY" value="DECLARED" highlight />}
              </DetailSection>
            </div>

            {/* External links */}
            <div className="overflow-hidden rounded-xl border-2 border-[var(--fids-border)] shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
              <div className="bg-[var(--sign-blue)] px-4 py-2.5">
                <h2 className="font-mono text-xs font-bold uppercase tracking-[0.15em] text-white">🔗 External</h2>
              </div>
              <div className="flex flex-wrap gap-2 bg-[var(--fids-row)] p-4">
                <ExtLink href={`https://globe.airplanes.live/?icao=${data.hex}`} label="Airplanes.live" />
                <ExtLink href={`https://www.flightradar24.com/${data.callsign ?? data.hex}`} label="Flightradar24" />
                <ExtLink href={`https://www.adsbexchange.com/?icao=${data.hex}`} label="ADS-B Exchange" />
                {data.registration && (
                  <ExtLink href={`https://www.planespotters.net/hex/${data.hex}`} label="Planespotters" />
                )}
                {data.registration && (
                  <ExtLink href={`https://www.jetphotos.com/registration/${data.registration}`} label="JetPhotos" />
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function RouteAirport({
  role,
  airport,
}: {
  role: 'FROM' | 'TO';
  airport: { iata: string; icao: string; name: string; city: string } | null;
}) {
  return (
    <div className="flex w-36 flex-col items-center gap-0.5 px-4 py-3 sm:w-48">
      <span className="font-mono text-[9px] uppercase tracking-widest text-slate-600">{role}</span>
      {airport ? (
        <>
          <span className="font-mono text-2xl font-bold tracking-widest text-[var(--fids-green)]">
            {airport.iata}
          </span>
          <span className="text-center font-mono text-[10px] leading-tight text-slate-400">
            {airport.name}
          </span>
          <span className="font-mono text-[10px] text-slate-600">{airport.city}</span>
        </>
      ) : (
        <span className="font-mono text-2xl font-bold tracking-widest text-slate-700">???</span>
      )}
    </div>
  );
}

function QuickStat({
  label,
  value,
  icon,
  highlight,
}: {
  label: string;
  value: string | null;
  icon?: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex flex-1 flex-col items-center gap-0.5 px-4 py-3">
      <span className="font-mono text-[10px] uppercase tracking-widest text-slate-600">{label}</span>
      <span
        className={`font-mono text-sm font-bold tabular-nums ${
          highlight ? 'text-[var(--sign-red)]' : 'text-[var(--fids-green)]'
        }`}
      >
        {icon && <span className="mr-1">{icon}</span>}
        {value ?? '—'}
      </span>
    </div>
  );
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border-2 border-[var(--fids-border)] shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
      <div className="bg-[var(--sign-blue)] px-4 py-2.5">
        <h2 className="font-mono text-xs font-bold uppercase tracking-[0.15em] text-white">{title}</h2>
      </div>
      <div className="divide-y divide-[var(--fids-border)]">{children}</div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string | null;
  highlight?: boolean;
}) {
  if (value == null) return null;
  return (
    <div className="flex items-center justify-between bg-[var(--fids-row)] px-4 py-2.5 even:bg-[var(--fids-row-alt)]">
      <span className="font-mono text-[11px] uppercase tracking-wider text-slate-500">{label}</span>
      <span
        className={`font-mono text-sm font-bold tabular-nums ${
          highlight ? 'text-[var(--sign-red)]' : 'text-white'
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function ExtLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="rounded-lg border-2 border-[var(--fids-border)] px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-[var(--fids-amber)] transition-all hover:border-[var(--sign-yellow)] hover:bg-[var(--sign-yellow)]/10 hover:text-[var(--sign-yellow)]"
    >
      {label} ↗
    </a>
  );
}
