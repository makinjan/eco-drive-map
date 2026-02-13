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
    {
      type: 'Feature',
      properties: {
        id: 'ZBE_VALENCIA',
        name: 'ZBE Valencia',
        allowed_tags: ['CERO', 'ECO', 'C'],
        valid_from: '2024-01-01',
        valid_to: '2030-12-31',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [-0.3920, 39.4830],
            [-0.3830, 39.4850],
            [-0.3720, 39.4840],
            [-0.3630, 39.4800],
            [-0.3580, 39.4740],
            [-0.3560, 39.4670],
            [-0.3580, 39.4600],
            [-0.3640, 39.4540],
            [-0.3730, 39.4510],
            [-0.3830, 39.4500],
            [-0.3920, 39.4520],
            [-0.3980, 39.4570],
            [-0.4020, 39.4640],
            [-0.4030, 39.4720],
            [-0.4000, 39.4790],
            [-0.3920, 39.4830],
          ],
        ],
      },
    },
    {
      type: 'Feature',
      properties: {
        id: 'ZBE_SEVILLA',
        name: 'ZBE Sevilla',
        allowed_tags: ['CERO', 'ECO', 'C'],
        valid_from: '2024-01-01',
        valid_to: '2030-12-31',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [-5.9980, 37.3950],
            [-5.9880, 37.3970],
            [-5.9780, 37.3960],
            [-5.9700, 37.3920],
            [-5.9660, 37.3860],
            [-5.9650, 37.3790],
            [-5.9680, 37.3720],
            [-5.9750, 37.3670],
            [-5.9850, 37.3650],
            [-5.9950, 37.3660],
            [-6.0030, 37.3710],
            [-6.0070, 37.3780],
            [-6.0070, 37.3860],
            [-6.0040, 37.3920],
            [-5.9980, 37.3950],
          ],
        ],
      },
    },
    {
      type: 'Feature',
      properties: {
        id: 'ZBE_MALAGA',
        name: 'ZBE Málaga',
        allowed_tags: ['CERO', 'ECO', 'C'],
        valid_from: '2024-01-01',
        valid_to: '2030-12-31',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [-4.4350, 36.7250],
            [-4.4250, 36.7270],
            [-4.4150, 36.7260],
            [-4.4070, 36.7220],
            [-4.4030, 36.7170],
            [-4.4020, 36.7110],
            [-4.4050, 36.7050],
            [-4.4120, 36.7010],
            [-4.4220, 36.6990],
            [-4.4320, 36.7000],
            [-4.4390, 36.7040],
            [-4.4420, 36.7100],
            [-4.4420, 36.7170],
            [-4.4390, 36.7220],
            [-4.4350, 36.7250],
          ],
        ],
      },
    },
    {
      type: 'Feature',
      properties: {
        id: 'ZBE_BILBAO',
        name: 'ZBE Bilbao',
        allowed_tags: ['CERO', 'ECO', 'C'],
        valid_from: '2024-01-01',
        valid_to: '2030-12-31',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [-2.9400, 43.2680],
            [-2.9320, 43.2700],
            [-2.9220, 43.2690],
            [-2.9150, 43.2660],
            [-2.9110, 43.2610],
            [-2.9100, 43.2550],
            [-2.9130, 43.2490],
            [-2.9200, 43.2450],
            [-2.9300, 43.2430],
            [-2.9400, 43.2440],
            [-2.9470, 43.2480],
            [-2.9510, 43.2540],
            [-2.9510, 43.2610],
            [-2.9470, 43.2660],
            [-2.9400, 43.2680],
          ],
        ],
      },
    },
    {
      type: 'Feature',
      properties: {
        id: 'ZBEDEP_MADRID_CENTRO',
        name: 'ZBEDEP Distrito Centro (Madrid)',
        allowed_tags: ['CERO', 'ECO'],
        valid_from: '2024-01-01',
        valid_to: '2030-12-31',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [-3.7138, 40.4260],
            [-3.7070, 40.4270],
            [-3.7000, 40.4255],
            [-3.6945, 40.4230],
            [-3.6920, 40.4195],
            [-3.6925, 40.4160],
            [-3.6955, 40.4135],
            [-3.7010, 40.4115],
            [-3.7085, 40.4120],
            [-3.7140, 40.4145],
            [-3.7165, 40.4190],
            [-3.7160, 40.4230],
            [-3.7138, 40.4260],
          ],
        ],
      },
    },
  ],
};
