import { useState, useCallback, useEffect } from 'react';

export interface SavedPlace {
  name: string;
  coordinates: { lat: number; lng: number };
}

export interface RouteHistoryEntry {
  id: string;
  origin: SavedPlace;
  destination: SavedPlace;
  timestamp: number;
  tag: string;
}

const HISTORY_KEY = 'zbe-route-history';
const FAVORITES_KEY = 'zbe-favorites';
const MAX_HISTORY = 15;

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, data: T) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {}
}

export function useRouteHistory() {
  const [history, setHistory] = useState<RouteHistoryEntry[]>(() =>
    loadFromStorage(HISTORY_KEY, [])
  );

  const addToHistory = useCallback((origin: SavedPlace, destination: SavedPlace, tag: string) => {
    setHistory((prev) => {
      // Avoid duplicates (same origin+dest within last 5 min)
      const isDuplicate = prev.some(
        (e) =>
          e.destination.name === destination.name &&
          e.origin.name === origin.name &&
          Date.now() - e.timestamp < 300000
      );
      if (isDuplicate) return prev;

      const entry: RouteHistoryEntry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        origin,
        destination,
        timestamp: Date.now(),
        tag,
      };
      const updated = [entry, ...prev].slice(0, MAX_HISTORY);
      saveToStorage(HISTORY_KEY, updated);
      return updated;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem(HISTORY_KEY);
  }, []);

  return { history, addToHistory, clearHistory };
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<SavedPlace[]>(() =>
    loadFromStorage(FAVORITES_KEY, [])
  );

  const addFavorite = useCallback((place: SavedPlace) => {
    setFavorites((prev) => {
      if (prev.some((f) => f.name === place.name)) return prev;
      const updated = [...prev, place];
      saveToStorage(FAVORITES_KEY, updated);
      return updated;
    });
  }, []);

  const removeFavorite = useCallback((name: string) => {
    setFavorites((prev) => {
      const updated = prev.filter((f) => f.name !== name);
      saveToStorage(FAVORITES_KEY, updated);
      return updated;
    });
  }, []);

  const isFavorite = useCallback(
    (name: string) => favorites.some((f) => f.name === name),
    [favorites]
  );

  return { favorites, addFavorite, removeFavorite, isFavorite };
}
