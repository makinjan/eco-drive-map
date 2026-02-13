import { useState, useEffect, useRef, useCallback } from 'react';
import * as turf from '@turf/turf';
import type { RoutePOI } from '@/components/MapView';

export interface NavigationStep {
  instruction: string; // HTML instructions from Google
  plainText: string; // Plain text for speech
  distance: number; // meters
  duration: number; // seconds
  startLocation: { lat: number; lng: number };
  endLocation: { lat: number; lng: number };
  maneuver?: string;
}

interface NavigationState {
  isNavigating: boolean;
  userPosition: { lat: number; lng: number } | null;
  heading: number | null;
  speed: number | null;
  distanceRemaining: number | null;
  timeRemaining: number | null;
  nearestPointOnRoute: { lat: number; lng: number } | null;
  progressPercent: number;
  error: string | null;
  currentStepIndex: number;
  steps: NavigationStep[];
  distanceToNextStep: number | null;
}

interface UseNavigationOptions {
  routePath: { lat: number; lng: number }[];
  origin: { lat: number; lng: number } | null;
  destination: { lat: number; lng: number } | null;
  onArrival?: () => void;
  pois?: RoutePOI[];
}

const ARRIVAL_THRESHOLD_METERS = 50;
const STEP_ADVANCE_THRESHOLD_METERS = 30;
const ANNOUNCE_THRESHOLD_METERS = 150;
const POI_ANNOUNCE_DISTANCE_METERS = 500;

function stripHtml(html: string): string {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
}

function speak(text: string) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'es-ES';
  utterance.rate = 1.0;
  utterance.pitch = 1.0;
  utterance.volume = 1.0;
  // Try to find a Spanish voice
  const voices = window.speechSynthesis.getVoices();
  const esVoice = voices.find((v) => v.lang.startsWith('es'));
  if (esVoice) utterance.voice = esVoice;
  window.speechSynthesis.speak(utterance);
}

