import { Clock, Star, StarOff, Trash2, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { SavedPlace, RouteHistoryEntry } from '@/hooks/use-route-history';

interface HistoryFavoritesPanelProps {
  history: RouteHistoryEntry[];
  favorites: SavedPlace[];
  onSelectRoute: (origin: SavedPlace, destination: SavedPlace) => void;
  onSelectDestination: (place: SavedPlace) => void;
  onAddFavorite: (place: SavedPlace) => void;
  onRemoveFavorite: (name: string) => void;
  isFavorite: (name: string) => boolean;
  onClearHistory: () => void;
}

const timeAgo = (timestamp: number) => {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Ahora';
  if (mins < 60) return `Hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Hace ${hours} h`;
  const days = Math.floor(hours / 24);
  return `Hace ${days} d`;
};

const HistoryFavoritesPanel = ({
  history,
  favorites,
  onSelectRoute,
  onSelectDestination,
  onAddFavorite,
  onRemoveFavorite,
  isFavorite,
  onClearHistory,
}: HistoryFavoritesPanelProps) => {
  if (favorites.length === 0 && history.length === 0) return null;

  return (
    <div className="space-y-3">
      {/* Favorites */}
      {favorites.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
            <Star className="h-3 w-3" />
            Favoritos
          </p>
          <div className="space-y-1">
            {favorites.map((fav) => (
              <div
                key={fav.name}
                className="flex items-center gap-2 rounded-lg px-2.5 py-2 hover:bg-muted/60 cursor-pointer transition-colors group"
                onClick={() => onSelectDestination(fav)}
              >
                <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                <span className="text-xs text-foreground truncate flex-1">{fav.name}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveFavorite(fav.name);
                  }}
                >
                  <StarOff className="h-3 w-3 text-muted-foreground" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Recientes
            </p>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5"
              onClick={onClearHistory}
              title="Borrar historial"
            >
              <Trash2 className="h-3 w-3 text-muted-foreground" />
            </Button>
          </div>
          <div className="space-y-1">
            {history.slice(0, 5).map((entry) => (
              <div
                key={entry.id}
                className="flex items-center gap-2 rounded-lg px-2.5 py-2 hover:bg-muted/60 cursor-pointer transition-colors group"
                onClick={() => onSelectRoute(entry.origin, entry.destination)}
              >
                <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                  <span className="text-xs text-foreground truncate">
                    {entry.destination.name}
                  </span>
                  <span className="text-[10px] text-muted-foreground truncate">
                    Desde {entry.origin.name}
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-[10px] text-muted-foreground">{timeAgo(entry.timestamp)}</span>
                  {!isFavorite(entry.destination.name) && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddFavorite(entry.destination);
                      }}
                      title="Añadir a favoritos"
                    >
                      <Star className="h-3 w-3 text-muted-foreground" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryFavoritesPanel;
