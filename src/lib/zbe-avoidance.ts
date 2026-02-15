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

    // Move 400m further away from polygon centroid for better road clearance
    const centroid = turf.centroid(polygon);
    const bearing = turf.bearing(centroid, turf.point(nearestCoord));
    const safePoint = turf.destination(turf.point(nearestCoord), 0.4, bearing, { units: 'kilometers' });

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
 * For each blocked ZBE zone, compute waypoints just outside the zone
 * to guide Google Maps around it. Large zones get multiple waypoints
 * distributed along the boundary for effective avoidance.
 */
export function getAvoidanceWaypoints(
  blockedZoneIds: string[],
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number }
): google.maps.LatLngLiteral[] {
  const waypoints: google.maps.LatLngLiteral[] = [];
  const originPt = turf.point([origin.lng, origin.lat]);
  const destPt = turf.point([destination.lng, destination.lat]);
  const odLine = turf.lineString([
    [origin.lng, origin.lat],
    [destination.lng, destination.lat],
  ]);

  for (const feature of zbeZones.features) {
    if (!blockedZoneIds.includes(feature.properties.id)) continue;

    const polygon = turf.polygon(feature.geometry.coordinates);
    const boundary = turf.polygonToLine(polygon);
    const centroid = turf.centroid(polygon);
    const zoneArea = turf.area(polygon); // m²

    // Determine how many waypoints based on zone size
    // Small zones (<10 km²): 1 waypoint, medium (<100 km²): 2, large: 3
    const numWaypoints = zoneArea < 10_000_000 ? 1 : zoneArea < 100_000_000 ? 2 : 3;
    const margin = zoneArea < 10_000_000 ? 0.4 : 0.8; // km offset from boundary

    // Find intersection points of OD line with the zone boundary
    // to place waypoints where the route would enter/exit the zone
    const boundaryLine = boundary as any;
    
    // Sample many points along the OD line, find closest boundary points
    const numSamples = 20;
    const candidatePoints: { point: ReturnType<typeof turf.nearestPointOnLine>; dist: number }[] = [];

    for (let i = 0; i <= numSamples; i++) {
      const fraction = i / numSamples;
      const samplePt = turf.along(odLine, turf.length(odLine) * fraction);
      // Only consider sample points near the zone
      const distToZone = turf.distance(samplePt, centroid);
      const zoneRadiusKm = Math.sqrt(zoneArea / Math.PI) / 1000;
      if (distToZone > zoneRadiusKm * 3) continue;

      const nearest = turf.nearestPointOnLine(boundaryLine, samplePt);
      candidatePoints.push({ point: nearest, dist: turf.distance(samplePt, nearest) });
    }

    if (candidatePoints.length === 0) {
      // Fallback: use centroid-based approach
      const nearest = turf.nearestPointOnLine(boundaryLine, originPt);
      candidatePoints.push({ point: nearest, dist: turf.distance(originPt, nearest) });
    }

    // Sort by distance (closest first) and pick the best entry/exit points
    candidatePoints.sort((a, b) => a.dist - b.dist);

    // Determine which side of the zone to route around
    // Use the perpendicular direction from the OD line at the zone center
    const odBearing = turf.bearing(originPt, destPt);
    const centroidCoord = centroid.geometry.coordinates;

    // Try both sides (left and right of OD line) and pick the shorter detour
    const leftBearing = odBearing - 90;
    const rightBearing = odBearing + 90;
    const leftTestPt = turf.destination(centroid, margin, leftBearing, { units: 'kilometers' });
    const rightTestPt = turf.destination(centroid, margin, rightBearing, { units: 'kilometers' });
    const leftInZone = turf.booleanPointInPolygon(leftTestPt, polygon);
    const rightInZone = turf.booleanPointInPolygon(rightTestPt, polygon);

    // Prefer the side that's outside the zone; if both outside, pick closer to OD line
    let preferredSide: 'left' | 'right' = 'right';
    if (leftInZone && !rightInZone) preferredSide = 'right';
    else if (!leftInZone && rightInZone) preferredSide = 'left';
    else {
      // Both outside or both inside — pick side closer to OD endpoints
      const leftDist = turf.distance(leftTestPt, originPt) + turf.distance(leftTestPt, destPt);
      const rightDist = turf.distance(rightTestPt, originPt) + turf.distance(rightTestPt, destPt);
      preferredSide = leftDist < rightDist ? 'left' : 'right';
    }

    // Generate waypoints along the boundary on the preferred side
    const selectedPoints: google.maps.LatLngLiteral[] = [];
    const usedPositions = new Set<string>();

    // For large zones, distribute waypoints: entry, middle, exit
    const fractions = numWaypoints === 1 ? [0.5] :
      numWaypoints === 2 ? [0.3, 0.7] : [0.2, 0.5, 0.8];

    for (const frac of fractions) {
      // Sample along the boundary on the preferred side
      const alongDist = turf.length(boundaryLine) * frac;
      const boundaryPt = turf.along(boundaryLine, alongDist);
      const bCoord = boundaryPt.geometry.coordinates;

      // Push outward from centroid
      const bearing = turf.bearing(centroid, boundaryPt);
      
      // Check if this side matches preferred side
      const perpAngle = bearing - odBearing;
      const isPreferredSide = preferredSide === 'right'
        ? (perpAngle > 0 && perpAngle < 180) || perpAngle < -180
        : (perpAngle < 0 && perpAngle > -180) || perpAngle > 180;

      if (!isPreferredSide && numWaypoints > 1) continue;

      const safeWp = turf.destination(boundaryPt, margin, bearing, { units: 'kilometers' });
      const key = `${safeWp.geometry.coordinates[1].toFixed(4)},${safeWp.geometry.coordinates[0].toFixed(4)}`;

      if (!usedPositions.has(key)) {
        usedPositions.add(key);
        selectedPoints.push({
          lat: safeWp.geometry.coordinates[1],
          lng: safeWp.geometry.coordinates[0],
        });
      }
    }

    // If preferred-side filtering left us with too few, fall back to closest boundary points
    if (selectedPoints.length < numWaypoints) {
      for (const cp of candidatePoints) {
        if (selectedPoints.length >= numWaypoints) break;
        const coord = cp.point.geometry.coordinates;
        const bearing = turf.bearing(centroid, turf.point(coord));
        const safeWp = turf.destination(turf.point(coord), margin, bearing, { units: 'kilometers' });
        const key = `${safeWp.geometry.coordinates[1].toFixed(4)},${safeWp.geometry.coordinates[0].toFixed(4)}`;
        if (!usedPositions.has(key)) {
          usedPositions.add(key);
          selectedPoints.push({
            lat: safeWp.geometry.coordinates[1],
            lng: safeWp.geometry.coordinates[0],
          });
        }
      }
    }

    waypoints.push(...selectedPoints);
  }

  return waypoints;
}
