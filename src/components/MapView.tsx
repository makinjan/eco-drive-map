import { useCallback, useRef, useEffect, useState } from 'react';
import { GoogleMap, Polygon, Marker, Polyline, InfoWindow } from '@react-google-maps/api';
import { SPAIN_CENTER, INITIAL_ZOOM, MAP_OPTIONS } from '@/lib/google-maps-config';
import { zbeZones, type ZBEProperties } from '@/data/zbe-zones';

interface MapViewProps {
  origin: { lat: number; lng: number } | null;
  destination: { lat: number; lng: number } | null;
  routePath: { lat: number; lng: number }[];
  routeStatus: 'idle' | 'loading' | 'valid' | 'invalid' | 'no-route';
  altRoutePath: { lat: number; lng: number }[] | null;
  isNavigating?: boolean;
  userPosition?: { lat: number; lng: number } | null;
  heading?: number | null;
}

const MapView = ({ origin, destination, routePath, routeStatus, altRoutePath, isNavigating, userPosition, heading }: MapViewProps) => {
  const mapRef = useRef<google.maps.Map | null>(null);
  const [selectedZone, setSelectedZone] = useState<{
    position: google.maps.LatLngLiteral;
    props: ZBEProperties;
  } | null>(null);

  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  // Fit bounds to route
  useEffect(() => {
    if (!mapRef.current || routePath.length === 0) return;
    if (isNavigating) return; // Don't fit bounds during navigation
    const bounds = new google.maps.LatLngBounds();
    routePath.forEach((p) => bounds.extend(p));
    if (altRoutePath) altRoutePath.forEach((p) => bounds.extend(p));
    if (origin) bounds.extend(origin);
    if (destination) bounds.extend(destination);
    mapRef.current.fitBounds(bounds, 100);
  }, [routePath, origin, destination, altRoutePath, isNavigating]);

  // Center on user during navigation
  useEffect(() => {
    if (!mapRef.current || !isNavigating || !userPosition) return;
    mapRef.current.panTo(userPosition);
    if (mapRef.current.getZoom()! < 15) {
      mapRef.current.setZoom(16);
    }
  }, [isNavigating, userPosition]);

  const routeColor =
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
                ZBEDEP — Especial Protección
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

      {/* Alternative route (shown behind main route, dashed green) */}
      {altRoutePath && altRoutePath.length > 0 && (
        <>
          <Polyline
            path={altRoutePath}
            options={{
              strokeColor: '#22c55e',
              strokeOpacity: 0.25,
              strokeWeight: 8,
            }}
          />
          <Polyline
            path={altRoutePath}
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

      {/* Main route */}
      {routePath.length > 0 && (
        <>
          <Polyline
            path={routePath}
            options={{
              strokeColor: routeColor,
              strokeOpacity: 0.3,
              strokeWeight: 8,
            }}
          />
          <Polyline
            path={routePath}
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
    </GoogleMap>
  );
};

export default MapView;
