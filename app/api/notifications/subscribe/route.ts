// TODO(auth): Once NextAuth is configured, replace userId from body with
// session.user.id from auth(). The caller must not supply their own userId.
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// FCM tokens are ~150–200 chars, alphanumeric + colons + hyphens.
const FCM_TOKEN_RE = /^[A-Za-z0-9\-_:]{100,300}$/;

interface SubscribeBody {
  token: string;
  userId: string;
  device?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SubscribeBody;
    const { token, userId, device } = body;

    if (!token || !userId) {
      return NextResponse.json({ error: 'token and userId are required' }, { status: 400 });
    }

    if (!FCM_TOKEN_RE.test(token)) {
      return NextResponse.json({ error: 'Invalid token format' }, { status: 400 });
    }

    const deviceLabel = typeof device === 'string' ? device.slice(0, 200) : null;

    await prisma.fcmToken.upsert({
      where: { token },
      update: { userId, device: deviceLabel },
      create: { token, userId, device: deviceLabel },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[/api/notifications/subscribe]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
