import { Header } from '@/components/layout/Header';
import { prisma } from '@/lib/db';
import { icaoHexToCountry, countryCodeToFlag } from '@/lib/adsb/icao-country';

export const dynamic = 'force-dynamic';

export default async function HistoryPage() {
  // Fetches the 50 most recent sightings across all users (demo mode — no auth yet)
  const sightings = await prisma.sighting.findMany({
    orderBy: { seenAt: 'desc' },
    take: 50,
  });

  return (
    <div className="flex h-full flex-col bg-[var(--fids-bg)]">
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
        {/* Page title — blue airport sign */}
        <div className="mb-6 inline-block rounded-lg bg-[var(--sign-blue)] px-5 py-2.5 shadow-lg">
          <h1 className="font-mono text-lg font-bold uppercase tracking-[0.15em] text-white">📜 Sighting History</h1>
        </div>

        {sightings.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 font-mono uppercase tracking-wider text-slate-600">
            <span className="text-5xl">🔭</span>
            <p>No sightings recorded yet</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border-2 border-[var(--fids-border)] shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
            {/* FIDS column headers */}
            <table className="w-full font-mono text-sm">
              <thead className="bg-[var(--sign-blue)] text-[11px] uppercase tracking-[0.15em] text-white">
                <tr>
                  <th className="px-4 py-3 text-left">Flight</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-right">Alt</th>
                  <th className="px-4 py-3 text-right">Dist</th>
                  <th className="px-4 py-3 text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--fids-border)]">
                {sightings.map((s, i) => (
                  <tr key={s.id} className={i % 2 === 0 ? 'bg-[var(--fids-row)]' : 'bg-[var(--fids-row-alt)]'}>
                    <td className="px-4 py-2.5 font-bold tracking-wider text-[var(--fids-green)]">
                      <span className="inline-flex items-center gap-1.5">
                        {(() => { const cc = icaoHexToCountry(s.hex); return cc ? countryCodeToFlag(cc) : ''; })()}
                        {s.callsign ?? s.hex.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-slate-500">{s.aircraftType ?? '—'}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-slate-400">
                      {s.altitude != null ? `${s.altitude.toLocaleString()} ft` : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-[var(--fids-amber)]">
                      {s.distance.toFixed(1)} nm
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-slate-500">
                      {new Date(s.seenAt).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
