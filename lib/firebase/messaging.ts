import 'server-only';
import { getAdminMessaging } from './admin';
import { prisma } from '@/lib/db';
import type { SkyNotification } from '@/types';
import type { Aircraft } from '@/types';

export function buildPayload(aircraft: Aircraft, distanceNm: number): SkyNotification {
  const callsign = aircraft.callsign ?? aircraft.hex.toUpperCase();
  const alt = aircraft.altitude != null ? `${aircraft.altitude.toLocaleString()}ft` : 'unknown alt';
  const hdg = aircraft.heading != null ? headingToCompass(aircraft.heading) : null;
  const body = [
    aircraft.aircraftType ?? 'Aircraft',
    `at ${alt}`,
    hdg ? `heading ${hdg}` : null,
    `· ${distanceNm.toFixed(1)}nm away`,
  ]
    .filter(Boolean)
    .join(' ');

  return {
    title: `✈️ ${callsign} overhead!`,
    body,
    icon: `/planes/${aircraftIcon(aircraft.aircraftType)}.svg`,
    data: {
      hex: aircraft.hex,
      lat: aircraft.lat,
      lon: aircraft.lon,
      flight: callsign,
      altitude: aircraft.altitude ?? 0,
      aircraft_type: aircraft.aircraftType ?? '',
    },
  };
}

export async function sendNotification(token: string, payload: SkyNotification): Promise<void> {
  const messaging = getAdminMessaging();
  try {
    await messaging.send({
      token,
      notification: { title: payload.title, body: payload.body },
      webpush: {
        notification: { icon: payload.icon, badge: '/icons/badge.png' },
        data: Object.fromEntries(
          Object.entries(payload.data).map(([k, v]) => [k, String(v)]),
        ),
      },
    });
  } catch (err: unknown) {
    const code = (err as { errorInfo?: { code?: string } })?.errorInfo?.code;
    if (code === 'messaging/registration-token-not-registered') {
      await prisma.fcmToken.deleteMany({ where: { token } });
    } else {
      throw err;
    }
  }
}

function headingToCompass(deg: number): string {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round(deg / 45) % 8]!;
}

function aircraftIcon(type: string | null): string {
  if (!type) return 'generic';
  const t = type.toUpperCase();
  if (t.startsWith('H') || t === 'EC35' || t === 'EC45') return 'helicopter';
  if (t === 'A388' || t === 'B748' || t === 'B744') return 'widebody';
  return 'jet';
}
