import { useState, useEffect, useCallback, useRef } from 'react';
import * as turf from '@turf/turf';
import { zbeZones } from '@/data/zbe-zones';

interface ProximityAlert {
  zoneName: string;
  distanceKm: number;
}

interface UseZBEProximityOptions {
  userTag: string;
  enabled: boolean;
  radiusKm?: number;
}

export function useZBEProximity({ userTag, enabled, radiusKm = 20 }: UseZBEProximityOptions) {
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [nearbyZones, setNearbyZones] = useState<ProximityAlert[]>([]);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const alertedZonesRef = useRef<Set<string>>(new Set());
  const watchIdRef = useRef<number | null>(null);

  // Create beep sound using Web Audio API
  const playBeep = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();

      oscillator.connect(gain);
      gain.connect(ctx.destination);

      oscillator.frequency.value = 880;
      oscillator.type = 'sine';
      gain.gain.setValueAtTime(0.5, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.5);

      // Second beep
      setTimeout(() => {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.frequency.value = 1100;
        osc2.type = 'sine';
        gain2.gain.setValueAtTime(0.5, ctx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc2.start(ctx.currentTime);
        osc2.stop(ctx.currentTime + 0.4);
      }, 300);
    } catch {
      // Fallback: vibrate if available
      if (navigator.vibrate) {
        navigator.vibrate([200, 100, 200]);
      }
    }
  }, []);

  const checkProximity = useCallback(
    (lat: number, lng: number) => {
      const userPoint = turf.point([lng, lat]);
      const now = new Date().toISOString().split('T')[0];
      const alerts: ProximityAlert[] = [];

      for (const feature of zbeZones.features) {
        const props = feature.properties;
        if (now < props.valid_from || now > props.valid_to) continue;
        if (props.allowed_tags.includes(userTag)) continue;

        const polygon = turf.polygon(feature.geometry.coordinates);
        const distance = turf.pointToPolygonDistance(userPoint, polygon, { units: 'kilometers' });

        // If inside the polygon, distance is 0
        const isInside = turf.booleanPointInPolygon(userPoint, polygon);
        const distKm = isInside ? 0 : distance;

        if (distKm <= radiusKm) {
          alerts.push({ zoneName: props.name, distanceKm: Math.round(distKm * 10) / 10 });

          // Play beep only once per zone entry into radius
          if (!alertedZonesRef.current.has(props.id)) {
            alertedZonesRef.current.add(props.id);
            playBeep();
          }
        } else {
          // Remove from alerted if moved away
          alertedZonesRef.current.delete(props.id);
        }
      }

      setNearbyZones(alerts);
    },
    [userTag, radiusKm, playBeep]
  );

  useEffect(() => {
    if (!enabled) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setPosition(null);
      setNearbyZones([]);
      alertedZonesRef.current.clear();
      return;
    }

    if (!('geolocation' in navigator)) {
      setError('Tu navegador no soporta geolocalización');
      return;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setPosition({ lat: latitude, lng: longitude });
        setError(null);
        checkProximity(latitude, longitude);
      },
      (err) => {
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError('Permiso de ubicación denegado. Actívalo en los ajustes del navegador.');
            break;
          case err.POSITION_UNAVAILABLE:
            setError('Ubicación no disponible');
            break;
          case err.TIMEOUT:
            setError('Tiempo de espera agotado');
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 5000,
      }
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [enabled, checkProximity]);

  return { position, nearbyZones, error };
}
