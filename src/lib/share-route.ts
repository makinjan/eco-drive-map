import { toast } from 'sonner';

interface ShareParams {
  originName?: string;
  originLat?: number;
  originLng?: number;
  destName?: string;
  destLat?: number;
  destLng?: number;
  tag?: string;
  waypointNames?: string[];
  waypointCoords?: { lat: number; lng: number }[];
}

export function buildShareURL(params: ShareParams): string {
  const url = new URL(window.location.origin);
  if (params.originName) url.searchParams.set('on', params.originName);
  if (params.originLat != null) url.searchParams.set('olat', params.originLat.toFixed(6));
  if (params.originLng != null) url.searchParams.set('olng', params.originLng.toFixed(6));
  if (params.destName) url.searchParams.set('dn', params.destName);
  if (params.destLat != null) url.searchParams.set('dlat', params.destLat.toFixed(6));
  if (params.destLng != null) url.searchParams.set('dlng', params.destLng.toFixed(6));
  if (params.tag) url.searchParams.set('tag', params.tag);
  if (params.waypointNames?.length) {
    url.searchParams.set('wn', params.waypointNames.filter(Boolean).join('|'));
  }
  if (params.waypointCoords?.length) {
    url.searchParams.set('wc', params.waypointCoords.map(c => `${c.lat.toFixed(6)},${c.lng.toFixed(6)}`).join('|'));
  }
  return url.toString();
}

export interface ParsedShareParams {
  originName?: string;
  originCoords?: { lat: number; lng: number };
  destName?: string;
  destCoords?: { lat: number; lng: number };
  tag?: string;
  waypointNames?: string[];
  waypointCoords?: { lat: number; lng: number }[];
}

export function parseShareURL(): ParsedShareParams | null {
  const params = new URLSearchParams(window.location.search);
  if (!params.has('dlat') && !params.has('dn')) return null;

  const result: ParsedShareParams = {};
  if (params.has('on')) result.originName = params.get('on')!;
  if (params.has('olat') && params.has('olng')) {
    result.originCoords = { lat: parseFloat(params.get('olat')!), lng: parseFloat(params.get('olng')!) };
  }
  if (params.has('dn')) result.destName = params.get('dn')!;
  if (params.has('dlat') && params.has('dlng')) {
    result.destCoords = { lat: parseFloat(params.get('dlat')!), lng: parseFloat(params.get('dlng')!) };
  }
  if (params.has('tag')) result.tag = params.get('tag')!;
  if (params.has('wn')) result.waypointNames = params.get('wn')!.split('|');
  if (params.has('wc')) {
    result.waypointCoords = params.get('wc')!.split('|').map(c => {
      const [lat, lng] = c.split(',').map(Number);
      return { lat, lng };
    });
  }
  return result;
}

export async function shareRoute(params: ShareParams) {
  const url = buildShareURL(params);
  const title = params.destName
    ? `Ruta a ${params.destName} — ZBE Navigator`
    : 'Ruta — ZBE Navigator';

  if (navigator.share) {
    try {
      await navigator.share({ title, url });
      return;
    } catch (e) {
      // User cancelled or not supported, fall through to clipboard
    }
  }

  try {
    await navigator.clipboard.writeText(url);
    toast.success('📋 Enlace copiado al portapapeles');
  } catch {
    // Fallback: show URL in a prompt
    prompt('Copia este enlace:', url);
  }
}
