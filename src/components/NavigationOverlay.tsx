import { Navigation, X, Locate } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NavigationOverlayProps {
  distanceRemaining: number | null;
  timeRemaining: number | null;
  speed: number | null;
  progressPercent: number;
  error: string | null;
  onStop: () => void;
}

const NavigationOverlay = ({
  distanceRemaining,
  timeRemaining,
  speed,
  progressPercent,
  error,
  onStop,
}: NavigationOverlayProps) => {
  const formatDistance = (meters: number) => {
    if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
    return `${Math.round(meters)} m`;
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h} h ${m} min`;
    return `${m} min`;
  };

  const formatSpeed = (ms: number) => {
    return `${Math.round(ms * 3.6)} km/h`;
  };

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 w-[90%] max-w-[400px]">
      <div className="glass-panel rounded-2xl overflow-hidden">
        {/* Progress bar */}
        <div className="h-1 bg-muted">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="p-4">
          {error ? (
            <div className="flex items-center justify-between">
              <p className="text-sm text-destructive font-medium">{error}</p>
              <Button variant="ghost" size="icon" onClick={onStop} className="shrink-0">
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <>
              {/* Main info row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/15">
                    <Navigation className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-foreground leading-tight">
                      {distanceRemaining != null ? formatDistance(distanceRemaining) : '—'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {timeRemaining != null ? `${formatTime(timeRemaining)} restantes` : 'Calculando...'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {speed != null && speed > 0 && (
                    <div className="text-right mr-2">
                      <p className="text-sm font-bold text-foreground">{formatSpeed(speed)}</p>
                      <p className="text-[10px] text-muted-foreground">Velocidad</p>
                    </div>
                  )}
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={onStop}
                    className="rounded-lg font-medium"
                  >
                    <X className="mr-1 h-3.5 w-3.5" />
                    Parar
                  </Button>
                </div>
              </div>

              {/* Waiting for GPS */}
              {distanceRemaining == null && (
                <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                  <Locate className="h-3.5 w-3.5 animate-pulse" />
                  Obteniendo señal GPS...
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default NavigationOverlay;
