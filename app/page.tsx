import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-10 bg-[var(--fids-bg)] px-4 text-center">
      {/* Hero sign */}
      <div className="flex flex-col items-center gap-5">
        <span className="text-8xl">✈️</span>
        <div className="rounded-xl bg-[var(--sign-blue)] px-10 py-6 shadow-[0_6px_40px_rgba(0,61,165,0.5)]">
          <h1 className="font-mono text-4xl font-bold uppercase tracking-[0.2em] text-white sm:text-5xl">SkyStalker</h1>
        </div>
        <p className="max-w-md font-mono text-sm uppercase tracking-wider text-slate-500">
          Real-time aircraft tracking · Push notifications · Spot every plane above you
        </p>
      </div>

      {/* CTA buttons — airport directional signs */}
      <div className="flex flex-col items-center gap-3 sm:flex-row">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 rounded-lg bg-[var(--sign-yellow)] px-7 py-3.5 font-mono text-sm font-bold uppercase tracking-[0.12em] text-[var(--sign-black)] shadow-lg transition-all hover:brightness-110"
        >
          <span>→</span> Open Dashboard
        </Link>
        <Link
          href="/settings"
          className="flex items-center gap-2 rounded-lg bg-[var(--sign-blue)] px-7 py-3.5 font-mono text-sm font-bold uppercase tracking-[0.12em] text-white shadow-lg transition-all hover:brightness-125"
        >
          <span>⚙️</span> Watch Zone
        </Link>
      </div>

      {/* Feature cards — gate-style info signs */}
      <div className="grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          {
            icon: '📡',
            title: 'Live ADS-B',
            desc: 'Positions updated every 15 seconds via Airplanes.live',
            color: 'bg-[var(--sign-blue)]',
          },
          {
            icon: '🔔',
            title: 'Push Alerts',
            desc: 'Notified the moment a plane enters your radius',
            color: 'bg-[var(--sign-green)]',
          },
          {
            icon: '📍',
            title: 'Custom Zone',
            desc: 'Watch zone from 1 to 250 nautical miles',
            color: 'bg-[var(--sign-yellow)] !text-[var(--sign-black)]',
          },
        ].map(({ icon, title, desc, color }) => (
          <div
            key={title}
            className={`rounded-xl p-4 text-left shadow-lg ${color}`}
          >
            <div className="mb-2 text-2xl">{icon}</div>
            <h3 className={`mb-1 font-mono text-sm font-bold uppercase tracking-wider ${color.includes('yellow') ? 'text-[var(--sign-black)]' : 'text-white'}`}>{title}</h3>
            <p className={`text-xs ${color.includes('yellow') ? 'text-[var(--sign-black)]/70' : 'text-white/70'}`}>{desc}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
