import { Fuel, UtensilsCrossed, Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useCallback, useRef } from 'react';
import { speak } from '@/lib/speak';

interface NearestPOI {
  name: string;
  position: { lat: number; lng: number };
  distance: number;
}

interface RouteServicesProps {
  routePath: { lat: number; lng: number }[];
  isVisible: boolean;
  onAddToRoute?: (place: { coordinates: { lat: number; lng: number }; name: string }) => void;
}

const RouteServices = ({ routePath, isVisible, onAddToRoute }: RouteServicesProps) => {
  const [loadingType, setLoadingType] = useState<string | null>(null);
  const [result, setResult] = useState<{ type: string; poi: NearestPOI } | null>(null);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);
  const recognitionRef = useRef<any>(null);

  const formatDist = (meters: number) =>
    meters >= 1000 ? `${(meters / 1000).toFixed(1)} kilómetros` : `${meters} metros`;

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
    setAwaitingConfirmation(false);
  }, []);

  const listenForConfirmation = useCallback((poi: NearestPOI, label: string) => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      // No speech recognition available, just show the button
      return;
    }

    setAwaitingConfirmation(true);

    const recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 3;
    recognitionRef.current = recognition;

    recognition.onresult = (event: any) => {
      const results = event.results[0];
      let said = '';
      for (let i = 0; i < results.length; i++) {
        said += ' ' + results[i].transcript.toLowerCase();
      }
      said = said.trim();

      const isYes = /\b(sí|si|vale|ok|claro|venga|añade|añadir|afirmativo|por supuesto)\b/.test(said);
      const isNo = /\b(no|nada|cancelar|cancela|déjalo|dejalo|paso)\b/.test(said);

      if (isYes && onAddToRoute) {
        onAddToRoute({ coordinates: poi.position, name: poi.name });
        speak(`${poi.name} añadido como destino. Recalculando ruta.`);
        setResult(null);
      } else if (isNo) {
        speak('De acuerdo, no se añade.');
        setResult(null);
      } else {
        speak('No te he entendido. Puedes pulsar el botón para añadirlo.');
      }
      setAwaitingConfirmation(false);
    };

    recognition.onerror = () => {
      setAwaitingConfirmation(false);
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      setAwaitingConfirmation(false);
    };

    // Small delay so the speech finishes before listening
    setTimeout(() => {
      try { recognition.start(); } catch {}
    }, 3500);
  }, [onAddToRoute]);

  const findNearest = useCallback(async (type: 'gas_station' | 'restaurant') => {
    if (routePath.length < 2) return;
    setLoadingType(type);
    setResult(null);
    stopListening();

    try {
      // Get current user position
      const userPos = await new Promise<{ lat: number; lng: number }>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          (err) => reject(err),
          { enableHighAccuracy: true, timeout: 10000 }
        );
      });

      const service = new google.maps.places.PlacesService(document.createElement('div'));

      const results = await new Promise<google.maps.places.PlaceResult[]>((resolve) => {
        service.nearbySearch(
          { location: userPos, radius: 20000, type },
          (res, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && res) resolve(res);
            else resolve([]);
          }
        );
      });

      let best: NearestPOI | null = null;

      for (const r of results) {
        if (!r.geometry?.location) continue;
        const pos = { lat: r.geometry.location.lat(), lng: r.geometry.location.lng() };
        const dist = google.maps.geometry?.spherical?.computeDistanceBetween(
          new google.maps.LatLng(userPos.lat, userPos.lng),
          new google.maps.LatLng(pos.lat, pos.lng)
        ) ?? 99999;

        if (!best || dist < best.distance) {
          best = { name: r.name || 'Sin nombre', position: pos, distance: Math.round(dist) };
        }
      }

      const label = type === 'gas_station' ? 'gasolinera' : 'restaurante';

      if (best) {
        setResult({ type: label, poi: best });
        const distText = formatDist(best.distance);
        speak(
          `La ${label} más cercana es ${best.name}, a ${distText}. ¿Quieres añadirla a la ruta?`
        );
        // Start listening for voice confirmation
        listenForConfirmation(best, label);
      } else {
        const labelPlural = type === 'gas_station' ? 'gasolineras' : 'restaurantes';
        speak(`No se encontraron ${labelPlural} en 20 kilómetros.`);
      }
    } catch (err) {
      console.error('POI search error:', err);
      speak('Error al buscar servicios cercanos.');
    } finally {
      setLoadingType(null);
    }
  }, [routePath, stopListening, listenForConfirmation]);

  const handleAddToRoute = useCallback(() => {
    if (!result || !onAddToRoute) return;
    stopListening();
    onAddToRoute({
      coordinates: result.poi.position,
      name: result.poi.name,
    });
    speak(`${result.poi.name} añadido como destino. Recalculando ruta.`);
    setResult(null);
  }, [result, onAddToRoute, stopListening]);

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
            A {result.poi.distance >= 1000 ? `${(result.poi.distance / 1000).toFixed(1)} km` : `${result.poi.distance} m`} de tu posición
          </p>
          {awaitingConfirmation && (
            <p className="text-[11px] text-primary animate-pulse font-medium">
              🎙️ Escuchando... di "sí" o "no"
            </p>
          )}
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
