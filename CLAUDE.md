# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> Real-time aircraft tracking with push notifications. Spot every plane above you.

---

## Tech Stack

| Layer              | Technology                                                        |
| ------------------ | ----------------------------------------------------------------- |
| Framework          | Next.js 15 (App Router, `app/` directory)                         |
| Language           | TypeScript (strict mode)                                          |
| Styling            | Tailwind CSS 4 + `@tailwindcss/typography`                        |
| Map                | Leaflet via `react-leaflet` (OpenStreetMap tiles — no API key)    |
| Aircraft Data      | Airplanes.live REST API (primary), OpenSky Network API (fallback) |
| Push Notifications | Firebase Cloud Messaging (FCM) via `firebase` + `firebase-admin`  |
| Background Jobs    | Next.js Route Handlers + Vercel Cron (or `node-cron` self-hosted) |
| Database           | Prisma ORM + SQLite (dev) / PostgreSQL (prod)                     |
| Auth               | NextAuth.js v5                                                    |
| State Management   | Zustand (`lib/store/settings.ts`)                                 |
| HTTP Client        | Native `fetch` (server), `swr` (client)                           |
| Package Manager    | pnpm                                                              |
| Formatting         | Prettier (printWidth: 100, singleQuote: true, trailingComma: all) |

---

## Commands

```bash
pnpm dev              # Start dev server (localhost:3000)
pnpm build            # Production build
pnpm lint             # ESLint check
pnpm format           # Prettier write
pnpm format:check     # Prettier check (CI)
pnpm prisma:generate  # Generate Prisma client
pnpm prisma:migrate   # Run migrations (dev)
pnpm prisma:studio    # Open Prisma Studio
pnpm test             # Vitest unit tests
pnpm test:e2e         # Playwright E2E tests
```

Run a single Vitest test file: `pnpm test path/to/file.test.ts`

---

## Architecture

### Request Flow

```
Browser → /api/aircraft?lat&lon&radius
            → lib/adsb/client.ts (Airplanes.live, 1 req/sec throttle)
            → lib/adsb/transform.ts (normalize to internal Aircraft type)
            → JSON response

Vercel Cron → /api/cron/poll (CRON_SECRET header required)
            → fetch each user's watch zone
            → deduplicate via Sighting table (hex+userId, 10-min window)
            → lib/firebase/messaging.ts → FCM push → browser service worker
```

### Key Architectural Constraints

- **All ADS-B fetches are server-side only** — browser never calls Airplanes.live directly (CORS + rate limit enforcement).
- **All API responses must pass through `lib/adsb/transform.ts`** before reaching any component or database. Never store or forward raw API shapes.
- **Leaflet must always be dynamically imported** with `next/dynamic` + `ssr: false` — it accesses `window` at import time.
- **`lib/firebase/admin.ts` is server-only** — never import it in client components or anywhere with a `NEXT_PUBLIC_` prefix.
- **`public/firebase-messaging-sw.js` must exist at the public root** — FCM requires it for background push. The `importScripts` version must match the `firebase` version in `package.json`.

### Data Layer

Prisma schema lives in `prisma/schema.prisma`. Key relationships:
- `User` → many `FcmToken` (multi-device support)
- `User` → many `Sighting` (indexed on `[userId, seenAt]` and `[hex]`)
- `User` → one `Preference` (notification filters, quiet hours, unit system)

Watch location (`watchLat`, `watchLon`, `watchRadius`) is stored on the `User` model, not in `Preference`.

### FCM Token Lifecycle

1. Browser requests permission → gets FCM token
2. `POST /api/notifications/subscribe` saves token to `FcmToken` table
3. Cron job sends to all tokens for a user
4. On `messaging/token-not-registered` error: auto-delete the stale `FcmToken` row

---

## ADS-B Data Sources

### Primary: Airplanes.live

- Base URL: `https://api.airplanes.live/v2`
- Rate limit: **1 req/sec** — enforced in `lib/adsb/client.ts`
- Key endpoint: `/point/{lat}/{lon}/{radius}` (radius in nautical miles, max 250)
- Response: `{ ac: AircraftState[], msg: string, now: number, total: number }`

### Fallback: OpenSky Network

- Base URL: `https://opensky-network.org/api`
- Endpoint: `/states/all?lamin&lomin&lamax&lomax` (bounding box)
- Anonymous limit: 100 req/day — use only as fallback, not in parallel

---

## Environment Variables

```env
# Client-side (must have NEXT_PUBLIC_ prefix)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_VAPID_KEY=

# Server-side only
FIREBASE_SERVICE_ACCOUNT_KEY=   # JSON string of the service account
DATABASE_URL=                   # Prisma connection string
CRON_SECRET=                    # Bearer token checked by /api/cron/poll
```

---

## Coding Standards

- Functional components only; named exports; one component per file
- Props interfaces defined directly above the component that uses them
- Max 200 lines per file — extract hooks or sub-components when exceeded
- Route Handlers: always `try/catch`, return typed `NextResponse.json()` with explicit status codes
- `fetch` calls: always check `response.ok` before parsing
- ADS-B client: exponential backoff retry, max 3 attempts
- Geolocation updates: debounce 500ms before triggering aircraft queries
- Client polling: SWR with 15s `refreshInterval` — no client-side `setInterval`

---

## Implementation Milestones (FR-IDs)

Track progress against these when building features:

| ID     | Description |
|--------|-------------|
| FR-001 | Next.js 15 scaffold — TypeScript, Tailwind, ESLint, Prettier |
| FR-002 | Prisma schema + SQLite dev migration |
| FR-003 | `lib/adsb/client.ts` — Airplanes.live with rate limiter |
| FR-004 | `lib/adsb/transform.ts` — normalize to `Aircraft` type |
| FR-005 | `/api/aircraft` proxy route |
| FR-006 | `useGeolocation` hook with permission state machine |
| FR-007 | `AircraftMap` (dynamic Leaflet import) |
| FR-008 | `PlaneMarker` with SVG heading rotation + tooltip |
| FR-009 | `RadiusOverlay` Circle bound to Zustand store |
| FR-010 | Dashboard page composing map + list |
| FR-011 | Firebase client SDK + VAPID config |
| FR-012 | `public/firebase-messaging-sw.js` |
| FR-013 | `useNotifications` hook — permission + token management |
| FR-014 | `/api/notifications/subscribe` — save FCM token |
| FR-015 | `lib/firebase/admin.ts` + `messaging.ts` |
| FR-016 | `/api/notifications/send` route |
| FR-017 | `/api/cron/poll` — per-user fetch + dedup + notify |
| FR-018 | Sighting deduplication (10-min window, hex+userId) |
| FR-019 | Wire cron push to FCM |
| FR-020 | Vercel Cron config (`vercel.json`) or `node-cron` |
| FR-021 | Settings page — radius, filters, quiet hours |
| FR-022 | History page — paginated sightings |
| FR-023 | `NotificationBell` with unread badge |
| FR-024 | PWA manifest + `next-pwa` (note: FCM SW is separate from PWA SW) |
| FR-025 | Landing page |
