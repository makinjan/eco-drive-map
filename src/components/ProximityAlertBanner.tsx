import { AlertTriangle, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProximityAlert {
  zoneName: string;
  distanceKm: number;
}

interface ProximityAlertBannerProps {
  nearbyZones: ProximityAlert[];
  error: string | null;
}

const ProximityAlertBanner = ({ nearbyZones, error }: ProximityAlertBannerProps) => {
  if (error) {
    return (
      <div className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl bg-destructive/8 border border-destructive/20 text-xs">
        <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0" />
        <span className="text-destructive/80 flex-1">{error}</span>
      </div>
    );
  }

  if (nearbyZones.length === 0) {
    return null;
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
    </div>
  );
};

export default ProximityAlertBanner;
