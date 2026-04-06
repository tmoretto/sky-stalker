'use client';

import useSWR from 'swr';
import { useSettings } from '@/lib/store/settings';
import type { NearbyAircraftResponse } from '@/types';

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json() as Promise<NearbyAircraftResponse>;
  });

export function useAircraft() {
  const lat = useSettings((s) => s.lat);
  const lon = useSettings((s) => s.lon);
  const radiusNm = useSettings((s) => s.radiusNm);

  const key =
    lat != null && lon != null
      ? `/api/aircraft?lat=${lat}&lon=${lon}&radius=${radiusNm}`
      : null;

  const { data, error, isLoading, mutate } = useSWR<NearbyAircraftResponse>(key, fetcher, {
    refreshInterval: 15000,
    revalidateOnFocus: false,
  });

  return {
    aircraft: data?.aircraft ?? [],
    fetchedAt: data?.fetchedAt ?? null,
    source: data?.source ?? null,
    isLoading,
    error,
    refresh: mutate,
  };
}
