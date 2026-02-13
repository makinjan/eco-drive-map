import { useState, useRef, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Locate, Loader2, X, Mic, MicOff } from 'lucide-react';
import { useVoiceInput } from '@/hooks/use-voice-input';
import { toast } from 'sonner';

export interface PlaceResult {
  coordinates: { lat: number; lng: number };
  name: string;
}

interface SearchInputProps {
  placeholder: string;
  onSelect: (place: PlaceResult) => void;
  onClear?: () => void;
  icon?: 'origin' | 'destination';
  autoGeolocate?: boolean;
}

interface Suggestion {
  placeId: string;
  mainText: string;
  description: string;
  toPlace: () => google.maps.places.Place;
}

const SearchInput = ({ placeholder, onSelect, onClear, icon = 'origin', autoGeolocate = false }: SearchInputProps) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Suggestion[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [geolocating, setGeolocating] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const containerRef = useRef<HTMLDivElement>(null);
  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const didAutoGeolocate = useRef(false);

  const geocodeAndSelect = useCallback(async (address: string) => {
    try {
      const geocoder = new google.maps.Geocoder();
      const res = await geocoder.geocode({ address, region: 'es' });
      if (res.results && res.results.length > 0) {
        const loc = res.results[0].geometry.location;
        const name = res.results[0].formatted_address;
        setQuery(name);
        onSelect({ coordinates: { lat: loc.lat(), lng: loc.lng() }, name });
        return;
      }
    } catch (err) {
      console.error('Geocode error:', err);
    }
    toast.error('No se encontró la dirección dictada');
  }, [onSelect]);

  const voice = useVoiceInput({
    onResult: (transcript) => {
      setQuery(transcript);
      toast.info(`🎤 "${transcript}"`);
      geocodeAndSelect(transcript);
    },
    onError: (err) => toast.error(err),
  });

  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
      const geocoder = new google.maps.Geocoder();
      const res = await geocoder.geocode({ location: { lat, lng } });
      if (res.results && res.results.length > 0) {
        return res.results[0].formatted_address;
      }
    } catch (err) {
      console.error('Reverse geocode error:', err);
    }
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  };

  const geolocate = async () => {
    if (!navigator.geolocation) return;
    setGeolocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        const address = await reverseGeocode(coords.lat, coords.lng);
        setQuery(address);
        onSelect({ coordinates: coords, name: address });
        setGeolocating(false);
      },
      (err) => {
        console.error('Geolocation error:', err);
        setGeolocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  useEffect(() => {
    if (autoGeolocate && !didAutoGeolocate.current) {
      didAutoGeolocate.current = true;
      geolocate();
    }
  }, [autoGeolocate]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getSessionToken = () => {
    if (!sessionTokenRef.current) {
      sessionTokenRef.current = new google.maps.places.AutocompleteSessionToken();
    }
    return sessionTokenRef.current;
  };

  const search = async (q: string) => {
    if (q.length < 3) {
      setResults([]);
      return;
    }
    try {
      const { suggestions } =
        await google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input: q,
          sessionToken: getSessionToken(),
          includedRegionCodes: ['es'],
          language: 'es',
        });

      const mapped: Suggestion[] = suggestions
        .filter((s) => s.placePrediction)
        .map((s) => {
          const pp = s.placePrediction!;
          return {
            placeId: pp.placeId,
            mainText: pp.mainText?.text ?? '',
            description: pp.text?.text ?? '',
            toPlace: () => pp.toPlace(),
          };
        });

      setResults(mapped);
      setShowResults(true);
    } catch (err) {
      console.error('Autocomplete error:', err);
      setResults([]);
    }
  };

  const handleChange = (value: string) => {
    setQuery(value);
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => search(value), 300);
  };

  const handleSelect = async (suggestion: Suggestion) => {
    setQuery(suggestion.description);
    setShowResults(false);
    try {
      const place = suggestion.toPlace();
      await place.fetchFields({ fields: ['location', 'displayName'] });
      const loc = place.location;
      if (loc) {
        onSelect({
          coordinates: { lat: loc.lat(), lng: loc.lng() },
          name: suggestion.description,
        });
      }
      sessionTokenRef.current = null;
    } catch (err) {
      console.error('Place details error:', err);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative flex items-center gap-1.5">
        <div className="relative flex-1">
          <div
            className={cn(
              'absolute left-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full',
              icon === 'origin' ? 'bg-route-valid' : 'bg-destructive'
            )}
          />
          <Input
            value={query}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={geolocating ? 'Localizando...' : voice.isListening ? '🎤 Escuchando...' : placeholder}
            className="pl-8 pr-8 h-10 bg-muted/50 border-border/60 rounded-xl text-sm placeholder:text-muted-foreground/60 focus:bg-background focus:border-primary/40 transition-colors"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setResults([]);
                setShowResults(false);
                onClear?.();
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        {/* Mic button */}
        <button
          type="button"
          onClick={voice.isListening ? voice.stopListening : voice.startListening}
          className={cn(
            'flex items-center justify-center w-10 h-10 rounded-xl border transition-colors shrink-0',
            voice.isListening
              ? 'bg-destructive/10 border-destructive/40 text-destructive animate-pulse'
              : 'bg-muted/50 border-border/60 hover:bg-accent/60 text-primary'
          )}
          title={voice.isListening ? 'Detener' : 'Dictar dirección'}
        >
          {voice.isListening ? (
            <MicOff className="h-4 w-4" />
          ) : (
            <Mic className="h-4 w-4" />
          )}
        </button>
        {icon === 'origin' && (
          <button
            type="button"
            onClick={geolocate}
            disabled={geolocating}
            className="flex items-center justify-center w-10 h-10 rounded-xl bg-muted/50 border border-border/60 hover:bg-accent/60 transition-colors shrink-0"
            title="Usar mi ubicación"
          >
            {geolocating ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : (
              <Locate className="h-4 w-4 text-primary" />
            )}
          </button>
        )}
      </div>
      {showResults && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1.5 bg-popover border border-border/60 rounded-xl shadow-lg max-h-48 overflow-y-auto">
          {results.map((r) => (
            <button
              key={r.placeId}
              onClick={() => handleSelect(r)}
              className="w-full text-left px-3 py-2.5 text-sm hover:bg-accent/60 transition-colors first:rounded-t-xl last:rounded-b-xl"
            >
              <span className="text-foreground font-medium">{r.mainText}</span>
              <span className="block text-[11px] text-muted-foreground truncate mt-0.5">
                {r.description}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

function cn(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

export default SearchInput;
