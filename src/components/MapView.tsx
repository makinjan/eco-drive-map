import { useCallback, useRef, useEffect, useState } from 'react';
import { GoogleMap, Polygon, Marker, Polyline, InfoWindow } from '@react-google-maps/api';
import { SPAIN_CENTER, INITIAL_ZOOM, MAP_OPTIONS } from '@/lib/google-maps-config';
import { zbeZones, type ZBEProperties } from '@/data/zbe-zones';
import { radaresSpain } from '@/data/radares-spain';
import * as turf from '@turf/turf';
import { Map, Satellite } from 'lucide-react';

export interface RoutePOI {
  id: string;
  name: string;
  position: { lat: number; lng: number };
  type: 'gas_station' | 'rest_stop' | 'parking';
  vicinity?: string;
}

interface MapViewProps {
  origin: { lat: number; lng: number } | null;
  destination: { lat: number; lng: number } | null;
  routePath: { lat: number; lng: number }[];
  routeStatus: 'idle' | 'loading' | 'valid' | 'invalid' | 'no-route';
  altRoutePath: { lat: number; lng: number }[] | null;
  isNavigating?: boolean;
  userPosition?: { lat: number; lng: number } | null;
  heading?: number | null;
  pois?: RoutePOI[];
  showTraffic?: boolean;
}

const ANIMATION_STEP_MS = 8;
const POINTS_PER_FRAME = 15;

