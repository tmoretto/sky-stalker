'use client';

import { useState, useEffect, useCallback } from 'react';
import { getToken, onMessage } from 'firebase/messaging';
import { getFirebaseMessaging } from '@/lib/firebase/client';

type NotificationPermission = 'default' | 'granted' | 'denied' | 'unsupported';

interface NotificationsState {
  permission: NotificationPermission;
  token: string | null;
  requestPermission: () => Promise<void>;
}

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

export function useNotifications(userId: string | null): NotificationsState {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setPermission('unsupported');
      return;
    }
    setPermission(Notification.permission as NotificationPermission);
  }, []);

  const saveToken = useCallback(
    async (fcmToken: string) => {
      if (!userId) return;
      setToken(fcmToken);
      await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: fcmToken,
          userId,
          device: navigator.userAgent.slice(0, 200),
        }),
      });
    },
    [userId],
  );

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) return;

    const result = await Notification.requestPermission();
    setPermission(result as NotificationPermission);
    if (result !== 'granted') return;

    const messaging = await getFirebaseMessaging();
    if (!messaging || !VAPID_KEY) return;

    try {
      const fcmToken = await getToken(messaging, { vapidKey: VAPID_KEY });
      await saveToken(fcmToken);
    } catch (err) {
      console.error('[useNotifications] getToken failed:', err);
    }
  }, [saveToken]);

  // Listen for foreground messages
  useEffect(() => {
    if (permission !== 'granted') return;
    let unsubscribe: (() => void) | undefined;

    getFirebaseMessaging().then((messaging) => {
      if (!messaging) return;
      unsubscribe = onMessage(messaging, (payload) => {
        // Show a browser notification manually since FCM suppresses them in foreground
        if (payload.notification) {
          new Notification(payload.notification.title ?? 'SkyStalker', {
            body: payload.notification.body,
            icon: payload.notification.icon ?? '/icons/icon-192x192.png',
          });
        }
      });
    });

    return () => unsubscribe?.();
  }, [permission]);

  return { permission, token, requestPermission };
}
