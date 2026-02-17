import { Navigation, AlertTriangle, CheckCircle2, XCircle, Loader2, Shield, Route, MapPin, ParkingCircle, Mic, MicOff, Car, Share2 } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import RouteServices from './RouteServices';
import ProximityAlertBanner from './ProximityAlertBanner';
import HistoryFavoritesPanel from './HistoryFavoritesPanel';
import WaypointInputs from './WaypointInputs';
import TripCostEstimator from './TripCostEstimator';
import { Button } from '@/components/ui/button';
import TagSelector from './TagSelector';
import SearchInput, { type PlaceResult } from './SearchInput';
import type { ValidationResult } from '@/lib/route-validator';
import type { SavedPlace, RouteHistoryEntry } from '@/hooks/use-route-history';
import type { RoutePOI } from './MapView';

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
  onOriginClear?: () => void;
  onDestinationSelect: (place: PlaceResult) => void;
  onDestinationClear?: () => void;
  routeStatus: 'idle' | 'loading' | 'valid' | 'invalid' | 'no-route';
  validationResult: ValidationResult | null;
  routeDuration: number | null;
  routeDistance: number | null;
  altRoute: RouteInfo | null;
  onUseAltRoute: () => void;
  safeOrigin: SafePoint | null;
  safeDest: SafePoint | null;
  nearbyZones: ProximityAlert[];
  proximityError: string | null;
  origin: { lat: number; lng: number } | null;
  destination: { lat: number; lng: number } | null;
  onStartNavigation: () => void;
  isNavigating: boolean;
  onVoiceCommand: () => void;
  isVoiceListening: boolean;
  originName?: string;
  destName?: string;
  routePath: { lat: number; lng: number }[];
  history: RouteHistoryEntry[];
  favorites: SavedPlace[];
  onAddFavorite: (place: SavedPlace) => void;
  onRemoveFavorite: (name: string) => void;
  isFavorite: (name: string) => boolean;
  onClearHistory: () => void;
  waypoints: (PlaceResult | null)[];
  onAddWaypoint: () => void;
  onRemoveWaypoint: (index: number) => void;
  onWaypointSelect: (index: number, place: PlaceResult) => void;
  onWaypointClear: (index: number) => void;
  waypointNames: (string | undefined)[];
  zbeParkings: RoutePOI[];
  onShareRoute: () => void;
}

const Sidebar = ({
  selectedTag,
  onTagChange,
  onOriginSelect,
  onOriginClear,
  onDestinationSelect,
  onDestinationClear,
  routeStatus,
  validationResult,
  routeDuration,
  routeDistance,
  altRoute,
  onUseAltRoute,
  safeOrigin,
  safeDest,
  nearbyZones,
  proximityError,
  origin,
  destination,
  onStartNavigation,
  isNavigating,
  onVoiceCommand,
  isVoiceListening,
  originName,
  destName,
  routePath,
  history,
  favorites,
  onAddFavorite,
  onRemoveFavorite,
  isFavorite,
  onClearHistory,
  waypoints,
  onAddWaypoint,
  onRemoveWaypoint,
  onWaypointSelect,
  onWaypointClear,
  waypointNames,
  zbeParkings,
  onShareRoute,
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
            onClear={onOriginClear}
            icon="origin"
            autoGeolocate
            externalValue={originName}
          />
          <SearchInput
            placeholder="Destino"
            onSelect={onDestinationSelect}
            onClear={onDestinationClear}
            icon="destination"
            externalValue={destName}
          />

          {/* Waypoint inputs */}
          <WaypointInputs
            waypoints={waypoints}
            onAddWaypoint={onAddWaypoint}
            onRemoveWaypoint={onRemoveWaypoint}
            onWaypointSelect={onWaypointSelect}
            onWaypointClear={onWaypointClear}
            waypointNames={waypointNames}
          />

          {routeStatus === 'loading' && (
            <div className="flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Calculando ruta...
            </div>
          )}

          <Button
            onClick={onVoiceCommand}
            variant="outline"
            size="lg"
            className={`w-full h-11 rounded-xl gap-2 ${isVoiceListening ? 'border-destructive/40 bg-destructive/10 text-destructive animate-pulse' : ''}`}
            title="Comando de voz: di tu destino"
          >
            {isVoiceListening ? <MicOff className="h-4.5 w-4.5" /> : <Mic className="h-4.5 w-4.5" />}
            {isVoiceListening ? 'Escuchando...' : 'Comando de voz'}
          </Button>
        </div>

        {/* History & Favorites */}
        {routeStatus === 'idle' && (
          <div className="px-5 pb-3">
            <HistoryFavoritesPanel
              history={history}
              favorites={favorites}
              onSelectRoute={(o, d) => { onOriginSelect(o); onDestinationSelect(d); }}
              onSelectDestination={(d) => onDestinationSelect(d)}
              onAddFavorite={onAddFavorite}
              onRemoveFavorite={onRemoveFavorite}
              isFavorite={isFavorite}
              onClearHistory={onClearHistory}
            />
          </div>
        )}

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
                  <div className="flex gap-2">
                    <Button
                      onClick={onStartNavigation}
                      variant="default"
                      size="sm"
                      className="flex-1 rounded-lg font-semibold mt-1"
                    >
                      <Navigation className="mr-2 h-3.5 w-3.5" />
                      Iniciar ruta
                    </Button>
                    <Button
                      onClick={onShareRoute}
                      variant="outline"
                      size="sm"
                      className="rounded-lg mt-1"
                      title="Compartir ruta"
                    >
                      <Share2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
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

              {/* Parking near ZBE */}
              {routeStatus === 'invalid' && zbeParkings.length > 0 && (
                <div className="rounded-xl bg-primary/6 border border-primary/15 p-3.5 space-y-2.5">
                  <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                    <Car className="h-4.5 w-4.5" />
                    Parkings fuera de la ZBE
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Aparca fuera de la zona restringida:
                  </p>
                  <div className="space-y-1.5">
                    {zbeParkings.slice(0, 5).map((p) => (
                      <a
                        key={p.id}
                        href={`https://www.google.com/maps/search/?api=1&query=${p.position.lat},${p.position.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-start gap-2 text-xs bg-primary/5 rounded-lg p-2 hover:bg-primary/10 transition-colors"
                      >
                        <ParkingCircle className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <span className="font-medium text-foreground block truncate">{p.name}</span>
                          {p.vicinity && (
                            <span className="text-muted-foreground block truncate">{p.vicinity}</span>
                          )}
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Trip cost estimator */}
              {(routeStatus === 'valid' || routeStatus === 'invalid') && routeDistance != null && (
                <TripCostEstimator distanceMeters={routeDistance} />
              )}

              {/* Share button for invalid routes with alternative */}
              {routeStatus === 'invalid' && altRoute && (
                <Button
                  onClick={onShareRoute}
                  variant="outline"
                  size="sm"
                  className="w-full rounded-lg gap-2"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  Compartir ruta
                </Button>
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
            error={proximityError}
          />
        </div>

        {/* Route services */}
        {routeStatus === 'valid' && routePath.length > 0 && (
          <div className="px-5 pb-3">
            <RouteServices routePath={routePath} isVisible onAddToRoute={(place) => onDestinationSelect(place)} destination={destination} />
          </div>
        )}

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
              ZBEDEP / ZBEES — Especial Protección
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
