import { useState } from 'react';
import { Navigation, AlertTriangle, CheckCircle2, XCircle, Loader2, Shield, ChevronUp, ChevronDown, Route, ParkingCircle, MapPin, Mic, MicOff } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import ProximityAlertBanner from './ProximityAlertBanner';
import RouteServices from './RouteServices';
import HistoryFavoritesPanel from './HistoryFavoritesPanel';
import WaypointInputs from './WaypointInputs';
import { Button } from '@/components/ui/button';
import TagSelector from './TagSelector';
import SearchInput, { type PlaceResult } from './SearchInput';
import type { ValidationResult } from '@/lib/route-validator';
import type { SavedPlace, RouteHistoryEntry } from '@/hooks/use-route-history';

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

interface MobilePanelProps {
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
}

const MobilePanel = ({
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

            <SearchInput placeholder="Origen" onSelect={onOriginSelect} onClear={onOriginClear} icon="origin" autoGeolocate externalValue={originName} />
            <SearchInput placeholder="Destino" onSelect={onDestinationSelect} onClear={onDestinationClear} icon="destination" externalValue={destName} />

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
              title="Comando de voz"
            >
              {isVoiceListening ? <MicOff className="h-4.5 w-4.5" /> : <Mic className="h-4.5 w-4.5" />}
              {isVoiceListening ? 'Escuchando...' : 'Comando de voz'}
            </Button>

            {/* History & Favorites */}
            {routeStatus === 'idle' && (
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
            )}

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
                    <Button
                      onClick={onStartNavigation}
                      variant="default"
                      size="sm"
                      className="w-full rounded-lg font-semibold mt-1"
                    >
                      <Navigation className="mr-2 h-3.5 w-3.5" />
                      Iniciar ruta
                    </Button>
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
                  </div>
                )}
              </div>
            )}

            {/* Route services */}
            {routeStatus === 'valid' && routePath.length > 0 && (
              <RouteServices routePath={routePath} isVisible onAddToRoute={(place) => onDestinationSelect(place)} destination={destination} />
            )}

            {/* Proximity alert */}
            <ProximityAlertBanner
              nearbyZones={nearbyZones}
              error={proximityError}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default MobilePanel;
