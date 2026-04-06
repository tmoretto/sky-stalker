'use client';

import useSWR from 'swr';
import { useSettings } from '@/lib/store/settings';
import type { PredictResponse } from '@/app/api/aircraft/predict/route';

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json() as Promise<PredictResponse>;
  });

export function usePredictions() {
  const lat = useSettings((s) => s.lat);
  const lon = useSettings((s) => s.lon);
  const radiusNm = useSettings((s) => s.radiusNm);

  const key =
    lat != null && lon != null
      ? `/api/aircraft/predict?lat=${lat}&lon=${lon}&radius=${radiusNm}`
      : null;

  const { data, isLoading } = useSWR<PredictResponse>(key, fetcher, {
    refreshInterval: 60_000, // re-run every 60s — predictions drift slowly
    revalidateOnFocus: false,
  });

  return {
    predictions: data?.predictions ?? [],
    isLoading,
  };
}
