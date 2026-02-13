import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { MapPin } from 'lucide-react';

export interface PlaceResult {
  coordinates: { lat: number; lng: number };
  name: string;
}

interface SearchInputProps {
  placeholder: string;
  onSelect: (place: PlaceResult) => void;
  icon?: 'origin' | 'destination';
}

interface Suggestion {
  placeId: string;
  mainText: string;
  description: string;
  toPlace: () => google.maps.places.Place;
}

const SearchInput = ({ placeholder, onSelect, icon = 'origin' }: SearchInputProps) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Suggestion[]>([]);
  const [showResults, setShowResults] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const containerRef = useRef<HTMLDivElement>(null);
  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);

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
      // Reset session token after selection
      sessionTokenRef.current = null;
    } catch (err) {
      console.error('Place details error:', err);
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
              key={r.placeId}
              onClick={() => handleSelect(r)}
              className="w-full text-left px-3 py-2.5 text-sm hover:bg-accent transition-colors first:rounded-t-lg last:rounded-b-lg"
            >
              <span className="text-foreground">{r.mainText}</span>
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
