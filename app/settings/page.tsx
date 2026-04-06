'use client';

import { useSettings } from '@/lib/store/settings';
import { Header } from '@/components/layout/Header';

export default function SettingsPage() {
  const { radiusNm, unitSystem, showMilitary, showHelicopters, setRadius, setUnitSystem, setFilters } =
    useSettings();

  return (
    <div className="flex h-full flex-col bg-[var(--fids-bg)]">
      <Header />
      <main className="mx-auto w-full max-w-lg flex-1 space-y-6 px-4 py-6">
        {/* Page title — blue airport sign */}
        <div className="inline-block rounded-lg bg-[var(--sign-blue)] px-5 py-2.5 shadow-lg">
          <h1 className="font-mono text-lg font-bold uppercase tracking-[0.15em] text-white">⚙️ Settings</h1>
        </div>

        {/* Watch radius */}
        <section className="overflow-hidden rounded-xl border-2 border-[var(--fids-border)] bg-[var(--fids-row)] shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
          <div className="bg-[var(--sign-blue)] px-4 py-2.5">
            <h2 className="font-mono text-xs font-bold uppercase tracking-[0.15em] text-white">📍 Watch Zone</h2>
          </div>
          <div className="p-4">
            <label className="block">
              <span className="mb-1 flex items-center justify-between font-mono text-sm text-slate-400">
                <span className="uppercase tracking-wider">Radius</span>
                <span className="font-bold tabular-nums text-[var(--fids-green)]">{radiusNm} NM</span>
              </span>
              <input
                type="range"
                min={1}
                max={250}
                value={radiusNm}
                onChange={(e) => setRadius(parseInt(e.target.value, 10))}
                className="w-full accent-[var(--sign-yellow)]"
              />
              <div className="mt-0.5 flex justify-between font-mono text-[10px] tabular-nums uppercase text-slate-600">
                <span>1 nm</span>
                <span>250 nm</span>
              </div>
            </label>
          </div>
        </section>

        {/* Units */}
        <section className="overflow-hidden rounded-xl border-2 border-[var(--fids-border)] bg-[var(--fids-row)] shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
          <div className="bg-[var(--sign-blue)] px-4 py-2.5">
            <h2 className="font-mono text-xs font-bold uppercase tracking-[0.15em] text-white">📏 Units</h2>
          </div>
          <div className="flex gap-3 p-4">
            {(['imperial', 'metric'] as const).map((sys) => (
              <button
                key={sys}
                onClick={() => setUnitSystem(sys)}
                className={`flex-1 rounded-lg py-2.5 font-mono text-sm font-bold uppercase tracking-wider transition-all ${
                  unitSystem === sys
                    ? 'bg-[var(--sign-yellow)] text-[var(--sign-black)] shadow-lg'
                    : 'border-2 border-[var(--fids-border)] text-slate-500 hover:border-slate-500 hover:text-white'
                }`}
              >
                {sys === 'imperial' ? '🇺🇸 NM / FT' : '🌍 KM / M'}
              </button>
            ))}
          </div>
        </section>

        {/* Notification filters */}
        <section className="overflow-hidden rounded-xl border-2 border-[var(--fids-border)] bg-[var(--fids-row)] shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
          <div className="bg-[var(--sign-blue)] px-4 py-2.5">
            <h2 className="font-mono text-xs font-bold uppercase tracking-[0.15em] text-white">🔔 Notification Filters</h2>
          </div>
          <div className="space-y-0 divide-y divide-[var(--fids-border)]">
            {[
              {
                label: '🫡 Military aircraft',
                key: 'showMilitary' as const,
                value: showMilitary,
              },
              {
                label: '🚁 Helicopters',
                key: 'showHelicopters' as const,
                value: showHelicopters,
              },
            ].map(({ label, key, value }) => (
              <label key={key} className="flex cursor-pointer items-center justify-between px-4 py-3">
                <span className="font-mono text-sm uppercase tracking-wider text-slate-300">{label}</span>
                <button
                  role="switch"
                  aria-checked={value}
                  onClick={() => setFilters({ [key]: !value })}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                    value ? 'bg-[var(--sign-green)]' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                      value ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </label>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
