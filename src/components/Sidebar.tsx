import { Navigation, AlertTriangle, CheckCircle2, XCircle, Loader2, Shield, Route } from 'lucide-react';
import { Button } from '@/components/ui/button';
import TagSelector from './TagSelector';
import SearchInput, { type PlaceResult } from './SearchInput';
import type { ValidationResult } from '@/lib/route-validator';

interface RouteInfo {
  path: { lat: number; lng: number }[];
  duration: number | null;
  distance: number | null;
}

interface SidebarProps {
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

const Sidebar = ({
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
}: SidebarProps) => {
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
    <div className="absolute top-4 left-4 z-10 w-80 max-h-[calc(100vh-2rem)] overflow-y-auto">
      <div className="bg-card rounded-2xl shadow-xl border border-border/50 backdrop-blur-sm">
        {/* Header */}
        <div className="p-4 border-b border-border/50">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-bold text-foreground">ZBE Navigator</h1>
          </div>
          <p className="text-xs text-muted-foreground">
            Rutas legales según tu etiqueta ambiental
          </p>
        </div>

        {/* Tag selector */}
        <div className="p-4 border-b border-border/50">
          <TagSelector value={selectedTag} onChange={onTagChange} />
        </div>

        {/* Search inputs */}
        <div className="p-4 space-y-3">
          <SearchInput
            placeholder="Origen"
            onSelect={onOriginSelect}
            icon="origin"
          />
          <SearchInput
            placeholder="Destino"
            onSelect={onDestinationSelect}
            icon="destination"
          />

          <Button
            onClick={onCalculateRoute}
            disabled={!canCalculate || routeStatus === 'loading'}
            className="w-full mt-2 font-semibold"
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
        </div>

        {/* Route result */}
        {routeStatus !== 'idle' && routeStatus !== 'loading' && (
          <div className="p-4 border-t border-border/50">
            {routeStatus === 'valid' && (
              <div className="rounded-xl bg-route-valid/10 p-3 space-y-2">
                <div className="flex items-center gap-2 text-route-valid font-semibold text-sm">
                  <CheckCircle2 className="h-5 w-5" />
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
              <div className="rounded-xl bg-destructive/10 p-3 space-y-2">
                <div className="flex items-center gap-2 text-destructive font-semibold text-sm">
                  <XCircle className="h-5 w-5" />
                  Ruta no permitida
                </div>
                <p className="text-xs text-muted-foreground">
                  Tu etiqueta <strong>{selectedTag}</strong> no puede circular por:
                </p>
                {validationResult.blockedZones.map((z) => (
                  <div
                    key={z.id}
                    className="flex items-start gap-2 text-xs bg-destructive/5 rounded-lg p-2"
                  >
                    <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                    <div>
                      <strong>{z.name}</strong>
                      <br />
                      <span className="text-muted-foreground">
                        Permitidas: {z.allowedTags.join(', ')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {routeStatus === 'invalid' && altRoute && (
              <div className="rounded-xl bg-route-valid/10 border border-route-valid/30 p-3 space-y-2">
                <div className="flex items-center gap-2 text-route-valid font-semibold text-sm">
                  <Route className="h-5 w-5" />
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
                  className="w-full border-route-valid/50 text-route-valid hover:bg-route-valid/10"
                >
                  <Route className="mr-2 h-4 w-4" />
                  Usar ruta alternativa
                </Button>
              </div>
            )}

            {routeStatus === 'no-route' && (
              <div className="rounded-xl bg-muted p-3">
                <div className="flex items-center gap-2 text-muted-foreground font-semibold text-sm">
                  <XCircle className="h-5 w-5" />
                  No se encontró ruta
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  No se pudo calcular una ruta entre los puntos seleccionados.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Legend */}
        <div className="p-4 border-t border-border/50">
          <p className="text-xs font-medium text-muted-foreground mb-2">Leyenda</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="w-4 h-3 rounded-sm bg-destructive/20 border border-destructive/50" />
            Zona de Bajas Emisiones (ZBE)
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
