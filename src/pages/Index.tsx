import { useState, useCallback, useEffect, useRef } from 'react';
import type { RadarPoint } from '@/data/radares-spain';
import { useZBEProximity } from '@/hooks/use-zbe-proximity';
import { useWakeLock } from '@/hooks/use-wake-lock';
import { useNavigation } from '@/hooks/use-navigation';
import { useVoiceInput, parseVoiceCommand } from '@/hooks/use-voice-input';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { useGoogleMapsLoader } from '@/lib/google-maps-loader';
import MapView from '@/components/MapView';
import type { RoutePOI } from '@/components/MapView';
import NavigationOverlay from '@/components/NavigationOverlay';
import Sidebar from '@/components/Sidebar';
import MobilePanel from '@/components/MobilePanel';
import { useIsMobile } from '@/hooks/use-mobile';
import { GOOGLE_MAPS_API_KEY } from '@/lib/google-maps-config';
import { validateRoute } from '@/lib/route-validator';
import { getAvoidanceWaypoints, getPointInZBE, getNearestPointOutsideZBE, type SafePoint } from '@/lib/zbe-avoidance';
import type { ValidationResult } from '@/lib/route-validator';
import type { PlaceResult } from '@/components/SearchInput';
import { toast } from 'sonner';
import { speak } from '@/lib/speak';
import { shareRoute, parseShareURL } from '@/lib/share-route';
import { useRouteHistory, useFavorites } from '@/hooks/use-route-history';

type RouteStatus = 'idle' | 'loading' | 'valid' | 'invalid' | 'no-route';

interface RouteInfo {
  path: { lat: number; lng: number }[];
  duration: number | null;
  durationInTraffic: number | null;
  distance: number | null;
}

