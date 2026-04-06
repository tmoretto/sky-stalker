import Link from 'next/link';
import { NotificationBell } from '@/components/notifications/NotificationBell';

interface HeaderProps {
  unreadCount?: number;
}

export function Header({ unreadCount = 0 }: HeaderProps) {
  return (
    <header className="ambient-header sticky top-0 z-50 flex h-16 items-center justify-between border-b border-white/10 bg-[var(--sign-blue)]/60 px-5 backdrop-blur-xl backdrop-saturate-150 shadow-[0_4px_30px_rgba(0,61,165,0.3)]">
      <Link href="/" className="flex items-center gap-3 transition-transform hover:scale-105">
        <span className="text-2xl">✈️</span>
        <span className="font-mono text-xl font-bold uppercase tracking-[0.2em] text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">SkyStalker</span>
      </Link>
      <nav className="flex items-center gap-2 font-mono text-xs font-bold">
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 rounded-lg bg-[var(--sign-yellow)]/85 px-3 py-2 uppercase tracking-wider text-[var(--sign-black)] backdrop-blur-sm transition-all hover:bg-[var(--sign-yellow)] hover:shadow-[0_0_12px_rgba(255,199,44,0.4)]"
        >
          <span>📡</span> <span className="hidden sm:inline">Dashboard</span>
        </Link>
        <Link
          href="/history"
          className="flex items-center gap-1.5 rounded-lg bg-[var(--sign-yellow)]/85 px-3 py-2 uppercase tracking-wider text-[var(--sign-black)] backdrop-blur-sm transition-all hover:bg-[var(--sign-yellow)] hover:shadow-[0_0_12px_rgba(255,199,44,0.4)]"
        >
          <span>📜</span> <span className="hidden sm:inline">History</span>
        </Link>
        <Link
          href="/settings"
          className="flex items-center gap-1.5 rounded-lg bg-[var(--sign-yellow)]/85 px-3 py-2 uppercase tracking-wider text-[var(--sign-black)] backdrop-blur-sm transition-all hover:bg-[var(--sign-yellow)] hover:shadow-[0_0_12px_rgba(255,199,44,0.4)]"
        >
          <span>⚙️</span> <span className="hidden sm:inline">Settings</span>
        </Link>
        <NotificationBell unreadCount={unreadCount} />
      </nav>
    </header>
  );
}
