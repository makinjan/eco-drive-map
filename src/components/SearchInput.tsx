import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { MapPin } from 'lucide-react';
import { MAPBOX_TOKEN } from '@/lib/mapbox-config';

export interface PlaceResult {
  coordinates: [number, number];
  name: string;
}

interface SearchInputProps {
  placeholder: string;
  onSelect: (place: PlaceResult) => void;
  icon?: 'origin' | 'destination';
}

const SearchInput = ({ placeholder, onSelect, icon = 'origin' }: SearchInputProps) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const search = async (q: string) => {
    if (q.length < 3) {
      setResults([]);
      return;
    }
    try {
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?access_token=${MAPBOX_TOKEN}&country=es&language=es&limit=5`
      );
      const data = await res.json();
      setResults(data.features || []);
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

  const handleSelect = (feature: any) => {
    setQuery(feature.place_name);
    setShowResults(false);
    onSelect({
      coordinates: feature.center as [number, number],
      name: feature.place_name,
    });
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
          {results.map((r: any) => (
            <button
              key={r.id}
              onClick={() => handleSelect(r)}
              className="w-full text-left px-3 py-2.5 text-sm hover:bg-accent transition-colors first:rounded-t-lg last:rounded-b-lg"
            >
              <span className="text-foreground">{r.text}</span>
              <span className="block text-xs text-muted-foreground truncate">
                {r.place_name}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchInput;
