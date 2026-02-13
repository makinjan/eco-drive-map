import { useState } from 'react';
import { Navigation, AlertTriangle, CheckCircle2, XCircle, Loader2, Shield, ChevronUp, ChevronDown, Route } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { Button } from '@/components/ui/button';
import TagSelector from './TagSelector';
import SearchInput, { type PlaceResult } from './SearchInput';
import type { ValidationResult } from '@/lib/route-validator';

interface RouteInfo {
  path: { lat: number; lng: number }[];
  duration: number | null;
  distance: number | null;
}

interface MobilePanelProps {
  selectedTag: string;
  onTagChange: (tag: string) => void;
  onOriginSelect: (place: PlaceResult) => void;
  onDestinationSelect: (place: PlaceResult) => void;
  onCalculateRoute: () => void;
  routeStatus: 'idle' | 'loading' | 'valid' | 'invalid' | 'no-route';
  validationResult: ValidationResult | null;
  routeDuration: number | null;
  routeDistance: number | null;
  canCalculate: boolean;
  altRoute: RouteInfo | null;
  onUseAltRoute: () => void;
}

const MobilePanel = ({
  selectedTag,
  onTagChange,
  onOriginSelect,
  onDestinationSelect,
  onCalculateRoute,
  routeStatus,
  validationResult,
  routeDuration,
  routeDistance,
  canCalculate,
  altRoute,
  onUseAltRoute,
}: MobilePanelProps) => {
  const [expanded, setExpanded] = useState(true);

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h} h ${m} min`;
    return `${m} min`;
  };

  const formatDistance = (meters: number) => {
    if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
    return `${Math.round(meters)} m`;
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 z-10">
      <div className="glass-panel-mobile rounded-t-2xl">
        {/* Handle bar */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex flex-col items-center pt-3 pb-1.5 cursor-pointer"
        >
          <div className="w-9 h-1 rounded-full bg-muted-foreground/25 mb-1.5" />
          <div className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
            {expanded ? 'Minimizar' : 'Expandir'}
          </div>
        </button>

        {/* Header */}
        <div className="px-4 pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10">
                <Shield className="h-4 w-4 text-primary" />
              </div>
              <span className="text-sm font-bold text-foreground tracking-tight">ZBE Navigator</span>
            </div>
            <ThemeToggle />
          </div>
        </div>

        {expanded && (
          <div className="px-4 pb-5 space-y-3 max-h-[60vh] overflow-y-auto">
            <TagSelector value={selectedTag} onChange={onTagChange} />

            <SearchInput placeholder="Origen" onSelect={onOriginSelect} icon="origin" />
            <SearchInput placeholder="Destino" onSelect={onDestinationSelect} icon="destination" />

            <Button
              onClick={onCalculateRoute}
              disabled={!canCalculate || routeStatus === 'loading'}
              className="w-full font-semibold h-11 rounded-xl text-sm shadow-sm"
              size="lg"
            >
              {routeStatus === 'loading' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Calculando...
                </>
              ) : (
                <>
                  <Navigation className="mr-2 h-4 w-4" />
                  Calcular ruta
                </>
              )}
            </Button>

            {/* Route result */}
            {routeStatus !== 'idle' && routeStatus !== 'loading' && (
              <div className="space-y-2.5 pt-1">
                {routeStatus === 'valid' && (
                  <div className="rounded-xl bg-route-valid/8 border border-route-valid/20 p-3.5 space-y-2">
                    <div className="flex items-center gap-2 text-route-valid font-semibold text-sm">
                      <CheckCircle2 className="h-4.5 w-4.5" />
                      Ruta legal para etiqueta {selectedTag}
                    </div>
                    {routeDuration != null && routeDistance != null && (
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        <span>🕐 {formatDuration(routeDuration)}</span>
                        <span>📍 {formatDistance(routeDistance)}</span>
                      </div>
                    )}
                  </div>
                )}

                {routeStatus === 'invalid' && validationResult && (
                  <div className="rounded-xl bg-destructive/6 border border-destructive/15 p-3.5 space-y-2.5">
                    <div className="flex items-center gap-2 text-destructive font-semibold text-sm">
                      <XCircle className="h-4.5 w-4.5" />
                      Ruta no permitida
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Tu etiqueta <strong className="text-foreground">{selectedTag}</strong> no puede circular por:
                    </p>
                    {validationResult.blockedZones.map((z) => (
                      <div
                        key={z.id}
                        className="flex items-start gap-2 text-xs bg-destructive/5 rounded-lg p-2.5"
                      >
                        <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />
                        <div>
                          <span className="font-medium text-foreground">{z.name}</span>
                          <span className="block text-muted-foreground mt-0.5">
                            Permitidas: {z.allowedTags.join(', ')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {routeStatus === 'invalid' && altRoute && (
                  <div className="rounded-xl bg-route-valid/8 border border-route-valid/25 p-3.5 space-y-2.5">
                    <div className="flex items-center gap-2 text-route-valid font-semibold text-sm">
                      <Route className="h-4.5 w-4.5" />
                      Alternativa legal disponible
                    </div>
                    {altRoute.duration != null && altRoute.distance != null && (
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        <span>🕐 {formatDuration(altRoute.duration)}</span>
                        <span>📍 {formatDistance(altRoute.distance)}</span>
                      </div>
                    )}
                    <Button
                      onClick={onUseAltRoute}
                      variant="outline"
                      size="sm"
                      className="w-full border-route-valid/40 text-route-valid hover:bg-route-valid/10 rounded-lg font-medium"
                    >
                      <Route className="mr-2 h-3.5 w-3.5" />
                      Usar ruta alternativa
                    </Button>
                  </div>
                )}

                {routeStatus === 'no-route' && (
                  <div className="rounded-xl bg-muted/60 border border-border/60 p-3.5">
                    <div className="flex items-center gap-2 text-muted-foreground font-semibold text-sm">
                      <XCircle className="h-4.5 w-4.5" />
                      No se encontró ruta
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MobilePanel;
