import { Navigation, X, Locate, Volume2, VolumeX, ArrowUp, ArrowLeft, ArrowRight, CornerUpRight, CornerUpLeft } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { NavigationStep } from '@/hooks/use-navigation';

interface NavigationOverlayProps {
  distanceRemaining: number | null;
  timeRemaining: number | null;
  speed: number | null;
  progressPercent: number;
  error: string | null;
  onStop: () => void;
  currentStep: NavigationStep | null;
  nextStep: NavigationStep | null;
  distanceToNextStep: number | null;
}

const ManeuverIcon = ({ maneuver }: { maneuver?: string }) => {
  const cls = "h-6 w-6";
  if (!maneuver) return <ArrowUp className={cls} />;
  if (maneuver.includes('left')) return <ArrowLeft className={cls} />;
  if (maneuver.includes('right')) return <ArrowRight className={cls} />;
  if (maneuver.includes('ramp-right') || maneuver.includes('fork-right')) return <CornerUpRight className={cls} />;
  if (maneuver.includes('ramp-left') || maneuver.includes('fork-left')) return <CornerUpLeft className={cls} />;
  return <ArrowUp className={cls} />;
};

const NavigationOverlay = ({
  distanceRemaining,
  timeRemaining,
  speed,
  progressPercent,
  error,
  onStop,
  currentStep,
  nextStep,
  distanceToNextStep,
}: NavigationOverlayProps) => {
  const [muted, setMuted] = useState(false);

  const toggleMute = () => {
    setMuted(!muted);
    if (!muted && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

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
    return `${Math.round(ms * 3.6)}`;
  };

  return (
    <>
      {/* Top instruction banner */}
      <div className="absolute top-0 left-0 right-0 z-20">
        {/* Current step instruction */}
        {currentStep && (
          <div className="bg-[#1a73e8] text-white">
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="shrink-0">
                <ManeuverIcon maneuver={currentStep.maneuver} />
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className="text-sm font-semibold leading-snug"
                  dangerouslySetInnerHTML={{ __html: currentStep.instruction }}
                />
                {distanceToNextStep != null && (
                  <p className="text-xs text-white/80 mt-0.5">
                    {formatDistance(distanceToNextStep)}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMute}
                className="shrink-0 text-white hover:bg-white/20 h-8 w-8"
              >
                {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
            </div>

            {/* Next step preview */}
            {nextStep && (
              <div className="flex items-center gap-2 px-4 py-2 bg-[#1557b0] text-white/90 border-t border-white/15">
                <ManeuverIcon maneuver={nextStep.maneuver} />
                <p className="text-xs truncate flex-1"
                  dangerouslySetInnerHTML={{ __html: nextStep.instruction }}
                />
                <span className="text-xs text-white/70 shrink-0">{formatDistance(nextStep.distance)}</span>
              </div>
            )}
          </div>
        )}

        {/* GPS waiting */}
        {!currentStep && !error && (
          <div className="bg-[#1a73e8] text-white px-4 py-3 flex items-center gap-2">
            <Locate className="h-5 w-5 animate-pulse" />
            <span className="text-sm font-medium">Obteniendo señal GPS...</span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-destructive text-destructive-foreground px-4 py-3 flex items-center justify-between">
            <p className="text-sm font-medium">{error}</p>
            <Button variant="ghost" size="icon" onClick={onStop} className="shrink-0 h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Bottom bar - ETA, distance, speed */}
      <div className="absolute bottom-0 left-0 right-0 z-20">
        {/* Progress bar */}
        <div className="h-1 bg-muted/40">
          <div
            className="h-full bg-[#1a73e8] transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="glass-panel-mobile px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Time & distance */}
            <div className="flex items-center gap-4">
              <div>
                <p className="text-lg font-bold text-foreground leading-tight">
                  {timeRemaining != null ? formatTime(timeRemaining) : '—'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {distanceRemaining != null ? formatDistance(distanceRemaining) : '—'}
                </p>
              </div>
              {speed != null && speed > 0 && (
                <div className="flex items-center gap-1 px-2.5 py-1.5 bg-muted/60 rounded-lg">
                  <span className="text-sm font-bold text-foreground">{formatSpeed(speed)}</span>
                  <span className="text-[10px] text-muted-foreground">km/h</span>
                </div>
              )}
            </div>

            {/* Stop button */}
            <Button
              variant="destructive"
              size="sm"
              onClick={onStop}
              className="rounded-lg font-semibold px-4"
            >
              <X className="mr-1.5 h-3.5 w-3.5" />
              Parar
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default NavigationOverlay;
