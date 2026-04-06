import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { fetchNearbyAircraft } from '@/lib/adsb/client';
import { haversineDistance } from '@/lib/adsb/geo';
import { buildPayload, sendNotification } from '@/lib/firebase/messaging';

const DEDUP_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Fetch all users that have a watch location and at least one FCM token
    const users = await prisma.user.findMany({
      where: {
        watchLat: { not: null },
        watchLon: { not: null },
        tokens: { some: {} },
      },
      include: {
        tokens: true,
        preferences: true,
      },
    });

    let totalNotifications = 0;

    for (const user of users) {
      const lat = user.watchLat!;
      const lon = user.watchLon!;
      const radius = user.watchRadius;

      let result;
      try {
        result = await fetchNearbyAircraft(lat, lon, radius);
      } catch (err) {
        console.error(`[cron/poll] fetch failed for user ${user.id}:`, err);
        continue;
      }

      // Check quiet hours
      if (user.preferences && isQuietHours(user.preferences.quietHoursStart, user.preferences.quietHoursEnd)) {
        continue;
      }

      // Find the cutoff for deduplication
      const cutoff = new Date(Date.now() - DEDUP_WINDOW_MS);

      // Get recently seen hex codes for this user
      const recentSightings = await prisma.sighting.findMany({
        where: { userId: user.id, seenAt: { gte: cutoff } },
        select: { hex: true },
      });
      const recentHexes = new Set(recentSightings.map((s) => s.hex));

      for (const aircraft of result.aircraft) {
        if (recentHexes.has(aircraft.hex)) continue;

        // Apply user preference filters
        const prefs = user.preferences;
        if (prefs) {
          if (!prefs.notifyHelicopters && isHelicopter(aircraft.aircraftType)) continue;
          if (!prefs.notifyMilitary && isMilitary(aircraft.hex)) continue;
          if (prefs.notifyAboveAlt != null && (aircraft.altitude ?? 0) <= prefs.notifyAboveAlt) continue;
          if (prefs.notifyBelowAlt != null && (aircraft.altitude ?? Infinity) >= prefs.notifyBelowAlt) continue;
        }

        const distance = haversineDistance(lat, lon, aircraft.lat, aircraft.lon);

        // Save sighting
        await prisma.sighting.create({
          data: {
            userId: user.id,
            hex: aircraft.hex,
            callsign: aircraft.callsign,
            aircraftType: aircraft.aircraftType,
            airline: aircraft.airline,
            altitude: aircraft.altitude,
            speed: aircraft.groundSpeed,
            lat: aircraft.lat,
            lon: aircraft.lon,
            heading: aircraft.heading,
            distance,
          },
        });

        // Send push to all user tokens
        const notification = buildPayload(aircraft, distance);
        for (const { token } of user.tokens) {
          try {
            await sendNotification(token, notification);
            totalNotifications++;
          } catch (err) {
            console.error(`[cron/poll] push failed for token ${token.slice(0, 8)}…:`, err);
          }
        }

        recentHexes.add(aircraft.hex);
      }
    }

    return NextResponse.json({ ok: true, users: users.length, notifications: totalNotifications });
  } catch (err) {
    console.error('[cron/poll] error:', err);
    return NextResponse.json({ error: 'Poll failed' }, { status: 500 });
  }
}

function isQuietHours(start: string | null, end: string | null): boolean {
  if (!start || !end) return false;
  const now = new Date();
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const currentMins = now.getHours() * 60 + now.getMinutes();
  const startMins = sh! * 60 + sm!;
  const endMins = eh! * 60 + em!;
  if (startMins <= endMins) return currentMins >= startMins && currentMins < endMins;
  // Wraps midnight
  return currentMins >= startMins || currentMins < endMins;
}

function isHelicopter(type: string | null): boolean {
  if (!type) return false;
  return type.toUpperCase().startsWith('H') || ['EC35', 'EC45', 'EC55', 'AS50'].includes(type.toUpperCase());
}

function isMilitary(hex: string): boolean {
  // US military hex ranges: AE0000–AFFFFF
  const n = parseInt(hex, 16);
  return n >= 0xae0000 && n <= 0xafffff;
}
