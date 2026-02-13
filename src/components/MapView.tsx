import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { MAPBOX_TOKEN, MAPBOX_STYLE, SPAIN_CENTER, INITIAL_ZOOM } from '@/lib/mapbox-config';
import { zbeZones } from '@/data/zbe-zones';
import type { Feature, LineString } from 'geojson';

interface MapViewProps {
  origin: [number, number] | null;
  destination: [number, number] | null;
  route: Feature<LineString> | null;
  routeStatus: 'idle' | 'loading' | 'valid' | 'invalid' | 'no-route';
}

const MapView = ({ origin, destination, route, routeStatus }: MapViewProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const originMarker = useRef<mapboxgl.Marker | null>(null);
  const destMarker = useRef<mapboxgl.Marker | null>(null);
  const mapLoaded = useRef(false);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: MAPBOX_STYLE,
      center: SPAIN_CENTER,
      zoom: INITIAL_ZOOM,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.current.addControl(new mapboxgl.GeolocateControl({ trackUserLocation: true }), 'top-right');

    map.current.on('load', () => {
      const m = map.current!;
      mapLoaded.current = true;

      // ZBE zones layer
      m.addSource('zbe-zones', {
        type: 'geojson',
        data: zbeZones as any,
      });

      m.addLayer({
        id: 'zbe-fill',
        type: 'fill',
        source: 'zbe-zones',
        paint: {
          'fill-color': '#ef4444',
          'fill-opacity': 0.15,
        },
      });

      m.addLayer({
        id: 'zbe-border',
        type: 'line',
        source: 'zbe-zones',
        paint: {
          'line-color': '#dc2626',
          'line-width': 2,
          'line-dasharray': [3, 2],
        },
      });

      m.addLayer({
        id: 'zbe-label',
        type: 'symbol',
        source: 'zbe-zones',
        layout: {
          'text-field': ['get', 'name'],
          'text-size': 12,
          'text-font': ['DIN Pro Medium', 'Arial Unicode MS Regular'],
        },
        paint: {
          'text-color': '#dc2626',
          'text-halo-color': '#ffffff',
          'text-halo-width': 1.5,
        },
      });

      // Route layer
      m.addSource('route', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });

      m.addLayer({
        id: 'route-line-bg',
        type: 'line',
        source: 'route',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#1a73e8',
          'line-width': 8,
          'line-opacity': 0.3,
        },
      });

      m.addLayer({
        id: 'route-line',
        type: 'line',
        source: 'route',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#4285f4',
          'line-width': 5,
          'line-opacity': 0.9,
        },
      });

      // ZBE click popup
      m.on('click', 'zbe-fill', (e) => {
        const props = e.features?.[0]?.properties;
        if (!props) return;
        const allowedTags = JSON.parse(props.allowed_tags);
        new mapboxgl.Popup({ offset: 10 })
          .setLngLat(e.lngLat)
          .setHTML(
            `<div style="padding: 12px 16px; font-family: inherit;">
              <h3 style="font-weight: 700; font-size: 14px; margin: 0 0 8px;">${props.name}</h3>
              <p style="margin: 4px 0; font-size: 12px; color: #666;"><strong>Etiquetas permitidas:</strong> ${allowedTags.join(', ')}</p>
              <p style="margin: 4px 0; font-size: 12px; color: #666;"><strong>Vigencia:</strong> ${props.valid_from} → ${props.valid_to}</p>
            </div>`
          )
          .addTo(m);
      });

      m.on('mouseenter', 'zbe-fill', () => {
        m.getCanvas().style.cursor = 'pointer';
      });
      m.on('mouseleave', 'zbe-fill', () => {
        m.getCanvas().style.cursor = '';
      });
    });

    return () => {
      map.current?.remove();
      map.current = null;
      mapLoaded.current = false;
    };
  }, []);

  // Update origin marker
  useEffect(() => {
    if (!map.current) return;
    originMarker.current?.remove();
    if (origin) {
      originMarker.current = new mapboxgl.Marker({ color: '#22c55e' })
        .setLngLat(origin)
        .addTo(map.current);
    }
  }, [origin]);

  // Update destination marker
  useEffect(() => {
    if (!map.current) return;
    destMarker.current?.remove();
    if (destination) {
      destMarker.current = new mapboxgl.Marker({ color: '#ef4444' })
        .setLngLat(destination)
        .addTo(map.current);
    }
  }, [destination]);

  // Update route
  useEffect(() => {
    if (!map.current || !mapLoaded.current) return;
    const source = map.current.getSource('route') as mapboxgl.GeoJSONSource;
    if (!source) return;

    if (route) {
      source.setData({
        type: 'FeatureCollection',
        features: [route],
      });

      const color =
        routeStatus === 'valid' ? '#22c55e' :
        routeStatus === 'invalid' ? '#ef4444' :
        '#4285f4';

      map.current.setPaintProperty('route-line', 'line-color', color);
      map.current.setPaintProperty('route-line-bg', 'line-color', color);

      // Fit bounds
      const coords = route.geometry.coordinates as [number, number][];
      if (coords.length > 0) {
        const bounds = coords.reduce(
          (b, c) => b.extend(c),
          new mapboxgl.LngLatBounds(coords[0], coords[0])
        );
        map.current.fitBounds(bounds, { padding: 100, duration: 1000 });
      }
    } else {
      source.setData({ type: 'FeatureCollection', features: [] });
    }
  }, [route, routeStatus]);

  return <div ref={mapContainer} className="w-full h-full" />;
};

export default MapView;
