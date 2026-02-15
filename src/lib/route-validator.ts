import * as turf from '@turf/turf';
import { zbeZones, type ZBEProperties } from '@/data/zbe-zones';
import type { LineString, Feature, Polygon } from 'geojson';

export interface ValidationResult {
  valid: boolean;
  blockedZones: { id: string; name: string; allowedTags: string[] }[];
}

export function validateRoute(
  routeGeometry: LineString,
  userTag: string,
  excludeZoneIds?: string[]
): ValidationResult {
  const blockedZones: ValidationResult['blockedZones'] = [];
  const routeLine = turf.lineString(routeGeometry.coordinates);
  const now = new Date().toISOString().split('T')[0];

  for (const feature of zbeZones.features) {
    const props = feature.properties;

    // Skip excluded zones (already handled via safe points)
    if (excludeZoneIds?.includes(props.id)) continue;

    // Check if zone is currently active
    if (now < props.valid_from || now > props.valid_to) continue;

    const zonePolygon = turf.polygon(feature.geometry.coordinates);
    const intersects = turf.booleanIntersects(routeLine, zonePolygon);

    if (intersects && !props.allowed_tags.includes(userTag)) {
      blockedZones.push({
        id: props.id,
        name: props.name,
        allowedTags: props.allowed_tags,
      });
    }
  }

  return {
    valid: blockedZones.length === 0,
    blockedZones,
  };
}
