import { Fuel, UtensilsCrossed, Loader2, MapPin, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useCallback } from 'react';
import { speak } from '@/lib/speak';

interface NearestPOI {
  name: string;
  position: { lat: number; lng: number };
  distance: number; // meters
}

interface RouteServicesProps {
  routePath: { lat: number; lng: number }[];
  isVisible: boolean;
  onAddToRoute?: (place: { coordinates: { lat: number; lng: number }; name: string }) => void;
}

const RouteServices = ({ routePath, isVisible, onAddToRoute }: RouteServicesProps) => {
  const [loadingType, setLoadingType] = useState<string | null>(null);
  const [result, setResult] = useState<{ type: string; poi: NearestPOI } | null>(null);

  const formatDist = (meters: number) =>
    meters >= 1000 ? `${(meters / 1000).toFixed(1)} kilómetros` : `${meters} metros`;

  const findNearest = useCallback(async (type: 'gas_station' | 'restaurant') => {
    if (routePath.length < 2) return;
    setLoadingType(type);
    setResult(null);

    try {
      const service = new google.maps.places.PlacesService(document.createElement('div'));

      const sampleCount = Math.min(5, Math.floor(routePath.length / 5));
      const indices = Array.from({ length: sampleCount }, (_, i) =>
        Math.floor((routePath.length * (i + 1)) / (sampleCount + 1))
      );

      let best: NearestPOI | null = null;

      for (const idx of indices) {
        const pt = routePath[idx];
        if (!pt) continue;

        const results = await new Promise<google.maps.places.PlaceResult[]>((resolve) => {
          service.nearbySearch(
            { location: pt, radius: 5000, type },
            (res, status) => {
              if (status === google.maps.places.PlacesServiceStatus.OK && res) resolve(res);
              else resolve([]);
            }
          );
        });

        for (const r of results) {
          if (!r.geometry?.location) continue;
          const pos = { lat: r.geometry.location.lat(), lng: r.geometry.location.lng() };
          const dist = google.maps.geometry?.spherical?.computeDistanceBetween(
            new google.maps.LatLng(pt.lat, pt.lng),
            new google.maps.LatLng(pos.lat, pos.lng)
          ) ?? 99999;

          if (!best || dist < best.distance) {
            best = { name: r.name || 'Sin nombre', position: pos, distance: Math.round(dist) };
          }
        }
      }

      if (best) {
        const label = type === 'gas_station' ? 'gasolinera' : 'restaurante';
        setResult({ type: label, poi: best });

        // Announce by voice
        const distText = formatDist(best.distance);
        speak(
          `La ${label} más cercana en tu ruta es ${best.name}, a ${distText}. ¿Quieres añadirla como destino?`
        );
      } else {
        const label = type === 'gas_station' ? 'gasolineras' : 'restaurantes';
        speak(`No se encontraron ${label} cerca de tu ruta.`);
      }
    } catch (err) {
      console.error('POI search error:', err);
      speak('Error al buscar servicios en la ruta.');
    } finally {
      setLoadingType(null);
    }
  }, [routePath]);

  const handleAddToRoute = useCallback(() => {
    if (!result || !onAddToRoute) return;
    onAddToRoute({
      coordinates: result.poi.position,
      name: result.poi.name,
    });
    speak(`${result.poi.name} añadido como destino. Recalculando ruta.`);
    setResult(null);
  }, [result, onAddToRoute]);

  if (!isVisible) return null;

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">En ruta</p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 rounded-lg text-xs h-9 gap-1.5"
          onClick={() => findNearest('gas_station')}
          disabled={loadingType !== null}
        >
          {loadingType === 'gas_station' ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Fuel className="h-3.5 w-3.5" />
          )}
          Gasolinera
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 rounded-lg text-xs h-9 gap-1.5"
          onClick={() => findNearest('restaurant')}
          disabled={loadingType !== null}
        >
          {loadingType === 'restaurant' ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <UtensilsCrossed className="h-3.5 w-3.5" />
          )}
          Restaurante
        </Button>
      </div>

      {result && (
        <div className="rounded-lg bg-muted/50 border border-border/60 p-3 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
            {result.type === 'gasolinera' ? <Fuel className="h-3.5 w-3.5 text-primary" /> : <UtensilsCrossed className="h-3.5 w-3.5 text-primary" />}
            {result.poi.name}
          </div>
          <p className="text-[11px] text-muted-foreground">
            A {result.poi.distance >= 1000 ? `${(result.poi.distance / 1000).toFixed(1)} km` : `${result.poi.distance} m`} de la ruta
          </p>
          {onAddToRoute && (
            <Button
              variant="default"
              size="sm"
              className="w-full rounded-lg text-xs h-8 gap-1.5"
              onClick={handleAddToRoute}
            >
              <Plus className="h-3.5 w-3.5" />
              Añadir a la ruta
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default RouteServices;
