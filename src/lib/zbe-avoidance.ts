import { zbeZones } from '@/data/zbe-zones';
import * as turf from '@turf/turf';

export interface SafePoint {
  coordinates: { lat: number; lng: number };
  zoneId: string;
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
      zoneId: props.id,
      zoneName: props.name,
      distanceMeters: Math.round(distanceM),
    };
  }
  return null;
}

/**
 * For each blocked ZBE zone, compute a waypoint just outside the zone
 * on the side closest to the straight line between origin and destination.
 * Uses a tight 300m margin to keep routes optimal.
 */
export function getAvoidanceWaypoints(
  blockedZoneIds: string[],
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number }
): google.maps.LatLngLiteral[] {
  const waypoints: google.maps.LatLngLiteral[] = [];
  const originPt = turf.point([origin.lng, origin.lat]);
  const destPt = turf.point([destination.lng, destination.lat]);
  // Use the full OD line instead of just the midpoint
  const odLine = turf.lineString([
    [origin.lng, origin.lat],
    [destination.lng, destination.lat],
  ]);

  for (const feature of zbeZones.features) {
    if (!blockedZoneIds.includes(feature.properties.id)) continue;

    const polygon = turf.polygon(feature.geometry.coordinates);
    const boundary = turf.polygonToLine(polygon);
    const centroid = turf.centroid(polygon);

    // Find the nearest point on the polygon boundary to the OD line
    // Sample multiple points along the OD line and pick the closest boundary point
    const numSamples = 10;
    let bestDist = Infinity;
    let bestBoundaryPt: ReturnType<typeof turf.nearestPointOnLine> | null = null;

    for (let i = 0; i <= numSamples; i++) {
      const fraction = i / numSamples;
      const samplePt = turf.along(odLine, turf.length(odLine) * fraction);
      const nearest = turf.nearestPointOnLine(boundary as any, samplePt);
      const dist = turf.distance(samplePt, nearest);
      if (dist < bestDist) {
        bestDist = dist;
        bestBoundaryPt = nearest;
      }
    }

    if (!bestBoundaryPt) continue;

    const nearestCoord = bestBoundaryPt.geometry.coordinates;

    // Push 300m outward from the polygon centroid
    const bearing = turf.bearing(centroid, turf.point(nearestCoord));
    const safeWp = turf.destination(turf.point(nearestCoord), 0.3, bearing, { units: 'kilometers' });

    waypoints.push({
      lat: safeWp.geometry.coordinates[1],
      lng: safeWp.geometry.coordinates[0],
    });
  }

  return waypoints;
}
