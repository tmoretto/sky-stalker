'use client';

/**
 * FIDS-style skeleton loading cards — mimics the AircraftCard layout
 * with flickering placeholder bars like a real departure board updating.
 */

function SkeletonBar({ width, className = '' }: { width: string; className?: string }) {
  return (
    <div
      className={`fids-flicker h-3 rounded-sm bg-[var(--fids-green)]/15 ${className}`}
      style={{ width }}
    />
  );
}

function SkeletonRow({ delay }: { delay: number }) {
  return (
    <div
      className="w-full border-b border-[var(--fids-border)] px-3 py-2.5 bg-[var(--fids-row)]"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Row 1: Callsign + distance */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="fids-flicker h-6 w-6 rounded-full bg-white/5" style={{ animationDelay: `${delay}ms` }} />
          <SkeletonBar width="72px" className="h-3.5" />
          <SkeletonBar width="36px" className="h-3" />
        </div>
        <SkeletonBar width="48px" className="h-3" />
      </div>
      {/* Row 2: Data chips */}
      <div className="mt-1.5 flex gap-x-4">
        <SkeletonBar width="64px" />
        <SkeletonBar width="56px" />
        <SkeletonBar width="48px" />
      </div>
      {/* Row 3: Route + button */}
      <div className="mt-2 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <SkeletonBar width="28px" className="h-3.5" />
          <div className="fids-flicker mx-1 h-2 w-2 rounded-full bg-[var(--fids-amber)]/20" />
          <SkeletonBar width="28px" className="h-3.5" />
        </div>
        <div className="fids-flicker h-6 w-16 rounded bg-[var(--sign-blue)]/30" />
      </div>
    </div>
  );
}

export function AircraftListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="flex flex-col">
      {Array.from({ length: count }, (_, i) => (
        <SkeletonRow key={i} delay={i * 120} />
      ))}
    </div>
  );
}

export function MapSkeleton() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-[var(--fids-bg)]">
      <div className="flex flex-col items-center gap-4">
        {/* Radar circle animation */}
        <div className="relative h-24 w-24">
          <div className="absolute inset-0 rounded-full border-2 border-[var(--fids-green)]/20" />
          <div className="absolute inset-3 rounded-full border border-[var(--fids-green)]/10" />
          <div className="absolute inset-6 rounded-full border border-[var(--fids-green)]/10" />
          <div className="absolute inset-0 rounded-full" style={{
            background: 'conic-gradient(from 0deg, transparent 0deg, transparent 340deg, rgba(34,197,94,0.3) 360deg)',
            animation: 'radarSpin 3s linear infinite',
          }} />
          <div className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--fids-green)] shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
        </div>
        <span className="fids-flicker font-mono text-xs uppercase tracking-[0.2em] text-[var(--fids-green)]/60">
          ACQUIRING SIGNAL…
        </span>
      </div>
    </div>
  );
}
