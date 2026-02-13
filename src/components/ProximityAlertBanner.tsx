import { Radar, AlertTriangle, MapPin, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProximityAlert {
  zoneName: string;
  distanceKm: number;
}

interface ProximityAlertBannerProps {
  nearbyZones: ProximityAlert[];
  enabled: boolean;
  onToggle: () => void;
  error: string | null;
}

const ProximityAlertBanner = ({ nearbyZones, enabled, onToggle, error }: ProximityAlertBannerProps) => {
  if (!enabled && nearbyZones.length === 0) {
    return (
      <button
        onClick={onToggle}
        className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl bg-muted/50 border border-border/60 text-xs text-muted-foreground hover:bg-muted/80 transition-colors"
      >
        <Radar className="h-3.5 w-3.5" />
        <span className="font-medium">Activar alerta de proximidad ZBE</span>
      </button>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl bg-destructive/8 border border-destructive/20 text-xs">
        <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0" />
        <span className="text-destructive/80 flex-1">{error}</span>
        <button onClick={onToggle} className="text-muted-foreground hover:text-foreground">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  if (enabled && nearbyZones.length === 0) {
    return (
      <div className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl bg-route-valid/8 border border-route-valid/20 text-xs">
        <div className="relative">
          <Radar className="h-3.5 w-3.5 text-route-valid" />
          <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-route-valid rounded-full animate-ping" />
        </div>
        <span className="text-route-valid font-medium flex-1">Monitoreando — Sin ZBE cercanas</span>
        <button onClick={onToggle} className="text-muted-foreground hover:text-foreground">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {nearbyZones.map((zone) => (
        <div
          key={zone.zoneName}
          className={cn(
            'flex items-center gap-2 w-full px-3 py-2.5 rounded-xl text-xs animate-pulse',
            zone.distanceKm === 0
              ? 'bg-destructive/15 border border-destructive/30'
              : 'bg-alert-warning/10 border border-alert-warning/25'
          )}
        >
          <AlertTriangle
            className={cn(
              'h-4 w-4 shrink-0',
              zone.distanceKm === 0 ? 'text-destructive' : 'text-alert-warning'
            )}
          />
          <div className="flex-1">
            <span className={cn('font-semibold', zone.distanceKm === 0 ? 'text-destructive' : 'text-alert-warning')}>
              {zone.distanceKm === 0 ? '¡Dentro de ZBE!' : `ZBE a ${zone.distanceKm} km`}
            </span>
            <span className="block text-muted-foreground mt-0.5">{zone.zoneName}</span>
          </div>
        </div>
      ))}
      <button
        onClick={onToggle}
        className="w-full text-center text-[10px] text-muted-foreground hover:text-foreground py-1"
      >
        Desactivar alertas
      </button>
    </div>
  );
};

export default ProximityAlertBanner;
