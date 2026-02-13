import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { MapPin, Locate, Loader2 } from 'lucide-react';

export interface PlaceResult {
  coordinates: { lat: number; lng: number };
  name: string;
}

interface SearchInputProps {
  placeholder: string;
  onSelect: (place: PlaceResult) => void;
  icon?: 'origin' | 'destination';
  autoGeolocate?: boolean;
}

interface Suggestion {
  placeId: string;
  mainText: string;
  description: string;
  toPlace: () => google.maps.places.Place;
}

const SearchInput = ({ placeholder, onSelect, icon = 'origin', autoGeolocate = false }: SearchInputProps) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Suggestion[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [geolocating, setGeolocating] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const containerRef = useRef<HTMLDivElement>(null);
  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const didAutoGeolocate = useRef(false);

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

  // Auto-geolocate on mount if enabled
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
            placeholder={geolocating ? 'Localizando...' : placeholder}
            className="pl-8 h-10 bg-muted/50 border-border/60 rounded-xl text-sm placeholder:text-muted-foreground/60 focus:bg-background focus:border-primary/40 transition-colors"
          />
        </div>
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

// Helper
function cn(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

export default SearchInput;
