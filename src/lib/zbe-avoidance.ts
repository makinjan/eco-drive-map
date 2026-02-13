import { zbeZones } from '@/data/zbe-zones';
import * as turf from '@turf/turf';

export interface SafePoint {
  coordinates: { lat: number; lng: number };
  zoneName: string;
  distanceMeters: number;
}

/**
 * Check if a point is inside any blocked ZBE zone.
 */
export function getPointInZBE(
  point: { lat: number; lng: number },
  userTag: string
): string | null {
  const now = new Date().toISOString().split('T')[0];
  const pt = turf.point([point.lng, point.lat]);

  for (const feature of zbeZones.features) {
    const props = feature.properties;
    if (now < props.valid_from || now > props.valid_to) continue;
    if (props.allowed_tags.includes(userTag)) continue;

    const polygon = turf.polygon(feature.geometry.coordinates);
    if (turf.booleanPointInPolygon(pt, polygon)) {
      return props.name;
    }
  }
  return null;
}

/**
 * If a point is inside a blocked ZBE, find the nearest point just outside
 * the zone boundary (~200m outside).
 */
export function getNearestPointOutsideZBE(
  point: { lat: number; lng: number },
  userTag: string
): SafePoint | null {
  const now = new Date().toISOString().split('T')[0];
  const pt = turf.point([point.lng, point.lat]);

  for (const feature of zbeZones.features) {
    const props = feature.properties;
    if (now < props.valid_from || now > props.valid_to) continue;
    if (props.allowed_tags.includes(userTag)) continue;

    const polygon = turf.polygon(feature.geometry.coordinates);
    if (!turf.booleanPointInPolygon(pt, polygon)) continue;

    // Find nearest point on polygon boundary
    const boundary = turf.polygonToLine(polygon);
    const nearest = turf.nearestPointOnLine(boundary as any, pt);
    const nearestCoord = nearest.geometry.coordinates;

    // Move 200m further away from polygon centroid
    const centroid = turf.centroid(polygon);
    const bearing = turf.bearing(centroid, turf.point(nearestCoord));
    const safePoint = turf.destination(turf.point(nearestCoord), 0.2, bearing, { units: 'kilometers' });

    const distanceM = turf.distance(pt, safePoint, { units: 'meters' });

    return {
      coordinates: {
        lat: safePoint.geometry.coordinates[1],
        lng: safePoint.geometry.coordinates[0],
      },
      zoneName: props.name,
      distanceMeters: Math.round(distanceM),
    };
  }
  return null;
}

/**
 * For each blocked ZBE zone, compute waypoints that force the route
 * to go around the zone polygon.
 */
export function getAvoidanceWaypoints(
  blockedZoneIds: string[],
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number }
): google.maps.LatLngLiteral[] {
  const waypoints: google.maps.LatLngLiteral[] = [];

  for (const feature of zbeZones.features) {
    if (!blockedZoneIds.includes(feature.properties.id)) continue;

    const bbox = turf.bbox(turf.polygon(feature.geometry.coordinates));
    const centerLat = (bbox[1] + bbox[3]) / 2;
    const lngSpan = bbox[2] - bbox[0];
    const latSpan = bbox[3] - bbox[1];
    const margin = Math.max(lngSpan, latSpan) * 0.8 + 0.02;

    const midLng = (bbox[0] + bbox[2]) / 2;
    const originEast = origin.lng > midLng;
    const destEast = destination.lng > midLng;

    if (originEast && destEast) {
      waypoints.push({ lat: centerLat, lng: bbox[2] + margin });
    } else if (!originEast && !destEast) {
      waypoints.push({ lat: centerLat, lng: bbox[0] - margin });
    } else {
      const avgLat = (origin.lat + destination.lat) / 2;
      if (avgLat > centerLat) {
        waypoints.push({ lat: bbox[3] + margin, lng: midLng });
      } else {
        waypoints.push({ lat: bbox[1] - margin, lng: midLng });
      }
    }
  }

  return waypoints;
}
