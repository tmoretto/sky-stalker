import { NextRequest, NextResponse } from 'next/server';
import { sendNotification } from '@/lib/firebase/messaging';
import type { SkyNotification } from '@/types';

interface SendBody {
  token: string;
  notification: SkyNotification;
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = (await request.json()) as SendBody;
    const { token, notification } = body;

    if (!token || !notification) {
      return NextResponse.json({ error: 'token and notification are required' }, { status: 400 });
    }

    await sendNotification(token, notification);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[/api/notifications/send]', err);
    return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 });
  }
}
