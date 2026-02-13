import { useState, useEffect, useRef, useCallback } from 'react';
import * as turf from '@turf/turf';

interface NavigationState {
  isNavigating: boolean;
  userPosition: { lat: number; lng: number } | null;
  heading: number | null;
  speed: number | null; // m/s
  distanceRemaining: number | null; // meters
  timeRemaining: number | null; // seconds
  nearestPointOnRoute: { lat: number; lng: number } | null;
  progressPercent: number;
  error: string | null;
}

interface UseNavigationOptions {
  routePath: { lat: number; lng: number }[];
  onArrival?: () => void;
}

const ARRIVAL_THRESHOLD_METERS = 50;

export function useNavigation({ routePath, onArrival }: UseNavigationOptions) {
  const [state, setState] = useState<NavigationState>({
    isNavigating: false,
    userPosition: null,
    heading: null,
    speed: null,
    distanceRemaining: null,
    timeRemaining: null,
    nearestPointOnRoute: null,
    progressPercent: 0,
    error: null,
  });

  const watchIdRef = useRef<number | null>(null);
  const routeLineRef = useRef<ReturnType<typeof turf.lineString> | null>(null);
  const totalDistanceRef = useRef<number>(0);

  useEffect(() => {
    if (routePath.length >= 2) {
      const line = turf.lineString(routePath.map((p) => [p.lng, p.lat]));
      routeLineRef.current = line;
      totalDistanceRef.current = turf.length(line, { units: 'meters' });
    }
  }, [routePath]);

  const startNavigation = useCallback(() => {
    if (!navigator.geolocation) {
      setState((s) => ({ ...s, error: 'Geolocalización no disponible en este dispositivo' }));
      return;
    }
    if (routePath.length < 2) {
      setState((s) => ({ ...s, error: 'No hay ruta calculada' }));
      return;
    }

    setState((s) => ({ ...s, isNavigating: true, error: null }));

    const id = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, heading, speed } = position.coords;
        const userPos = { lat: latitude, lng: longitude };
        const userPt = turf.point([longitude, latitude]);

        const routeLine = routeLineRef.current;
        if (!routeLine) return;

        const snapped = turf.nearestPointOnLine(routeLine, userPt, { units: 'meters' });
        const nearestCoord = snapped.geometry.coordinates;
        const nearestPoint = { lat: nearestCoord[1], lng: nearestCoord[0] };

        // Distance from snapped point to end of route
        const snappedLocation = snapped.properties.location ?? 0; // distance along line in meters
        const totalDist = totalDistanceRef.current;
        const distanceRemaining = Math.max(0, totalDist - snappedLocation);
        const progressPercent = totalDist > 0 ? Math.min(100, (snappedLocation / totalDist) * 100) : 0;

        // Estimate time remaining based on speed
        const currentSpeed = speed && speed > 0 ? speed : 10; // default 10 m/s (~36 km/h)
        const timeRemaining = distanceRemaining / currentSpeed;

        setState((s) => ({
          ...s,
          userPosition: userPos,
          heading: heading ?? s.heading,
          speed: speed ?? null,
          distanceRemaining,
          timeRemaining,
          nearestPointOnRoute: nearestPoint,
          progressPercent,
          error: null,
        }));

        // Check arrival
        if (distanceRemaining < ARRIVAL_THRESHOLD_METERS) {
          onArrival?.();
        }
      },
      (err) => {
        setState((s) => ({
          ...s,
          error: err.code === 1
            ? 'Permiso de ubicación denegado'
            : 'Error al obtener la ubicación',
        }));
      },
      {
        enableHighAccuracy: true,
        maximumAge: 2000,
        timeout: 10000,
      }
    );

    watchIdRef.current = id;
  }, [routePath, onArrival]);

  const stopNavigation = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setState({
      isNavigating: false,
      userPosition: null,
      heading: null,
      speed: null,
      distanceRemaining: null,
      timeRemaining: null,
      nearestPointOnRoute: null,
      progressPercent: 0,
      error: null,
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return {
    ...state,
    startNavigation,
    stopNavigation,
  };
}
