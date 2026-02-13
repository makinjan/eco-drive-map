import { Navigation, AlertTriangle, CheckCircle2, XCircle, Loader2, Shield, Route, MapPin, ParkingCircle } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import ProximityAlertBanner from './ProximityAlertBanner';
import { Button } from '@/components/ui/button';
import TagSelector from './TagSelector';
import SearchInput, { type PlaceResult } from './SearchInput';
import type { ValidationResult } from '@/lib/route-validator';

interface RouteInfo {
  path: { lat: number; lng: number }[];
  duration: number | null;
  distance: number | null;
}

interface ProximityAlert {
  zoneName: string;
  distanceKm: number;
}

interface SafePoint {
  coordinates: { lat: number; lng: number };
  zoneName: string;
  distanceMeters: number;
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
  safeOrigin: SafePoint | null;
  safeDest: SafePoint | null;
  proximityEnabled: boolean;
  onToggleProximity: () => void;
  nearbyZones: ProximityAlert[];
  proximityError: string | null;
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
  safeOrigin,
  safeDest,
  proximityEnabled,
  onToggleProximity,
  nearbyZones,
  proximityError,
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
    <div className="absolute top-4 left-4 z-10 w-[340px] max-h-[calc(100vh-2rem)] overflow-y-auto">
      <div className="glass-panel rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
                <Shield className="h-4.5 w-4.5 text-primary" />
              </div>
              <div>
                <h1 className="text-base font-bold text-foreground tracking-tight">
                  ZBE Navigator
                </h1>
                <p className="text-[11px] text-muted-foreground leading-tight">
                  Rutas legales según tu etiqueta DGT
                </p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>

        {/* Tag selector */}
        <div className="px-5 pb-4">
          <TagSelector value={selectedTag} onChange={onTagChange} />
        </div>

        {/* Divider */}
        <div className="mx-5 h-px bg-border/60" />

        {/* Search inputs */}
        <div className="px-5 py-4 space-y-2.5">
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
            className="w-full mt-1 font-semibold h-11 rounded-xl text-sm shadow-sm"
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
          <>
            <div className="mx-5 h-px bg-border/60" />
            <div className="px-5 py-4 space-y-2.5">
              {routeStatus === 'valid' && (
                <div className="rounded-xl bg-route-valid/8 border border-route-valid/20 p-3.5 space-y-2">
                  <div className="flex items-center gap-2 text-route-valid font-semibold text-sm">
                    <CheckCircle2 className="h-4.5 w-4.5" />
                    Ruta legal para etiqueta {selectedTag}
                  </div>
                  {routeDuration != null && routeDistance != null && (
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">🕐 {formatDuration(routeDuration)}</span>
                      <span className="flex items-center gap-1">📍 {formatDistance(routeDistance)}</span>
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

              {/* Safe point suggestions */}
              {routeStatus === 'invalid' && (safeOrigin || safeDest) && (
                <div className="space-y-2">
                  {[
                    { point: safeOrigin, label: 'origen', type: 'origin' as const },
                    { point: safeDest, label: 'destino', type: 'destination' as const },
                  ]
                    .filter((s) => s.point)
                    .map(({ point, label, type }) => (
                      <div
                        key={type}
                        className="rounded-xl bg-alert-warning/8 border border-alert-warning/20 p-3.5 space-y-2"
                      >
                        <div className="flex items-center gap-2 text-alert-warning font-semibold text-xs">
                          <ParkingCircle className="h-4 w-4" />
                          Punto seguro cerca de tu {label}
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          A <strong className="text-foreground">{point!.distanceMeters} m</strong> fuera de{' '}
                          <strong className="text-foreground">{point!.zoneName}</strong>
                        </p>
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${point!.coordinates.lat},${point!.coordinates.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-1.5 text-xs font-medium text-alert-warning hover:underline"
                        >
                          <MapPin className="h-3 w-3" />
                          Ver en Google Maps
                        </a>
                      </div>
                    ))}
                </div>
              )}

              {routeStatus === 'no-route' && (
                <div className="rounded-xl bg-muted/60 border border-border/60 p-3.5">
                  <div className="flex items-center gap-2 text-muted-foreground font-semibold text-sm">
                    <XCircle className="h-4.5 w-4.5" />
                    No se encontró ruta
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    No se pudo calcular una ruta entre los puntos seleccionados.
                  </p>
                </div>
              )}
            </div>
          </>
        )}

        {/* Proximity alert */}
        <div className="px-5 pb-3">
          <ProximityAlertBanner
            nearbyZones={nearbyZones}
            enabled={proximityEnabled}
            onToggle={onToggleProximity}
            error={proximityError}
          />
        </div>

        {/* Legend */}
        <div className="mx-5 h-px bg-border/60" />
        <div className="px-5 py-3.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Leyenda</p>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="w-3.5 h-2.5 rounded-[3px] bg-destructive/25 border border-destructive/50" />
              ZBE
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="w-3.5 h-2.5 rounded-[3px] bg-primary/25 border border-primary/50" />
              ZBEDEP — Especial Protección
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
