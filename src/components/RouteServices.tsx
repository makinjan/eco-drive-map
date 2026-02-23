import { Fuel, UtensilsCrossed, Loader2, Plus, ParkingCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useCallback } from 'react';

interface NearestPOI {
  name: string;
  position: { lat: number; lng: number };
  distance: number;
}

interface RouteServicesProps {
  routePath: { lat: number; lng: number }[];
  isVisible: boolean;
  onAddToRoute?: (place: { coordinates: { lat: number; lng: number }; name: string }) => void;
  destination?: { lat: number; lng: number } | null;
}

const RouteServices = ({ routePath, isVisible, onAddToRoute, destination }: RouteServicesProps) => {
  const [loadingType, setLoadingType] = useState<string | null>(null);
  const [result, setResult] = useState<{ type: string; poi: NearestPOI } | null>(null);

  const formatDist = (meters: number) =>
    meters >= 1000 ? `${(meters / 1000).toFixed(1)} kilómetros` : `${meters} metros`;


  const findNearest = useCallback(async (type: 'gas_station' | 'restaurant' | 'parking') => {
    if (routePath.length < 2) return;
    setLoadingType(type);
    setResult(null);

    try {
      // For parking, search near destination; otherwise near user
      let searchCenter: { lat: number; lng: number };
      if (type === 'parking' && destination) {
        searchCenter = destination;
      } else {
        searchCenter = await new Promise<{ lat: number; lng: number }>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            (err) => reject(err),
            { enableHighAccuracy: true, timeout: 10000 }
          );
        });
      }

      const service = new google.maps.places.PlacesService(document.createElement('div'));

      const searchType = type === 'parking' ? 'parking' : type;
      const keyword = type === 'gas_station' ? 'gasolinera' : type === 'restaurant' ? 'restaurante' : 'parking aparcamiento';

      // Try with type first, then fallback to keyword search
      const searchWithType = () => new Promise<google.maps.places.PlaceResult[]>((resolve) => {
        service.nearbySearch(
          { location: searchCenter, radius: 20000, type: searchType },
          (res, status) => {
            console.log('Places search (type) status:', status, 'results:', res?.length ?? 0);
            if (status === google.maps.places.PlacesServiceStatus.OK && res && res.length > 0) resolve(res);
            else resolve([]);
          }
        );
      });

      const searchWithKeyword = () => new Promise<google.maps.places.PlaceResult[]>((resolve) => {
        service.nearbySearch(
          { location: searchCenter, radius: 20000, keyword },
          (res, status) => {
            console.log('Places search (keyword) status:', status, 'results:', res?.length ?? 0);
            if (status === google.maps.places.PlacesServiceStatus.OK && res) resolve(res);
            else resolve([]);
          }
        );
      });

      let results = await searchWithType();
      if (results.length === 0) {
        console.log('No results with type, trying keyword:', keyword);
        results = await searchWithKeyword();
      }

      let best: NearestPOI | null = null;

      for (const r of results) {
        if (!r.geometry?.location) continue;
        const pos = { lat: r.geometry.location.lat(), lng: r.geometry.location.lng() };
        const dist = google.maps.geometry?.spherical?.computeDistanceBetween(
          new google.maps.LatLng(searchCenter.lat, searchCenter.lng),
          new google.maps.LatLng(pos.lat, pos.lng)
        ) ?? 99999;

        if (!best || dist < best.distance) {
          best = { name: r.name || 'Sin nombre', position: pos, distance: Math.round(dist) };
        }
      }

      const label = type === 'gas_station' ? 'gasolinera' : type === 'restaurant' ? 'restaurante' : 'parking';

      if (best) {
        setResult({ type: label, poi: best });
      } else {
        const labelPlural = type === 'gas_station' ? 'gasolineras' : type === 'restaurant' ? 'restaurantes' : 'parkings';
        
      }
    } catch (err) {
      console.error('POI search error:', err);
      
    } finally {
      setLoadingType(null);
    }
  }, [routePath, destination]);

  const handleAddToRoute = useCallback(() => {
    if (!result || !onAddToRoute) return;
    onAddToRoute({
      coordinates: result.poi.position,
      name: result.poi.name,
    });
    setResult(null);
  }, [result, onAddToRoute]);

  if (!isVisible) return null;

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">En ruta</p>
      <div className="flex gap-2 flex-wrap">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 rounded-lg text-xs h-9 gap-1.5 min-w-0"
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
          className="flex-1 rounded-lg text-xs h-9 gap-1.5 min-w-0"
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
        <Button
          variant="outline"
          size="sm"
          className="flex-1 rounded-lg text-xs h-9 gap-1.5 min-w-0"
          onClick={() => findNearest('parking')}
          disabled={loadingType !== null || !destination}
        >
          {loadingType === 'parking' ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <ParkingCircle className="h-3.5 w-3.5" />
          )}
          Parking
        </Button>
      </div>

      {result && (
        <div className="rounded-lg bg-muted/50 border border-border/60 p-3 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
            {result.type === 'gasolinera' ? <Fuel className="h-3.5 w-3.5 text-primary" /> : result.type === 'parking' ? <ParkingCircle className="h-3.5 w-3.5 text-primary" /> : <UtensilsCrossed className="h-3.5 w-3.5 text-primary" />}
            {result.poi.name}
          </div>
          <p className="text-[11px] text-muted-foreground">
            A {result.poi.distance >= 1000 ? `${(result.poi.distance / 1000).toFixed(1)} km` : `${result.poi.distance} m`} {result.type === 'parking' ? 'de tu destino' : 'de tu posición'}
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
