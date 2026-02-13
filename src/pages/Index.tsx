import { useState, useCallback } from 'react';
import MapView from '@/components/MapView';
import Sidebar from '@/components/Sidebar';
import { MAPBOX_TOKEN } from '@/lib/mapbox-config';
import { validateRoute, type ValidationResult } from '@/lib/route-validator';
import type { PlaceResult } from '@/components/SearchInput';
import type { Feature, LineString } from 'geojson';
import { toast } from 'sonner';

type RouteStatus = 'idle' | 'loading' | 'valid' | 'invalid' | 'no-route';

const Index = () => {
  const [selectedTag, setSelectedTag] = useState('C');
  const [origin, setOrigin] = useState<PlaceResult | null>(null);
  const [destination, setDestination] = useState<PlaceResult | null>(null);
  const [route, setRoute] = useState<Feature<LineString> | null>(null);
  const [routeStatus, setRouteStatus] = useState<RouteStatus>('idle');
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [routeDuration, setRouteDuration] = useState<number | null>(null);
  const [routeDistance, setRouteDistance] = useState<number | null>(null);

  const calculateRoute = useCallback(async () => {
    if (!origin || !destination) return;

    setRouteStatus('loading');
    setRoute(null);
    setValidationResult(null);

    try {
      const [oLng, oLat] = origin.coordinates;
      const [dLng, dLat] = destination.coordinates;

      const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${oLng},${oLat};${dLng},${dLat}?geometries=geojson&overview=full&access_token=${MAPBOX_TOKEN}`;
      const res = await fetch(url);
      const data = await res.json();

      if (!data.routes || data.routes.length === 0) {
        setRouteStatus('no-route');
        toast.error('No se encontró una ruta entre los puntos seleccionados');
        return;
      }

      const routeData = data.routes[0];
      const routeFeature: Feature<LineString> = {
        type: 'Feature',
        properties: {},
        geometry: routeData.geometry,
      };

      setRoute(routeFeature);
      setRouteDuration(routeData.duration);
      setRouteDistance(routeData.distance);

      // Validate against ZBE zones
      const validation = validateRoute(routeData.geometry, selectedTag);
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
      toast.error('Error al calcular la ruta. Verifica tu token de Mapbox.');
    }
  }, [origin, destination, selectedTag]);

  const canCalculate = !!origin && !!destination && !!selectedTag;

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      <MapView
        origin={origin?.coordinates ?? null}
        destination={destination?.coordinates ?? null}
        route={route}
        routeStatus={routeStatus}
      />
      <Sidebar
        selectedTag={selectedTag}
        onTagChange={setSelectedTag}
        onOriginSelect={setOrigin}
        onDestinationSelect={setDestination}
        onCalculateRoute={calculateRoute}
        routeStatus={routeStatus}
        validationResult={validationResult}
        routeDuration={routeDuration}
        routeDistance={routeDistance}
        canCalculate={canCalculate}
      />
    </div>
  );
};

export default Index;