const Index = () => {
  const { isLoaded: mapsLoaded } = useGoogleMapsLoader();
  const isOnline = useOnlineStatus();
  const [selectedTag, setSelectedTag] = useState(() => {
    return localStorage.getItem('zbe-user-tag') || 'C';
  });

  const handleTagChange = useCallback((tag: string) => {
    setSelectedTag(tag);
    localStorage.setItem('zbe-user-tag', tag);
  }, []);
  const [origin, setOrigin] = useState<PlaceResult | null>(null);
  const [destination, setDestination] = useState<PlaceResult | null>(null);
  const [waypoints, setWaypoints] = useState<(PlaceResult | null)[]>([]);
  const [routePath, setRoutePath] = useState<{ lat: number; lng: number }[]>([]);
  const [routeStatus, setRouteStatus] = useState<RouteStatus>('idle');
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [routeDuration, setRouteDuration] = useState<number | null>(null);
  const [routeDistance, setRouteDistance] = useState<number | null>(null);

  const [altRoute, setAltRoute] = useState<RouteInfo | null>(null);
  const [safeOrigin, setSafeOrigin] = useState<SafePoint | null>(null);
  const [safeDest, setSafeDest] = useState<SafePoint | null>(null);
  const skipRecalcRef = useRef(false);
  const [routePOIs, setRoutePOIs] = useState<RoutePOI[]>([]);
  const [zbeParkings, setZbeParkings] = useState<RoutePOI[]>([]);
  const [nearbyRadar, setNearbyRadar] = useState<{ radar: RadarPoint; distance: number } | null>(null);
  const radarBannerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleRadarNearby = useCallback((radar: RadarPoint, distance: number) => {
    setNearbyRadar({ radar, distance });
    if (radarBannerTimerRef.current) clearTimeout(radarBannerTimerRef.current);
    radarBannerTimerRef.current = setTimeout(() => setNearbyRadar(null), 15000);
  }, []);

  const { nearbyZones, error: proximityError } = useZBEProximity({
    userTag: selectedTag,
    enabled: true,
  });

  const pathToGeometry = (path: { lat: number; lng: number }[]) => ({
    type: 'LineString' as const,
    coordinates: path.map((p) => [p.lng, p.lat]),
  });

  const extractRouteInfo = (route: google.maps.DirectionsRoute): RouteInfo => {
    // Use detailed path from steps instead of simplified overview_path
    const detailedPath: { lat: number; lng: number }[] = [];
    for (const leg of route.legs!) {
      for (const step of leg.steps!) {
        if (step.path) {
          for (const point of step.path) {
            detailedPath.push({ lat: point.lat(), lng: point.lng() });
          }
        }
      }
    }
    // Fallback to overview_path if steps don't have path data
    const path = detailedPath.length > 0
      ? detailedPath
      : route.overview_path!.map((p) => ({ lat: p.lat(), lng: p.lng() }));
    // Sum duration and distance across all legs (supports multi-waypoint routes)
    let totalDuration = 0;
    let totalDurationInTraffic = 0;
    let totalDistance = 0;
    let hasTraffic = false;
    for (const leg of route.legs!) {
      totalDuration += leg.duration?.value ?? 0;
      totalDistance += leg.distance?.value ?? 0;
      const trafficVal = (leg as any).duration_in_traffic?.value;
      if (trafficVal) {
        totalDurationInTraffic += trafficVal;
        hasTraffic = true;
      }
    }
    return {
      path,
      duration: totalDuration || null,
      durationInTraffic: hasTraffic ? totalDurationInTraffic : null,
      distance: totalDistance || null,
    };
  };

  const searchPOIsAlongRoute = useCallback(async (path: { lat: number; lng: number }[]) => {
    if (path.length < 2) return;
    try {
      const service = new google.maps.places.PlacesService(document.createElement('div'));
      const pois: RoutePOI[] = [];

      // Sample points along the route (every ~20% of the path)
      const sampleIndices = [
        Math.floor(path.length * 0.2),
        Math.floor(path.length * 0.4),
        Math.floor(path.length * 0.6),
        Math.floor(path.length * 0.8),
      ];

      const searchAtPoint = (point: { lat: number; lng: number }, type: string): Promise<RoutePOI[]> => {
        return new Promise((resolve) => {
          service.nearbySearch(
            {
              location: point,
              radius: 5000,
              type: type as string,
            },
            (results, status) => {
              if (status === google.maps.places.PlacesServiceStatus.OK && results) {
                const mapped = results.slice(0, 3).map((r) => ({
                  id: r.place_id || `${r.geometry!.location!.lat()}-${r.geometry!.location!.lng()}`,
                  name: r.name || 'Sin nombre',
                  position: {
                    lat: r.geometry!.location!.lat(),
                    lng: r.geometry!.location!.lng(),
                  },
                  type: type === 'gas_station' ? 'gas_station' as const : 'rest_stop' as const,
                }));
                resolve(mapped);
              } else {
                resolve([]);
              }
            }
          );
        });
      };

      for (const idx of sampleIndices) {
        const pt = path[idx];
        if (!pt) continue;
        const [gas, rest] = await Promise.all([
          searchAtPoint(pt, 'gas_station'),
          searchAtPoint(pt, 'car_repair'),
        ]);
        pois.push(...gas, ...rest);
      }

      // Deduplicate by id
      const uniquePOIs = Array.from(new Map(pois.map((p) => [p.id, p])).values());
      setRoutePOIs(uniquePOIs);
    } catch (err) {
      console.error('POI search error:', err);
    }
  }, []);

  const searchParkingsNearZBE = useCallback(async (points: { lat: number; lng: number }[]) => {
    if (points.length === 0) return;
    try {
      const service = new google.maps.places.PlacesService(document.createElement('div'));
      const allParkings: RoutePOI[] = [];

      const searchAtPoint = (point: { lat: number; lng: number }): Promise<RoutePOI[]> => {
        return new Promise((resolve) => {
          service.nearbySearch(
            { location: point, radius: 2000, type: 'parking' },
            (results, status) => {
              if (status === google.maps.places.PlacesServiceStatus.OK && results) {
                resolve(results.slice(0, 5).map((r) => ({
                  id: r.place_id || `parking-${r.geometry!.location!.lat()}-${r.geometry!.location!.lng()}`,
                  name: r.name || 'Parking',
                  position: {
                    lat: r.geometry!.location!.lat(),
                    lng: r.geometry!.location!.lng(),
                  },
                  type: 'parking' as const,
                  vicinity: r.vicinity || undefined,
                })));
              } else {
                resolve([]);
              }
            }
          );
        });
      };

      for (const pt of points) {
        const results = await searchAtPoint(pt);
        allParkings.push(...results);
      }

      const unique = Array.from(new Map(allParkings.map((p) => [p.id, p])).values());
      setZbeParkings(unique);
    } catch (err) {
      console.error('Parking search error:', err);
    }
  }, []);

  const calculateRoute = useCallback(async () => {
    if (!origin || !destination) return;

    setRouteStatus('loading');
    setRoutePath([]);
    setValidationResult(null);
    setAltRoute(null);
    setSafeOrigin(null);
    setSafeDest(null);

    try {
      const directionsService = new google.maps.DirectionsService();

      // Build user waypoints (intermediate stops)
      const userWaypoints: google.maps.DirectionsWaypoint[] = waypoints
        .filter((wp): wp is PlaceResult => wp !== null)
        .map((wp) => ({
          location: wp.coordinates,
          stopover: true,
        }));

      // Request with alternatives
      const result = await directionsService.route({
        origin: origin.coordinates,
        destination: destination.coordinates,
        travelMode: google.maps.TravelMode.DRIVING,
        provideRouteAlternatives: userWaypoints.length === 0, // Google doesn't support alternatives with waypoints
        waypoints: userWaypoints.length > 0 ? userWaypoints : undefined,
        optimizeWaypoints: userWaypoints.length > 1,
        drivingOptions: {
          departureTime: new Date(),
          trafficModel: google.maps.TrafficModel.BEST_GUESS,
        },
      });

      if (!result.routes || result.routes.length === 0) {
        setRouteStatus('no-route');
        toast.error('No se encontró una ruta entre los puntos seleccionados');
        return;
      }

      // Check all routes for a valid one
      const routeInfos = result.routes.map(extractRouteInfo);
      const validations = routeInfos.map((ri) =>
        validateRoute(pathToGeometry(ri.path), selectedTag)
      );

      // Find first valid route
      const validIndex = validations.findIndex((v) => v.valid);

      if (validIndex === 0) {
        // Main route is valid
        setRoutePath(routeInfos[0].path);
        setRouteDuration(routeInfos[0].durationInTraffic ?? routeInfos[0].duration);
        setRouteDistance(routeInfos[0].distance);
        setRouteStatus('valid');
        setValidationResult(validations[0]);
        toast.success('✅ Ruta legal para tu etiqueta');
        // Announce traffic status
        const trafficDur = routeInfos[0].durationInTraffic;
        const baseDur = routeInfos[0].duration;
        if (trafficDur && baseDur && trafficDur > baseDur * 1.2) {
          const delayMin = Math.round((trafficDur - baseDur) / 60);
          speak(`Ruta libre de restricciones. Atención: hay ${delayMin} minutos de retraso por tráfico.`);
        } else {
          speak('Ruta libre de restricciones para tu etiqueta.');
        }
        // Defer POI search so it doesn't block the route result UI
        setTimeout(() => searchPOIsAlongRoute(routeInfos[0].path), 500);
        addToHistory(
          { name: origin.name, coordinates: origin.coordinates },
          { name: destination.name, coordinates: destination.coordinates },
          selectedTag
        );
      } else if (validIndex > 0) {
        // Main route blocked, but an alternative is valid
        setRoutePath(routeInfos[0].path);
        setRouteDuration(routeInfos[0].durationInTraffic ?? routeInfos[0].duration);
        setRouteDistance(routeInfos[0].distance);
        setRouteStatus('invalid');
        setValidationResult(validations[0]);
        setAltRoute(routeInfos[validIndex]);
        toast.error('❌ Ruta principal bloqueada. ¡Alternativa legal disponible!');
        // Voice: warn about blocked zones
        const zoneNames = validations[0].blockedZones.map((z) => z.name).join(', ');
        speak(`Zona restringida para tu etiqueta: ${zoneNames}. Alternativa legal disponible.`);
      } else {
        // No Google alternative is valid
        const blockedZoneIds = validations[0].blockedZones.map((z) => z.id);

        setRoutePath(routeInfos[0].path);
        setRouteDuration(routeInfos[0].durationInTraffic ?? routeInfos[0].duration);
        setRouteDistance(routeInfos[0].distance);
        setRouteStatus('invalid');
        setValidationResult(validations[0]);

        // Check if origin/destination is inside a blocked ZBE and suggest safe points
        const originInZBE = getPointInZBE(origin.coordinates, selectedTag);
        const destInZBE = getPointInZBE(destination.coordinates, selectedTag);

        const safeOriginPoint = originInZBE ? getNearestPointOutsideZBE(origin.coordinates, selectedTag) : null;
        const safeDestPoint = destInZBE ? getNearestPointOutsideZBE(destination.coordinates, selectedTag) : null;

        if (safeOriginPoint) setSafeOrigin(safeOriginPoint);
        if (safeDestPoint) setSafeDest(safeDestPoint);

        // Search for parking near safe points outside the ZBE
        const parkingSearchPoints: { lat: number; lng: number }[] = [];
        if (safeOriginPoint) parkingSearchPoints.push(safeOriginPoint.coordinates);
        if (safeDestPoint) parkingSearchPoints.push(safeDestPoint.coordinates);
        if (parkingSearchPoints.length > 0) searchParkingsNearZBE(parkingSearchPoints);

        // Use safe points as actual origin/destination for the avoidance route
        const altOrigin = safeOriginPoint ? safeOriginPoint.coordinates : origin.coordinates;
        const altDest = safeDestPoint ? safeDestPoint.coordinates : destination.coordinates;

        // Zones handled by safe points — exclude from validation of alt route
        const safePointZoneIds: string[] = [];
        if (safeOriginPoint) safePointZoneIds.push(safeOriginPoint.zoneId);
        if (safeDestPoint) safePointZoneIds.push(safeDestPoint.zoneId);

        // Try avoidance waypoints with iterative validation (max 3 attempts)
        // Only generate avoidance waypoints for zones NOT handled by safe points
        const remainingBlockedIds = blockedZoneIds.filter(id => !safePointZoneIds.includes(id));
        let currentWaypoints = remainingBlockedIds.length > 0
          ? getAvoidanceWaypoints(remainingBlockedIds, altOrigin, altDest)
          : [];
        let foundValidAlt = false;

        for (let attempt = 0; attempt < 5; attempt++) {
          try {
            const avoidResult = await directionsService.route({
              origin: altOrigin,
              destination: altDest,
              travelMode: google.maps.TravelMode.DRIVING,
              waypoints: currentWaypoints.length > 0 ? currentWaypoints.map((wp) => ({
                location: wp,
                stopover: false,
              })) : undefined,
              provideRouteAlternatives: true,
            });

            if (!avoidResult.routes || avoidResult.routes.length === 0) break;

            // Check all returned routes for a fully valid one
            for (const route of avoidResult.routes) {
              const info = extractRouteInfo(route);
              const validation = validateRoute(pathToGeometry(info.path), selectedTag, safePointZoneIds);
              if (validation.valid) {
                setAltRoute(info);
                foundValidAlt = true;
                break;
              }
            }

            if (foundValidAlt) break;

            // Not valid yet — add waypoints for newly blocked zones and retry
            const retryInfo = extractRouteInfo(avoidResult.routes[0]);
            const retryValidation = validateRoute(pathToGeometry(retryInfo.path), selectedTag, safePointZoneIds);
            const newBlockedIds = retryValidation.blockedZones.map((z) => z.id);
            const extraWaypoints = getAvoidanceWaypoints(newBlockedIds, altOrigin, altDest);
            
            // Track count before merging to detect if new waypoints were added
            const prevCount = currentWaypoints.length;
            const existingKeys = new Set(currentWaypoints.map(w => `${w.lat.toFixed(6)},${w.lng.toFixed(6)}`));
            for (const wp of extraWaypoints) {
              const key = `${wp.lat.toFixed(6)},${wp.lng.toFixed(6)}`;
              if (!existingKeys.has(key)) {
                currentWaypoints.push(wp);
                existingKeys.add(key);
              }
            }
            // If no new waypoints were added, stop iterating
            if (currentWaypoints.length === prevCount) break;
          } catch (avoidErr) {
            console.error('Avoidance route error (attempt ' + attempt + '):', avoidErr);
            break;
          }
        }

        if (foundValidAlt) {
          if (originInZBE || destInZBE) {
            const parts: string[] = [];
            if (originInZBE) parts.push(`origen está dentro de ${originInZBE}`);
            if (destInZBE) parts.push(`destino está dentro de ${destInZBE}`);
            toast.error(`❌ Tu ${parts.join(' y tu ')}. Ruta alternativa legal disponible.`);
            speak('Zona restringida para tu etiqueta. Ruta alternativa completamente legal disponible.');
          } else {
            toast.error('❌ Ruta principal bloqueada. ¡Alternativa legal disponible!');
            const zoneNames = validations[0].blockedZones.map((z) => z.name).join(', ');
            speak(`Zona restringida para tu etiqueta: ${zoneNames}. Alternativa legal disponible.`);
          }
          return;
        }

        // Fallback: only offer a Google alt if it's fully valid
        if (result.routes.length > 1) {
          for (let i = 1; i < result.routes.length; i++) {
            if (validations[i].valid) {
              setAltRoute(routeInfos[i]);
              toast.error('❌ Ruta principal bloqueada. ¡Alternativa legal disponible!');
              return;
            }
          }
        }

        // Final fallback: if we have safe points, offer a direct route to/from them
        // This ensures the user ALWAYS gets an alternative when dest/origin is in a ZBE
        if (safeOriginPoint || safeDestPoint) {
          try {
            const fallbackResult = await directionsService.route({
              origin: altOrigin,
              destination: altDest,
              travelMode: google.maps.TravelMode.DRIVING,
            });
            if (fallbackResult.routes && fallbackResult.routes.length > 0) {
              const fallbackInfo = extractRouteInfo(fallbackResult.routes[0]);
              setAltRoute(fallbackInfo);
              const parts: string[] = [];
              if (destInZBE) parts.push(`destino está dentro de ${destInZBE}`);
              if (originInZBE) parts.push(`origen está dentro de ${originInZBE}`);
              toast.error(`❌ Tu ${parts.join(' y tu ')}. Ruta al punto más cercano fuera de la zona disponible.`);
              speak('Zona restringida. Ruta al punto más cercano fuera de la zona disponible.');
              return;
            }
          } catch (fallbackErr) {
            console.error('Fallback route error:', fallbackErr);
          }
        }

        const allZoneNames = validations[0].blockedZones.map((z) => z.name).join(', ');
        toast.error(
          `❌ Ruta bloqueada: ${allZoneNames}. No se encontró alternativa válida.`
        );
        speak(`Zona restringida para tu etiqueta: ${allZoneNames}. No se encontró alternativa válida.`);
      }
    } catch (err) {
      console.error('Error calculating route:', err);
      setRouteStatus('no-route');
      toast.error('Error al calcular la ruta.');
    }
  }, [origin, destination, selectedTag, waypoints]);

  const handleUseAltRoute = useCallback(async () => {
    if (!altRoute) return;
    skipRecalcRef.current = true;
    setRoutePath(altRoute.path);
    setRouteDuration(altRoute.durationInTraffic ?? altRoute.duration);
    setRouteDistance(altRoute.distance);
    setRouteStatus('valid');
    setValidationResult({ valid: true, blockedZones: [] });

    // Update origin/destination if safe points were used, reverse geocode for real address
    if (safeOrigin) {
      const place = await geocodeReverse(safeOrigin.coordinates);
      setOrigin({ coordinates: safeOrigin.coordinates, name: place });
      setSafeOrigin(null);
    }
    if (safeDest) {
      const place = await geocodeReverse(safeDest.coordinates);
      setDestination({ coordinates: safeDest.coordinates, name: place });
      setSafeDest(null);
    }

    setAltRoute(null);
    toast.success('✅ Ruta alternativa aplicada');
    searchPOIsAlongRoute(altRoute.path);
  }, [altRoute, searchPOIsAlongRoute, safeOrigin, safeDest]);

  const { history, addToHistory, clearHistory } = useRouteHistory();
  const { favorites, addFavorite, removeFavorite, isFavorite } = useFavorites();

  const handleShareRoute = useCallback(() => {
    shareRoute({
      originName: origin?.name,
      originLat: origin?.coordinates.lat,
      originLng: origin?.coordinates.lng,
      destName: destination?.name,
      destLat: destination?.coordinates.lat,
      destLng: destination?.coordinates.lng,
      tag: selectedTag,
      waypointNames: waypoints.filter(Boolean).map((wp) => wp!.name),
      waypointCoords: waypoints.filter(Boolean).map((wp) => wp!.coordinates),
    });
  }, [origin, destination, selectedTag, waypoints]);

  // Parse shared URL on mount
  useEffect(() => {
    const shared = parseShareURL();
    if (!shared) return;
    if (shared.tag) handleTagChange(shared.tag);
    if (shared.originName && shared.originCoords) {
      setOrigin({ name: shared.originName, coordinates: shared.originCoords });
    }
    if (shared.destName && shared.destCoords) {
      setDestination({ name: shared.destName, coordinates: shared.destCoords });
    }
    // Clean URL
    window.history.replaceState({}, '', window.location.pathname);
  }, []);

  const isMobile = useIsMobile();

  const handleArrival = useCallback(() => {
    toast.success('🏁 ¡Has llegado a tu destino!');
  }, []);

  const rerouteRef = useRef<(() => void) | null>(null);

  const nav = useNavigation({
    routePath,
    origin: origin?.coordinates ?? null,
    destination: destination?.coordinates ?? null,
    onArrival: handleArrival,
    onReroute: () => rerouteRef.current?.(),
    pois: routePOIs,
    onRadarNearby: handleRadarNearby,
  });

  rerouteRef.current = useCallback(() => {
    if (nav.userPosition && destination) {
      setOrigin({ coordinates: nav.userPosition, name: 'Tu ubicación actual' });
    }
  }, [nav.userPosition, destination]);

  useWakeLock(true);

  const handleStartNavigation = useCallback(() => {
    nav.startNavigation();
  }, [nav.startNavigation]);

  const resetRouteState = useCallback(() => {
    setRouteStatus('idle');
    setRoutePath([]);
    setRouteDuration(null);
    setRouteDistance(null);
    setValidationResult(null);
    setAltRoute(null);
    setSafeOrigin(null);
    setSafeDest(null);
    setRoutePOIs([]);
    setZbeParkings([]);
  }, []);

  const handleOriginClear = useCallback(() => {
    setOrigin(null);
    resetRouteState();
  }, [resetRouteState]);

  const handleDestClear = useCallback(() => {
    setDestination(null);
    resetRouteState();
  }, [resetRouteState]);

  // Waypoint handlers
  const handleAddWaypoint = useCallback(() => {
    setWaypoints((prev) => [...prev, null]);
  }, []);

  const handleRemoveWaypoint = useCallback((index: number) => {
    setWaypoints((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleWaypointSelect = useCallback((index: number, place: PlaceResult) => {
    setWaypoints((prev) => {
      const updated = [...prev];
      updated[index] = place;
      return updated;
    });
  }, []);

  const handleWaypointClear = useCallback((index: number) => {
    setWaypoints((prev) => {
      const updated = [...prev];
      updated[index] = null;
      return updated;
    });
  }, []);

  // Reverse geocode coordinates to street address
  const geocodeReverse = useCallback(async (coords: { lat: number; lng: number }): Promise<string> => {
    try {
      const geocoder = new google.maps.Geocoder();
      const res = await geocoder.geocode({ location: coords });
      if (res.results && res.results.length > 0) {
        return res.results[0].formatted_address;
      }
    } catch (err) {
      console.error('Reverse geocode error:', err);
    }
    return `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`;
  }, []);

  // Voice command: geocode spoken address and set origin/destination
  const geocodeAddress = useCallback(async (address: string): Promise<PlaceResult | null> => {
    try {
      const geocoder = new google.maps.Geocoder();
      const res = await geocoder.geocode({ address, region: 'es' });
      if (res.results && res.results.length > 0) {
        const loc = res.results[0].geometry.location;
        return { coordinates: { lat: loc.lat(), lng: loc.lng() }, name: res.results[0].formatted_address };
      }
    } catch (err) {
      console.error('Geocode error:', err);
    }
    return null;
  }, []);

  

  const voiceCommand = useVoiceInput({
    onResult: async (transcript) => {
      toast.info(`🎤 "${transcript}"`);
      const parsed = parseVoiceCommand(transcript);
      if (!parsed) {
        toast.error('No se entendió el comando. Prueba: "quiero ir a [dirección]"');
        return;
      }

      if (parsed.origin) {
        const originPlace = await geocodeAddress(parsed.origin);
        if (originPlace) setOrigin(originPlace);
        else toast.error(`No se encontró: "${parsed.origin}"`);
      }

      if (parsed.destination) {
        const destPlace = await geocodeAddress(parsed.destination);
        if (destPlace) {
          setDestination(destPlace);
          setDestination(destPlace);
        } else {
          toast.error(`No se encontró: "${parsed.destination}"`);
        }
      }
    },
    onError: (err) => toast.error(err),
  });

  // Auto-calculate when destination is set (or voice command)
  useEffect(() => {
    if (origin && destination) {
      if (skipRecalcRef.current) {
        skipRecalcRef.current = false;
        return;
      }
      calculateRoute();
    }
  }, [origin, destination, calculateRoute]);

  // Re-validate route when tag changes and a route exists
  useEffect(() => {
    if (origin && destination && routePath.length > 0) {
      calculateRoute();
    }
  }, [selectedTag]);

  const handleVoiceCommand = useCallback(() => {
    if (voiceCommand.isListening) {
      voiceCommand.stopListening();
    } else {
      voiceCommand.startListening();
      toast.info('🎤 Escuchando... Di algo como "quiero ir a la calle Lima 13 en Granada"');
    }
  }, [voiceCommand]);

  const panelProps = {
    selectedTag,
    onTagChange: handleTagChange,
    onOriginSelect: setOrigin,
    onOriginClear: handleOriginClear,
    onDestinationSelect: setDestination,
    onDestinationClear: handleDestClear,
    routeStatus,
    validationResult,
    routeDuration,
    routeDistance,
    altRoute,
    onUseAltRoute: handleUseAltRoute,
    safeOrigin,
    safeDest,
    nearbyZones,
    proximityError,
    origin: origin?.coordinates ?? null,
    destination: destination?.coordinates ?? null,
    onStartNavigation: handleStartNavigation,
    isNavigating: nav.isNavigating,
    onVoiceCommand: handleVoiceCommand,
    isVoiceListening: voiceCommand.isListening,
    originName: origin?.name,
    destName: destination?.name,
    routePath,
    history,
    favorites,
    onAddFavorite: addFavorite,
    onRemoveFavorite: removeFavorite,
    isFavorite,
    onClearHistory: clearHistory,
    waypoints,
    onAddWaypoint: handleAddWaypoint,
    onRemoveWaypoint: handleRemoveWaypoint,
    onWaypointSelect: handleWaypointSelect,
    onWaypointClear: handleWaypointClear,
    waypointNames: waypoints.map((wp) => wp?.name),
    zbeParkings,
    onShareRoute: handleShareRoute,
  };

  if (!mapsLoaded) {
    return (
      <div className="flex items-center justify-center w-screen h-screen bg-background">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <span className="text-sm font-medium">Cargando mapa...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      {/* Offline banner */}
      {!isOnline && (
        <div className="absolute top-0 left-0 right-0 z-50 bg-destructive/90 text-destructive-foreground text-center py-2 px-4 text-sm font-medium flex items-center justify-center gap-2 shadow-lg">
          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636a9 9 0 11-12.728 0M12 9v4m0 4h.01" />
          </svg>
          Sin conexión — Usando datos en caché
        </div>
      )}
        <MapView
          origin={origin?.coordinates ?? null}
          destination={destination?.coordinates ?? null}
          routePath={routePath}
          routeStatus={routeStatus}
          altRoutePath={altRoute?.path ?? null}
          isNavigating={nav.isNavigating}
          userPosition={nav.userPosition}
          heading={nav.heading}
          pois={[...routePOIs, ...zbeParkings]}
        />
      {nav.isNavigating && (
        <>
          <NavigationOverlay
            distanceRemaining={nav.distanceRemaining}
            timeRemaining={nav.timeRemaining}
            speed={nav.speed}
            progressPercent={nav.progressPercent}
            error={nav.error}
            onStop={nav.stopNavigation}
            currentStep={nav.steps[nav.currentStepIndex] ?? null}
            nextStep={nav.steps[nav.currentStepIndex + 1] ?? null}
            distanceToNextStep={nav.distanceToNextStep}
            onVoiceCommand={handleVoiceCommand}
            isVoiceListening={voiceCommand.isListening}
            onDestinationSelect={setDestination}
            onDestinationClear={handleDestClear}
            destName={destination?.name}
            routePath={routePath}
            routeStatus={routeStatus}
            nearbyRadar={nearbyRadar}
          />
        </>
      )}
      {!nav.isNavigating && (
        isMobile ? <MobilePanel {...panelProps} /> : <Sidebar {...panelProps} />
      )}
    </div>
  );
};


export default Index;
