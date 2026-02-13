import { useState, useCallback } from 'react';
import { LoadScript } from '@react-google-maps/api';
import MapView from '@/components/MapView';
import Sidebar from '@/components/Sidebar';
import MobilePanel from '@/components/MobilePanel';
import { useIsMobile } from '@/hooks/use-mobile';
import { GOOGLE_MAPS_API_KEY } from '@/lib/google-maps-config';
import { validateRoute } from '@/lib/route-validator';
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

  // Alternative route state
  const [altRoute, setAltRoute] = useState<RouteInfo | null>(null);
  const [showAltRoute, setShowAltRoute] = useState(false);

  const pathToGeometry = (path: { lat: number; lng: number }[]) => ({
    type: 'LineString' as const,
    coordinates: path.map((p) => [p.lng, p.lat]),
  });

  const calculateRoute = useCallback(async () => {
    if (!origin || !destination) return;

    setRouteStatus('loading');
    setRoutePath([]);
    setValidationResult(null);
    setAltRoute(null);
    setShowAltRoute(false);

    try {
      const directionsService = new google.maps.DirectionsService();
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

      // Process main route
      const mainRoute = result.routes[0];
      const mainLeg = mainRoute.legs![0];
      const mainPath = mainRoute.overview_path!.map((p) => ({
        lat: p.lat(),
        lng: p.lng(),
      }));

      setRoutePath(mainPath);
      setRouteDuration(mainLeg.duration?.value ?? null);
      setRouteDistance(mainLeg.distance?.value ?? null);

      const mainValidation = validateRoute(pathToGeometry(mainPath), selectedTag);
      setValidationResult(mainValidation);

      if (mainValidation.valid) {
        setRouteStatus('valid');
        toast.success('✅ Ruta legal para tu etiqueta');
      } else {
        setRouteStatus('invalid');

        // Search for a valid alternative among the other routes
        let foundAlt = false;
        for (let i = 1; i < result.routes.length; i++) {
          const altPath = result.routes[i].overview_path!.map((p) => ({
            lat: p.lat(),
            lng: p.lng(),
          }));
          const altValidation = validateRoute(pathToGeometry(altPath), selectedTag);

          if (altValidation.valid) {
            const altLeg = result.routes[i].legs![0];
            setAltRoute({
              path: altPath,
              duration: altLeg.duration?.value ?? null,
              distance: altLeg.distance?.value ?? null,
            });
            foundAlt = true;
            toast.error(
              `❌ Ruta principal bloqueada. ¡Alternativa legal disponible!`
            );
            break;
          }
        }

        if (!foundAlt) {
          toast.error(
            `❌ Ruta bloqueada: ${mainValidation.blockedZones.map((z) => z.name).join(', ')}. No se encontró alternativa válida.`
          );
        }
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
    setShowAltRoute(true);
    setAltRoute(null);
    toast.success('✅ Ruta alternativa aplicada');
  }, [altRoute]);

  const canCalculate = !!origin && !!destination && !!selectedTag;
  const isMobile = useIsMobile();

  const panelProps = {
    selectedTag,
    onTagChange: setSelectedTag,
    onOriginSelect: setOrigin,
    onDestinationSelect: setDestination,
    onCalculateRoute: calculateRoute,
    routeStatus,
    validationResult,
    routeDuration,
    routeDistance,
    canCalculate,
    altRoute,
    onUseAltRoute: handleUseAltRoute,
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
        />
        {isMobile ? <MobilePanel {...panelProps} /> : <Sidebar {...panelProps} />}
      </div>
    </LoadScript>
  );
};

export default Index;