const MapView = ({ origin, destination, routePath, routeStatus, altRoutePath, isNavigating, userPosition, heading, pois = [], showTraffic = true }: MapViewProps) => {
  const mapRef = useRef<google.maps.Map | null>(null);
  const [selectedZone, setSelectedZone] = useState<{
    position: google.maps.LatLngLiteral;
    props: ZBEProperties;
  } | null>(null);

  // Satellite toggle
  const [isSatellite, setIsSatellite] = useState(false);

  // Animated route state
  const [animatedPath, setAnimatedPath] = useState<{ lat: number; lng: number }[]>([]);
  const [animatedAltPath, setAnimatedAltPath] = useState<{ lat: number; lng: number }[]>([]);
  const animFrameRef = useRef<number | null>(null);
  const prevRouteRef = useRef<string>('');

  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  // Toggle map type
  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.setMapTypeId(isSatellite ? 'hybrid' : 'roadmap');
  }, [isSatellite]);

  // Animate route drawing
  useEffect(() => {
    if (routePath.length === 0) {
      setAnimatedPath([]);
      prevRouteRef.current = '';
      return;
    }

    const routeKey = `${routePath[0]?.lat},${routePath[0]?.lng}-${routePath[routePath.length - 1]?.lat}`;
    if (routeKey === prevRouteRef.current) {
      // Same route, skip animation
      setAnimatedPath(routePath);
      return;
    }
    prevRouteRef.current = routeKey;

    // Cancel previous animation
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

    let currentIndex = 0;
    setAnimatedPath([]);

    const animate = () => {
      currentIndex = Math.min(currentIndex + POINTS_PER_FRAME, routePath.length);
      setAnimatedPath(routePath.slice(0, currentIndex));

      if (currentIndex < routePath.length) {
        animFrameRef.current = requestAnimationFrame(animate);
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [routePath]);

  // Animate alt route
  useEffect(() => {
    if (!altRoutePath || altRoutePath.length === 0) {
      setAnimatedAltPath([]);
      return;
    }

    let currentIndex = 0;
    setAnimatedAltPath([]);
    let frame: number;

    const animate = () => {
      currentIndex = Math.min(currentIndex + POINTS_PER_FRAME, altRoutePath.length);
      setAnimatedAltPath(altRoutePath.slice(0, currentIndex));
      if (currentIndex < altRoutePath.length) {
        frame = requestAnimationFrame(animate);
      }
    };
    frame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(frame);
  }, [altRoutePath]);

  // Fit bounds to route
  useEffect(() => {
    if (!mapRef.current || routePath.length === 0) return;
    if (isNavigating) return;
    const bounds = new google.maps.LatLngBounds();
    routePath.forEach((p) => bounds.extend(p));
    if (altRoutePath) altRoutePath.forEach((p) => bounds.extend(p));
    if (origin) bounds.extend(origin);
    if (destination) bounds.extend(destination);
    mapRef.current.fitBounds(bounds, 100);
  }, [routePath, origin, destination, altRoutePath, isNavigating]);

  // Zoom in when navigation starts / reset when it stops
  const prevNavigating = useRef(false);
  useEffect(() => {
    if (!mapRef.current) return;
    if (isNavigating && !prevNavigating.current) {
      mapRef.current.setZoom(17);
      mapRef.current.setTilt(45);
      if (userPosition) mapRef.current.panTo(userPosition);
      else if (origin) mapRef.current.panTo(origin);
    }
    if (!isNavigating && prevNavigating.current) {
      mapRef.current.setHeading(0);
      mapRef.current.setTilt(0);
    }
    prevNavigating.current = !!isNavigating;
  }, [isNavigating]);

  // Center on user and rotate map during navigation
  useEffect(() => {
    if (!mapRef.current || !isNavigating || !userPosition) return;
    mapRef.current.panTo(userPosition);
    if (mapRef.current.getZoom()! < 16) {
      mapRef.current.setZoom(17);
    }
    if (heading != null) {
      mapRef.current.setHeading(heading);
      mapRef.current.setTilt(45);
    }
  }, [isNavigating, userPosition, heading]);

  const routeColor =
    isNavigating ? '#4285f4' :
    routeStatus === 'valid' ? '#22c55e' :
    routeStatus === 'invalid' ? '#ef4444' :
    '#4285f4';

  return (
    <GoogleMap
      mapContainerClassName="w-full h-full"
      center={SPAIN_CENTER}
      zoom={INITIAL_ZOOM}
      options={MAP_OPTIONS}
      onLoad={onLoad}
    >
      {/* Satellite / Map toggle button */}
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={() => setIsSatellite(!isSatellite)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-background/90 backdrop-blur-sm border border-border/60 shadow-lg text-xs font-medium text-foreground hover:bg-muted/80 transition-colors"
          title={isSatellite ? 'Vista mapa' : 'Vista satélite'}
        >
          {isSatellite ? <Map className="h-3.5 w-3.5" /> : <Satellite className="h-3.5 w-3.5" />}
          {isSatellite ? 'Mapa' : 'Satélite'}
        </button>
      </div>

      {/* ZBE Zones */}
      {zbeZones.features.map((feature) => {
        const coords = feature.geometry.coordinates[0].map(([lng, lat]) => ({ lat, lng }));
        const isZBEDEP = feature.properties.id.startsWith('ZBEDEP');
        return (
          <Polygon
            key={feature.properties.id}
            paths={coords}
            options={{
              fillColor: isZBEDEP ? '#7c3aed' : '#ef4444',
              fillOpacity: isZBEDEP ? 0.25 : 0.15,
              strokeColor: isZBEDEP ? '#6d28d9' : '#dc2626',
              strokeWeight: isZBEDEP ? 3 : 2,
              strokeOpacity: 0.85,
              clickable: true,
              ...(isZBEDEP && {
                strokeWeight: 3,
                icons: [{
                  icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, scale: 2 },
                  offset: '0',
                  repeat: '10px',
                }] as any,
              }),
            }}
            onClick={(e) => {
              if (e.latLng) {
                setSelectedZone({
                  position: { lat: e.latLng.lat(), lng: e.latLng.lng() },
                  props: feature.properties,
                });
              }
            }}
          />
        );
      })}

      {selectedZone && (
        <InfoWindow
          position={selectedZone.position}
          onCloseClick={() => setSelectedZone(null)}
        >
          <div style={{ padding: '8px 4px', fontFamily: 'inherit' }}>
            {selectedZone.props.id.startsWith('ZBEDEP') && (
              <span style={{
                display: 'inline-block',
                background: '#7c3aed',
                color: '#fff',
                fontSize: 10,
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: 4,
                marginBottom: 6,
              }}>
                {selectedZone.props.name.startsWith('ZBEES')
                  ? 'ZBEES — Especial Sensibilidad'
                  : 'ZBEDEP — Especial Protección'}
              </span>
            )}
            <h3 style={{ fontWeight: 700, fontSize: 14, margin: '0 0 8px' }}>
              {selectedZone.props.name}
            </h3>
            <p style={{ margin: '4px 0', fontSize: 12, color: '#666' }}>
              <strong>Etiquetas permitidas:</strong>{' '}
              {selectedZone.props.allowed_tags.join(', ')}
            </p>
            <p style={{ margin: '4px 0', fontSize: 12, color: '#666' }}>
              <strong>Vigencia:</strong> {selectedZone.props.valid_from} →{' '}
              {selectedZone.props.valid_to}
            </p>
          </div>
        </InfoWindow>
      )}

      {origin && (
        <Marker
          position={origin}
          icon={{
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#22c55e',
            fillOpacity: 1,
            strokeColor: '#fff',
            strokeWeight: 2,
          }}
        />
      )}

      {destination && (
        <Marker
          position={destination}
          icon={{
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#ef4444',
            fillOpacity: 1,
            strokeColor: '#fff',
            strokeWeight: 2,
          }}
        />
      )}

      {/* Alternative route (animated, dashed green) */}
      {animatedAltPath.length > 0 && (
        <>
          <Polyline
            path={animatedAltPath}
            options={{
              strokeColor: '#22c55e',
              strokeOpacity: 0.25,
              strokeWeight: 8,
            }}
          />
          <Polyline
            path={animatedAltPath}
            options={{
              strokeColor: '#22c55e',
              strokeOpacity: 0.7,
              strokeWeight: 4,
              icons: [{
                icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, scale: 3 },
                offset: '0',
                repeat: '15px',
              }],
            }}
          />
        </>
      )}

      {/* Main route (animated) */}
      {animatedPath.length > 0 && (
        <>
          <Polyline
            path={animatedPath}
            options={{
              strokeColor: routeColor,
              strokeOpacity: 0.3,
              strokeWeight: 8,
            }}
          />
          <Polyline
            path={animatedPath}
            options={{
              strokeColor: routeColor,
              strokeOpacity: 0.9,
              strokeWeight: 5,
            }}
          />
        </>
      )}

      {/* User position marker during navigation */}
      {isNavigating && userPosition && (
        <Marker
          position={userPosition}
          icon={{
            path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
            scale: 6,
            fillColor: '#4285f4',
            fillOpacity: 1,
            strokeColor: '#fff',
            strokeWeight: 2,
            rotation: heading ?? 0,
          }}
          zIndex={999}
        />
      )}

      {/* POIs: gas stations, service areas & parking */}
      {pois.map((poi) => (
        <Marker
          key={poi.id}
          position={poi.position}
          icon={{
            path: poi.type === 'parking'
              ? 'M -5,-7 L 5,-7 L 5,7 L -5,7 Z'
              : google.maps.SymbolPath.CIRCLE,
            scale: poi.type === 'parking' ? 1.2 : 6,
            fillColor: poi.type === 'gas_station' ? '#f59e0b' : poi.type === 'parking' ? '#3b82f6' : '#06b6d4',
            fillOpacity: 0.9,
            strokeColor: '#fff',
            strokeWeight: 2,
          }}
          title={poi.name + (poi.vicinity ? ` — ${poi.vicinity}` : '')}
        />
      ))}

      {/* Radar markers near route */}
      {routePath.length > 0 && (() => {
        try {
          const routeLine = turf.lineString(routePath.map(p => [p.lng, p.lat]));
          return radaresSpain.filter(r => {
            const dist = turf.pointToLineDistance(turf.point([r.lng, r.lat]), routeLine, { units: 'meters' });
            return dist < 3000;
          }).map(radar => (
            <Marker
              key={radar.id}
              position={{ lat: radar.lat, lng: radar.lng }}
              icon={{
                path: 'M -6,-6 L 6,-6 L 6,6 L -6,6 Z',
                scale: 1,
                fillColor: '#ef4444',
                fillOpacity: 0.95,
                strokeColor: '#fff',
                strokeWeight: 1.5,
              }}
              title={`${radar.type === 'tramo' ? 'Radar tramo' : 'Radar fijo'} — ${radar.road} km ${radar.km} — ${radar.speed_limit} km/h`}
            />
          ));
        } catch { return null; }
      })()}
    </GoogleMap>
  );
};

export default MapView;
