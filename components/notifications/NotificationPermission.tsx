'use client';

import { useNotifications } from '@/lib/hooks/useNotifications';

interface NotificationPermissionProps {
  userId: string | null;
}

export function NotificationPermission({ userId }: NotificationPermissionProps) {
  const { permission, requestPermission } = useNotifications(userId);

  if (permission === 'granted' || permission === 'unsupported') return null;

  return (
    <div className="flex items-center gap-3 rounded-lg border-2 border-[var(--sign-yellow)]/30 bg-[var(--fids-row)] px-4 py-3 font-mono text-xs">
      <span className="text-lg">🔔</span>
      <span className="flex-1 uppercase tracking-wider text-[var(--fids-amber)]">
        Enable notifications to be alerted when aircraft enter your zone
      </span>
      {permission === 'denied' ? (
        <span className="shrink-0 rounded-lg bg-[var(--sign-red)] px-3 py-1.5 font-bold uppercase tracking-wider text-white">BLOCKED</span>
      ) : (
        <button
          onClick={requestPermission}
          className="shrink-0 rounded-lg bg-[var(--sign-green)] px-4 py-1.5 font-bold uppercase tracking-wider text-white shadow transition-all hover:brightness-110"
        >
          ENABLE
        </button>
      )}
    </div>
  );
}
