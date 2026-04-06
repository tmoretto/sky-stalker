'use client';

import useSWR from 'swr';
import type { FlightRouteResponse } from '@/app/api/route/[callsign]/route';

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) return null;
    return res.json() as Promise<FlightRouteResponse>;
  });

export function useFlightRoute(callsign: string | null) {
  const key = callsign ? `/api/route/${encodeURIComponent(callsign)}` : null;

  const { data } = useSWR<FlightRouteResponse | null>(key, fetcher, {
    revalidateOnFocus: false,
    revalidateIfStale: false,
    dedupingInterval: 300_000, // 5 min — routes don't change mid-flight
  });

  return {
    origin: data?.origin ?? null,
    destination: data?.destination ?? null,
  };
}