export function useNavigation({ routePath, origin, destination, onArrival, pois = [] }: UseNavigationOptions) {
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
    currentStepIndex: 0,
    steps: [],
    distanceToNextStep: null,
  });

  const watchIdRef = useRef<number | null>(null);
  const routeLineRef = useRef<ReturnType<typeof turf.lineString> | null>(null);
  const totalDistanceRef = useRef<number>(0);
  const announcedStepsRef = useRef<Set<number>>(new Set());
  const preAnnouncedStepsRef = useRef<Set<number>>(new Set());
  const announcedPOIsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (routePath.length >= 2) {
      const line = turf.lineString(routePath.map((p) => [p.lng, p.lat]));
      routeLineRef.current = line;
      totalDistanceRef.current = turf.length(line, { units: 'meters' });
    }
  }, [routePath]);

  // Load voices
  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
    }
  }, []);

  const fetchDirectionsSteps = useCallback(async () => {
    if (!origin || !destination) return [];
    try {
      const directionsService = new google.maps.DirectionsService();
      const result = await directionsService.route({
        origin,
        destination,
        travelMode: google.maps.TravelMode.DRIVING,
      });

      if (!result.routes?.[0]?.legs?.[0]?.steps) return [];

      const steps: NavigationStep[] = result.routes[0].legs[0].steps.map((step) => ({
        instruction: step.instructions || '',
        plainText: stripHtml(step.instructions || ''),
        distance: step.distance?.value ?? 0,
        duration: step.duration?.value ?? 0,
        startLocation: {
          lat: step.start_location.lat(),
          lng: step.start_location.lng(),
        },
        endLocation: {
          lat: step.end_location.lat(),
          lng: step.end_location.lng(),
        },
        maneuver: (step as any).maneuver || undefined,
      }));

      return steps;
    } catch (err) {
      console.error('Failed to fetch direction steps:', err);
      return [];
    }
  }, [origin, destination]);

  const startNavigation = useCallback(async () => {
    if (!navigator.geolocation) {
      setState((s) => ({ ...s, error: 'Geolocalización no disponible en este dispositivo' }));
      return;
    }
    if (routePath.length < 2) {
      setState((s) => ({ ...s, error: 'No hay ruta calculada' }));
      return;
    }

    // Fetch step-by-step directions
    const steps = await fetchDirectionsSteps();

    announcedStepsRef.current = new Set();
    preAnnouncedStepsRef.current = new Set();
    announcedPOIsRef.current = new Set();

    setState((s) => ({
      ...s,
      isNavigating: true,
      error: null,
      steps,
      currentStepIndex: 0,
      distanceToNextStep: null,
    }));

    // Announce start
    if (steps.length > 0) {
      speak(`Navegación iniciada. ${steps[0].plainText}`);
      announcedStepsRef.current.add(0);
    } else {
      speak('Navegación iniciada. Sigue la ruta marcada en azul.');
    }

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

        const snappedLocation = snapped.properties.location ?? 0;
        const totalDist = totalDistanceRef.current;
        const distanceRemaining = Math.max(0, totalDist - snappedLocation);
        const progressPercent = totalDist > 0 ? Math.min(100, (snappedLocation / totalDist) * 100) : 0;

        const currentSpeed = speed && speed > 0 ? speed : 10;
        const timeRemaining = distanceRemaining / currentSpeed;

        setState((prev) => {
          let newStepIndex = prev.currentStepIndex;
          let distToNext: number | null = null;

          if (prev.steps.length > 0) {
            // Check if we're close to the next step's start
            for (let i = newStepIndex; i < prev.steps.length; i++) {
              const stepEnd = prev.steps[i].endLocation;
              const dist = turf.distance(userPt, turf.point([stepEnd.lng, stepEnd.lat]), { units: 'meters' });
              if (dist < STEP_ADVANCE_THRESHOLD_METERS && i > newStepIndex) {
                newStepIndex = Math.min(i + 1, prev.steps.length - 1);
                break;
              }
            }

            // Calculate distance to current step's end
            if (newStepIndex < prev.steps.length) {
              const stepEnd = prev.steps[newStepIndex].endLocation;
              distToNext = turf.distance(userPt, turf.point([stepEnd.lng, stepEnd.lat]), { units: 'meters' });
            }

            // Pre-announce next step when approaching
            const nextIdx = newStepIndex + 1;
            if (
              nextIdx < prev.steps.length &&
              distToNext != null &&
              distToNext < ANNOUNCE_THRESHOLD_METERS &&
              !preAnnouncedStepsRef.current.has(nextIdx)
            ) {
              preAnnouncedStepsRef.current.add(nextIdx);
              const dist = Math.round(distToNext);
              speak(`En ${dist} metros, ${prev.steps[nextIdx].plainText}`);
            }

            // Announce current step when advancing
            if (newStepIndex !== prev.currentStepIndex && !announcedStepsRef.current.has(newStepIndex)) {
              announcedStepsRef.current.add(newStepIndex);
              speak(prev.steps[newStepIndex].plainText);
            }
          }

          return {
            ...prev,
            userPosition: userPos,
            heading: heading ?? prev.heading,
            speed: speed ?? null,
            distanceRemaining,
            timeRemaining,
            nearestPointOnRoute: nearestPoint,
            progressPercent,
            currentStepIndex: newStepIndex,
            distanceToNextStep: distToNext,
            error: null,
          };
        });

        // Announce nearby POIs
        for (const poi of pois) {
          if (announcedPOIsRef.current.has(poi.id)) continue;
          const dist = turf.distance(userPt, turf.point([poi.position.lng, poi.position.lat]), { units: 'meters' });
          if (dist < POI_ANNOUNCE_DISTANCE_METERS) {
            announcedPOIsRef.current.add(poi.id);
            const label = poi.type === 'gas_station' ? 'gasolinera' : 'área de servicio';
            speak(`${label} cercana: ${poi.name}, a ${Math.round(dist)} metros`);
          }
        }

        if (distanceRemaining < ARRIVAL_THRESHOLD_METERS) {
          speak('Has llegado a tu destino.');
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
  }, [routePath, fetchDirectionsSteps, onArrival]);

  const stopNavigation = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
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
      currentStepIndex: 0,
      steps: [],
      distanceToNextStep: null,
    });
  }, []);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return {
    ...state,
    startNavigation,
    stopNavigation,
  };
}
