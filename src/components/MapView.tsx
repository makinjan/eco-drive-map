import { useCallback, useRef, useEffect } from 'react';
import { GoogleMap, Polygon, Marker, Polyline, InfoWindow } from '@react-google-maps/api';
import { SPAIN_CENTER, INITIAL_ZOOM, MAP_OPTIONS } from '@/lib/google-maps-config';
import { zbeZones, type ZBEProperties } from '@/data/zbe-zones';
import { useState } from 'react';

interface MapViewProps {
  origin: { lat: number; lng: number } | null;
  destination: { lat: number; lng: number } | null;
  routePath: { lat: number; lng: number }[];
  routeStatus: 'idle' | 'loading' | 'valid' | 'invalid' | 'no-route';
}

const MapView = ({ origin, destination, routePath, routeStatus }: MapViewProps) => {
  const mapRef = useRef<google.maps.Map | null>(null);
  const [selectedZone, setSelectedZone] = useState<{
    position: google.maps.LatLngLiteral;
    props: ZBEProperties;
  } | null>(null);

  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  // Fit bounds when route changes
  useEffect(() => {
    if (!mapRef.current || routePath.length === 0) return;
    const bounds = new google.maps.LatLngBounds();
    routePath.forEach((p) => bounds.extend(p));
    if (origin) bounds.extend(origin);
    if (destination) bounds.extend(destination);
    mapRef.current.fitBounds(bounds, 100);
  }, [routePath, origin, destination]);

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
        const coords = feature.geometry.coordinates[0].map(([lng, lat]) => ({
          lat,
          lng,
        }));
        return (
          <Polygon
            key={feature.properties.id}
            paths={coords}
            options={{
              fillColor: '#ef4444',
              fillOpacity: 0.15,
              strokeColor: '#dc2626',
              strokeWeight: 2,
              strokeOpacity: 0.8,
              clickable: true,
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

      {/* ZBE InfoWindow */}
      {selectedZone && (
        <InfoWindow
          position={selectedZone.position}
          onCloseClick={() => setSelectedZone(null)}
        >
          <div style={{ padding: '8px 4px', fontFamily: 'inherit' }}>
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

      {/* Origin marker */}
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

      {/* Destination marker */}
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

      {/* Route line */}
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
    </GoogleMap>
  );
};

export default MapView;
