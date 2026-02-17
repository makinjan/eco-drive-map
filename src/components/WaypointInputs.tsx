import { Plus, X, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SearchInput, { type PlaceResult } from './SearchInput';

interface WaypointInputsProps {
  waypoints: (PlaceResult | null)[];
  onAddWaypoint: () => void;
  onRemoveWaypoint: (index: number) => void;
  onWaypointSelect: (index: number, place: PlaceResult) => void;
  onWaypointClear: (index: number) => void;
  waypointNames: (string | undefined)[];
  maxWaypoints?: number;
}

const WaypointInputs = ({
  waypoints,
  onAddWaypoint,
  onRemoveWaypoint,
  onWaypointSelect,
  onWaypointClear,
  waypointNames,
  maxWaypoints = 5,
}: WaypointInputsProps) => {
  return (
    <div className="space-y-2">
      {waypoints.map((_, index) => (
        <div key={index} className="flex items-center gap-1.5">
          <div className="shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-primary/15 text-primary text-[10px] font-bold">
            {index + 1}
          </div>
          <div className="flex-1 min-w-0">
            <SearchInput
              placeholder={`Parada ${index + 1}`}
              onSelect={(place) => onWaypointSelect(index, place)}
              onClear={() => onWaypointClear(index)}
              icon="origin"
              externalValue={waypointNames[index]}
            />
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={() => onRemoveWaypoint(index)}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}
      {waypoints.length < maxWaypoints && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onAddWaypoint}
          className="w-full h-8 rounded-lg text-xs text-muted-foreground hover:text-foreground gap-1.5"
        >
          <Plus className="h-3.5 w-3.5" />
          Añadir parada
        </Button>
      )}
    </div>
  );
};

export default WaypointInputs;
