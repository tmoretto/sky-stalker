'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSettings } from '@/lib/store/settings';

type PermissionState = 'idle' | 'requesting' | 'granted' | 'denied' | 'unavailable';

interface GeolocationState {
  permissionState: PermissionState;
  error: string | null;
  requestPermission: () => void;
}

export function useGeolocation(): GeolocationState {
  const [permissionState, setPermissionState] = useState<PermissionState>('idle');
  const [error, setError] = useState<string | null>(null);
  const setLocation = useSettings((s) => s.setLocation);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handlePosition = useCallback(
    (position: GeolocationPosition) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        setLocation(position.coords.latitude, position.coords.longitude);
        setPermissionState('granted');
      }, 500);
    },
    [setLocation],
  );

  const handleError = useCallback((err: GeolocationPositionError) => {
    setPermissionState(err.code === 1 ? 'denied' : 'unavailable');
    setError(err.message);
  }, []);

  const requestPermission = useCallback(() => {
    if (!navigator.geolocation) {
      setPermissionState('unavailable');
      setError('Geolocation is not supported by this browser');
      return;
    }
    setPermissionState('requesting');
    navigator.geolocation.getCurrentPosition(handlePosition, handleError, {
      enableHighAccuracy: false,
      timeout: 10000,
      maximumAge: 60000,
    });
  }, [handlePosition, handleError]);

  // Auto-request on mount if we have stored coords already (just refresh)
  useEffect(() => {
    const stored = useSettings.getState();
    if (stored.lat !== null && stored.lon !== null) {
      setPermissionState('granted');
    }
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return { permissionState, error, requestPermission };
}
