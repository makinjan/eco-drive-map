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

const Index = () => {
  const [selectedTag, setSelectedTag] = useState('C');
  const [origin, setOrigin] = useState<PlaceResult | null>(null);
  const [destination, setDestination] = useState<PlaceResult | null>(null);
  const [routePath, setRoutePath] = useState<{ lat: number; lng: number }[]>([]);
  const [routeStatus, setRouteStatus] = useState<RouteStatus>('idle');
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [routeDuration, setRouteDuration] = useState<number | null>(null);
  const [routeDistance, setRouteDistance] = useState<number | null>(null);

  const calculateRoute = useCallback(async () => {
    if (!origin || !destination) return;

    setRouteStatus('loading');
    setRoutePath([]);
    setValidationResult(null);

    try {
      const directionsService = new google.maps.DirectionsService();
      const result = await directionsService.route({
        origin: origin.coordinates,
        destination: destination.coordinates,
        travelMode: google.maps.TravelMode.DRIVING,
      });

      if (!result.routes || result.routes.length === 0) {
        setRouteStatus('no-route');
        toast.error('No se encontró una ruta entre los puntos seleccionados');
        return;
      }

      const route = result.routes[0];
      const leg = route.legs![0];

      // Decode path to LatLng array
      const path = route.overview_path!.map((p) => ({
        lat: p.lat(),
        lng: p.lng(),
      }));
      setRoutePath(path);
      setRouteDuration(leg.duration?.value ?? null);
      setRouteDistance(leg.distance?.value ?? null);

      // Convert to GeoJSON LineString for validation
      const routeGeometry = {
        type: 'LineString' as const,
        coordinates: path.map((p) => [p.lng, p.lat]),
      };

      const validation = validateRoute(routeGeometry, selectedTag);
      setValidationResult(validation);

      if (validation.valid) {
        setRouteStatus('valid');
        toast.success('✅ Ruta legal para tu etiqueta');
      } else {
        setRouteStatus('invalid');
        toast.error(
          `❌ Ruta bloqueada: ${validation.blockedZones.map((z) => z.name).join(', ')}`
        );
      }
    } catch (err) {
      console.error('Error calculating route:', err);
      setRouteStatus('no-route');
      toast.error('Error al calcular la ruta.');
    }
  }, [origin, destination, selectedTag]);

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
  };

  return (
    <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY} libraries={LIBRARIES} language="es">
      <div className="relative w-screen h-screen overflow-hidden">
        <MapView
          origin={origin?.coordinates ?? null}
          destination={destination?.coordinates ?? null}
          routePath={routePath}
          routeStatus={routeStatus}
        />
        {isMobile ? <MobilePanel {...panelProps} /> : <Sidebar {...panelProps} />}
      </div>
    </LoadScript>
  );
};

export default Index;
