import 'server-only';
import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getMessaging, type Messaging } from 'firebase-admin/messaging';

let adminApp: App;

function getAdminApp(): App {
  if (adminApp) return adminApp;
  if (getApps().length) {
    adminApp = getApps()[0]!;
    return adminApp;
  }

  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!serviceAccountKey) throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY is not set');

  const serviceAccount = JSON.parse(serviceAccountKey);
  adminApp = initializeApp({ credential: cert(serviceAccount) });
  return adminApp;
}

export function getAdminMessaging(): Messaging {
  return getMessaging(getAdminApp());
}
