import type { FeatureCollection, Feature, Polygon } from 'geojson';

export interface ZBEProperties {
  id: string;
  name: string;
  allowed_tags: string[];
  valid_from: string;
  valid_to: string;
}

export const zbeZones: FeatureCollection<Polygon, ZBEProperties> = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        id: 'ZBE_MADRID',
        name: 'Madrid Central (Madrid 360)',
        allowed_tags: ['CERO', 'ECO'],
        valid_from: '2024-01-01',
        valid_to: '2030-12-31',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [-3.7150, 40.4280],
            [-3.7080, 40.4290],
            [-3.6990, 40.4270],
            [-3.6930, 40.4240],
            [-3.6910, 40.4200],
            [-3.6920, 40.4160],
            [-3.6960, 40.4130],
            [-3.7020, 40.4110],
            [-3.7100, 40.4120],
            [-3.7160, 40.4150],
            [-3.7180, 40.4200],
            [-3.7170, 40.4250],
            [-3.7150, 40.4280],
          ],
        ],
      },
    },
    {
      type: 'Feature',
      properties: {
        id: 'ZBE_BARCELONA',
        name: 'ZBE Rondes de Barcelona',
        allowed_tags: ['CERO', 'ECO', 'C'],
        valid_from: '2024-01-01',
        valid_to: '2030-12-31',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [2.1100, 41.4150],
            [2.1350, 41.4200],
            [2.1600, 41.4180],
            [2.1800, 41.4120],
            [2.1900, 41.4000],
            [2.1920, 41.3880],
            [2.1850, 41.3750],
            [2.1700, 41.3680],
            [2.1500, 41.3650],
            [2.1300, 41.3670],
            [2.1150, 41.3750],
            [2.1050, 41.3880],
            [2.1030, 41.4000],
            [2.1050, 41.4080],
            [2.1100, 41.4150],
          ],
        ],
      },
    },
  ],
};
