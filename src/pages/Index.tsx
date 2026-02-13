import { useState, useCallback, useEffect } from 'react';
import { useZBEProximity } from '@/hooks/use-zbe-proximity';
import { useNavigation } from '@/hooks/use-navigation';
import { LoadScript } from '@react-google-maps/api';
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

type RouteStatus = 'idle' | 'loading' | 'valid' | 'invalid' | 'no-route';

const LIBRARIES: ('places')[] = ['places'];

interface RouteInfo {
  path: { lat: number; lng: number }[];
  duration: number | null;
  distance: number | null;
}

const Index = () => {
  const [selectedTag, setSelectedTag] = useState('C');
  const [origin, setOrigin] = useState<PlaceResult | null>(null);
  const [destination, setDestination] = useState<PlaceResult | null>(null);
  const [routePath, setRoutePath] = useState<{ lat: number; lng: number }[]>([]);
  const [routeStatus, setRouteStatus] = useState<RouteStatus>('idle');
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [routeDuration, setRouteDuration] = useState<number | null>(null);
  const [routeDistance, setRouteDistance] = useState<number | null>(null);

  const [altRoute, setAltRoute] = useState<RouteInfo | null>(null);
  const [safeOrigin, setSafeOrigin] = useState<SafePoint | null>(null);
  const [safeDest, setSafeDest] = useState<SafePoint | null>(null);
  const [routePOIs, setRoutePOIs] = useState<RoutePOI[]>([]);

  const [proximityEnabled, setProximityEnabled] = useState(false);
  const { nearbyZones, error: proximityError } = useZBEProximity({
    userTag: selectedTag,
    enabled: proximityEnabled,
  });

  const pathToGeometry = (path: { lat: number; lng: number }[]) => ({
    type: 'LineString' as const,
    coordinates: path.map((p) => [p.lng, p.lat]),
  });

  const extractRouteInfo = (route: google.maps.DirectionsRoute): RouteInfo => {
    const path = route.overview_path!.map((p) => ({ lat: p.lat(), lng: p.lng() }));
    const leg = route.legs![0];
    return {
      path,
      duration: leg.duration?.value ?? null,
      distance: leg.distance?.value ?? null,
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

      // Request with alternatives
      const result = await directionsService.route({
        origin: origin.coordinates,
        destination: destination.coordinates,
        travelMode: google.maps.TravelMode.DRIVING,
        provideRouteAlternatives: true,
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
        setRouteDuration(routeInfos[0].duration);
        setRouteDistance(routeInfos[0].distance);
        setRouteStatus('valid');
        setValidationResult(validations[0]);
        toast.success('✅ Ruta legal para tu etiqueta');
        searchPOIsAlongRoute(routeInfos[0].path);
      } else if (validIndex > 0) {
        // Main route blocked, but an alternative is valid
        setRoutePath(routeInfos[0].path);
        setRouteDuration(routeInfos[0].duration);
        setRouteDistance(routeInfos[0].distance);
        setRouteStatus('invalid');
        setValidationResult(validations[0]);
        setAltRoute(routeInfos[validIndex]);
        toast.error('❌ Ruta principal bloqueada. ¡Alternativa legal disponible!');
      } else {
        // No Google alternative is valid
        const blockedZoneIds = validations[0].blockedZones.map((z) => z.id);

        setRoutePath(routeInfos[0].path);
        setRouteDuration(routeInfos[0].duration);
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

        // Use safe points as actual origin/destination for the avoidance route
        const altOrigin = safeOriginPoint ? safeOriginPoint.coordinates : origin.coordinates;
        const altDest = safeDestPoint ? safeDestPoint.coordinates : destination.coordinates;

        // Try avoidance waypoints
        const waypoints = getAvoidanceWaypoints(blockedZoneIds, altOrigin, altDest);

        try {
          const avoidResult = await directionsService.route({
            origin: altOrigin,
            destination: altDest,
            travelMode: google.maps.TravelMode.DRIVING,
            waypoints: waypoints.length > 0 ? waypoints.map((wp) => ({
              location: wp,
              stopover: false,
            })) : undefined,
          });

          if (avoidResult.routes && avoidResult.routes.length > 0) {
            const avoidInfo = extractRouteInfo(avoidResult.routes[0]);
            setAltRoute(avoidInfo);

            if (originInZBE || destInZBE) {
              const parts: string[] = [];
              if (originInZBE) parts.push(`origen está dentro de ${originInZBE}`);
              if (destInZBE) parts.push(`destino está dentro de ${destInZBE}`);
              toast.error(
                `❌ Tu ${parts.join(' y tu ')}. Ruta alternativa hasta punto seguro disponible.`
              );
            } else {
              toast.error('❌ Ruta principal bloqueada. ¡Alternativa disponible!');
            }
            return;
          }
        } catch (avoidErr) {
          console.error('Avoidance route error:', avoidErr);
        }

        // Fallback: offer any Google alt route as "best effort" even if not fully valid
        if (result.routes.length > 1) {
          // Pick the route with fewest blocked zones
          let bestIdx = 1;
          let bestBlockedCount = validations[1].blockedZones.length;
          for (let i = 2; i < result.routes.length; i++) {
            if (validations[i].blockedZones.length < bestBlockedCount) {
              bestIdx = i;
              bestBlockedCount = validations[i].blockedZones.length;
            }
          }
          if (bestBlockedCount < validations[0].blockedZones.length) {
            setAltRoute(routeInfos[bestIdx]);
            toast.error('❌ Ruta bloqueada. Alternativa con menor exposición disponible.');
            return;
          }
        }

        toast.error(
          `❌ Ruta bloqueada: ${validations[0].blockedZones.map((z) => z.name).join(', ')}. No se encontró alternativa válida.`
        );
      }
    } catch (err) {
      console.error('Error calculating route:', err);
      setRouteStatus('no-route');
      toast.error('Error al calcular la ruta.');
    }
  }, [origin, destination, selectedTag]);

  const handleUseAltRoute = useCallback(() => {
    if (!altRoute) return;
    setRoutePath(altRoute.path);
    setRouteDuration(altRoute.duration);
    setRouteDistance(altRoute.distance);
    setRouteStatus('valid');
    setValidationResult({ valid: true, blockedZones: [] });
    setAltRoute(null);
    toast.success('✅ Ruta alternativa aplicada');
    searchPOIsAlongRoute(altRoute.path);
  }, [altRoute, searchPOIsAlongRoute]);

  const canCalculate = !!origin && !!destination && !!selectedTag;
  const isMobile = useIsMobile();

  const handleArrival = useCallback(() => {
    toast.success('🏁 ¡Has llegado a tu destino!');
    nav.stopNavigation();
  }, []);

  const nav = useNavigation({
    routePath,
    origin: origin?.coordinates ?? null,
    destination: destination?.coordinates ?? null,
    onArrival: handleArrival,
    pois: routePOIs,
  });

  const handleStartNavigation = useCallback(() => {
    nav.startNavigation();
  }, [nav.startNavigation]);

  const handleOriginClear = useCallback(() => setOrigin(null), []);
  const handleDestClear = useCallback(() => setDestination(null), []);

  const panelProps = {
    selectedTag,
    onTagChange: setSelectedTag,
    onOriginSelect: setOrigin,
    onOriginClear: handleOriginClear,
    onDestinationSelect: setDestination,
    onDestinationClear: handleDestClear,
    onCalculateRoute: calculateRoute,
    routeStatus,
    validationResult,
    routeDuration,
    routeDistance,
    canCalculate,
    altRoute,
    onUseAltRoute: handleUseAltRoute,
    safeOrigin,
    safeDest,
    proximityEnabled,
    onToggleProximity: () => setProximityEnabled((p) => !p),
    nearbyZones,
    proximityError,
    origin: origin?.coordinates ?? null,
    destination: destination?.coordinates ?? null,
    onStartNavigation: handleStartNavigation,
    isNavigating: nav.isNavigating,
  };

  return (
    <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY} libraries={LIBRARIES} language="es">
      <div className="relative w-screen h-screen overflow-hidden">
          <MapView
            origin={origin?.coordinates ?? null}
            destination={destination?.coordinates ?? null}
            routePath={routePath}
            routeStatus={routeStatus}
            altRoutePath={altRoute?.path ?? null}
            isNavigating={nav.isNavigating}
            userPosition={nav.userPosition}
            heading={nav.heading}
            pois={routePOIs}
          />
        {nav.isNavigating && (
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
          />
        )}
        {!nav.isNavigating && (
          isMobile ? <MobilePanel {...panelProps} /> : <Sidebar {...panelProps} />
        )}
      </div>
    </LoadScript>
  );
};

export default Index;
