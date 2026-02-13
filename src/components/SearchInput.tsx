import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { MapPin } from 'lucide-react';
import { GOOGLE_MAPS_API_KEY } from '@/lib/google-maps-config';

export interface PlaceResult {
  coordinates: { lat: number; lng: number };
  name: string;
}

interface SearchInputProps {
  placeholder: string;
  onSelect: (place: PlaceResult) => void;
  icon?: 'origin' | 'destination';
}

const SearchInput = ({ placeholder, onSelect, icon = 'origin' }: SearchInputProps) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [showResults, setShowResults] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const containerRef = useRef<HTMLDivElement>(null);
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const geocoder = useRef<google.maps.Geocoder | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getService = () => {
    if (!autocompleteService.current) {
      autocompleteService.current = new google.maps.places.AutocompleteService();
    }
    return autocompleteService.current;
  };

  const getGeocoder = () => {
    if (!geocoder.current) {
      geocoder.current = new google.maps.Geocoder();
    }
    return geocoder.current;
  };

  const search = async (q: string) => {
    if (q.length < 3) {
      setResults([]);
      return;
    }
    try {
      const service = getService();
      const response = await service.getPlacePredictions({
        input: q,
        componentRestrictions: { country: 'es' },
        language: 'es',
      });
      setResults(response.predictions || []);
      setShowResults(true);
    } catch {
      setResults([]);
    }
  };

  const handleChange = (value: string) => {
    setQuery(value);
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => search(value), 300);
  };

  const handleSelect = async (prediction: google.maps.places.AutocompletePrediction) => {
    setQuery(prediction.description);
    setShowResults(false);
    try {
      const gc = getGeocoder();
      const result = await gc.geocode({ placeId: prediction.place_id });
      if (result.results[0]) {
        const loc = result.results[0].geometry.location;
        onSelect({
          coordinates: { lat: loc.lat(), lng: loc.lng() },
          name: prediction.description,
        });
      }
    } catch (err) {
      console.error('Geocoding error:', err);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <MapPin
          className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${
            icon === 'origin' ? 'text-route-valid' : 'text-destructive'
          }`}
        />
        <Input
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={placeholder}
          className="pl-9 bg-secondary/50 border-border focus:bg-background"
        />
      </div>
      {showResults && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {results.map((r) => (
            <button
              key={r.place_id}
              onClick={() => handleSelect(r)}
              className="w-full text-left px-3 py-2.5 text-sm hover:bg-accent transition-colors first:rounded-t-lg last:rounded-b-lg"
            >
              <span className="text-foreground">
                {r.structured_formatting.main_text}
              </span>
              <span className="block text-xs text-muted-foreground truncate">
                {r.description}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchInput;
