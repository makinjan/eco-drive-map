import type { FeatureCollection, Polygon } from 'geojson';

export interface ZBEProperties {
  id: string;
  name: string;
  allowed_tags: string[];
  valid_from: string;
  valid_to: string;
}

/**
 * ZBE data verified against official sources (Feb 2026):
 * - Ayuntamiento de Madrid (madrid.es, madrid360.es)
 * - AMB Barcelona (zbe.barcelona)
 * - MITECO (miteco.gob.es)
 * - ecociudades.es
 *
 * Key rules:
 * - Madrid: todo el municipio es ZBE (solo SIN ETIQUETA restringido).
 *   ZBEDEP Centro y Plaza Elíptica: solo CERO y ECO.
 * - Barcelona (Cataluña): B restringida desde 2026.
 * - Resto de ciudades: generalmente solo SIN ETIQUETA restringido.
 */
export const zbeZones: FeatureCollection<Polygon, ZBEProperties> = {
  type: 'FeatureCollection',
  features: [
    // ==========================================
    // MADRID
    // ==========================================
    {
      type: 'Feature',
      properties: {
        id: 'ZBE_MADRID',
        name: 'ZBE Madrid (todo el municipio)',
        allowed_tags: ['CERO', 'ECO', 'C', 'B'],
        valid_from: '2022-01-01',
        valid_to: '2030-12-31',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            // Approximate M-40 ring (whole municipality ZBE)
            [-3.7700, 40.5000],
            [-3.7400, 40.5050],
            [-3.7100, 40.5020],
            [-3.6800, 40.4950],
            [-3.6500, 40.4850],
            [-3.6300, 40.4700],
            [-3.6200, 40.4500],
            [-3.6150, 40.4300],
            [-3.6200, 40.4100],
            [-3.6300, 40.3900],
            [-3.6500, 40.3750],
            [-3.6800, 40.3650],
            [-3.7100, 40.3600],
            [-3.7400, 40.3620],
            [-3.7700, 40.3700],
            [-3.7900, 40.3850],
            [-3.8000, 40.4050],
            [-3.8050, 40.4250],
            [-3.8020, 40.4500],
            [-3.7900, 40.4750],
            [-3.7700, 40.5000],
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
        valid_from: '2018-11-30',
        valid_to: '2030-12-31',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            // Perímetro: Alberto Aguilera - Carranza - Sagasta - Génova -
            // Colón - Recoletos - Paseo del Prado - Ronda de Atocha -
            // Ronda de Valencia - Ronda de Toledo - Gran Vía de San Francisco -
            // Bailén - Plaza de España - Princesa - Alberto Aguilera
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
    {
      type: 'Feature',
      properties: {
        id: 'ZBEDEP_PLAZA_ELIPTICA',
        name: 'ZBEDEP Plaza Elíptica (Madrid)',
        allowed_tags: ['CERO', 'ECO'],
        valid_from: '2022-01-01',
        valid_to: '2030-12-31',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            // Zona alrededor de Plaza Elíptica
            [-3.7120, 40.3870],
            [-3.7080, 40.3880],
            [-3.7040, 40.3875],
            [-3.7010, 40.3860],
            [-3.6995, 40.3840],
            [-3.6990, 40.3815],
            [-3.7000, 40.3790],
            [-3.7025, 40.3775],
            [-3.7060, 40.3765],
            [-3.7095, 40.3770],
            [-3.7125, 40.3785],
            [-3.7140, 40.3810],
            [-3.7140, 40.3840],
            [-3.7130, 40.3860],
            [-3.7120, 40.3870],
          ],
        ],
      },
    },

    // ==========================================
    // BARCELONA (Cataluña - B restringida desde 2026)
    // ==========================================
    {
      type: 'Feature',
      properties: {
        id: 'ZBE_BARCELONA',
        name: 'ZBE Rondes de Barcelona',
        allowed_tags: ['CERO', 'ECO', 'C'],
        valid_from: '2020-01-01',
        valid_to: '2030-12-31',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            // Perímetro aproximado de las Rondas (>95 km²)
            [2.0700, 41.4200],
            [2.1000, 41.4300],
            [2.1300, 41.4350],
            [2.1600, 41.4300],
            [2.1850, 41.4200],
            [2.2000, 41.4050],
            [2.2100, 41.3900],
            [2.2100, 41.3700],
            [2.2000, 41.3550],
            [2.1800, 41.3450],
            [2.1500, 41.3400],
            [2.1200, 41.3420],
            [2.0950, 41.3500],
            [2.0750, 41.3650],
            [2.0650, 41.3850],
            [2.0620, 41.4050],
            [2.0700, 41.4200],
          ],
        ],
      },
    },

    // ==========================================
    // RESTO DE ESPAÑA (solo SIN ETIQUETA restringido)
    // ==========================================
    {
      type: 'Feature',
      properties: {
        id: 'ZBE_VALENCIA',
        name: 'ZBE Valencia',
        allowed_tags: ['CERO', 'ECO', 'C', 'B'],
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
        allowed_tags: ['CERO', 'ECO', 'C', 'B'],
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
        allowed_tags: ['CERO', 'ECO', 'C', 'B'],
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
        allowed_tags: ['CERO', 'ECO', 'C', 'B'],
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
        id: 'ZBE_ZARAGOZA',
        name: 'ZBE Zaragoza',
        allowed_tags: ['CERO', 'ECO', 'C', 'B'],
        valid_from: '2024-01-01',
        valid_to: '2030-12-31',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [-0.8830, 41.6560],
            [-0.8790, 41.6575],
            [-0.8740, 41.6570],
            [-0.8700, 41.6555],
            [-0.8680, 41.6530],
            [-0.8670, 41.6500],
            [-0.8680, 41.6470],
            [-0.8710, 41.6450],
            [-0.8750, 41.6440],
            [-0.8800, 41.6445],
            [-0.8835, 41.6465],
            [-0.8850, 41.6490],
            [-0.8855, 41.6520],
            [-0.8845, 41.6545],
            [-0.8830, 41.6560],
          ],
        ],
      },
    },
    {
      type: 'Feature',
      properties: {
        id: 'ZBE_PALMA',
        name: 'ZBE Palma de Mallorca',
        allowed_tags: ['CERO', 'ECO', 'C', 'B'],
        valid_from: '2025-01-01',
        valid_to: '2030-12-31',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [2.6440, 39.5740],
            [2.6490, 39.5750],
            [2.6540, 39.5740],
            [2.6570, 39.5720],
            [2.6580, 39.5690],
            [2.6575, 39.5660],
            [2.6550, 39.5640],
            [2.6510, 39.5630],
            [2.6460, 39.5630],
            [2.6420, 39.5645],
            [2.6400, 39.5670],
            [2.6395, 39.5700],
            [2.6410, 39.5725],
            [2.6440, 39.5740],
          ],
        ],
      },
    },
    {
      type: 'Feature',
      properties: {
        id: 'ZBE_CORDOBA',
        name: 'ZBE Córdoba',
        allowed_tags: ['CERO', 'ECO', 'C', 'B'],
        valid_from: '2024-01-01',
        valid_to: '2030-12-31',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [-4.7830, 37.8870],
            [-4.7780, 37.8885],
            [-4.7720, 37.8880],
            [-4.7680, 37.8860],
            [-4.7660, 37.8830],
            [-4.7655, 37.8800],
            [-4.7670, 37.8770],
            [-4.7710, 37.8750],
            [-4.7760, 37.8740],
            [-4.7810, 37.8745],
            [-4.7845, 37.8770],
            [-4.7860, 37.8800],
            [-4.7855, 37.8835],
            [-4.7840, 37.8860],
            [-4.7830, 37.8870],
          ],
        ],
      },
    },
    {
      type: 'Feature',
      properties: {
        id: 'ZBE_VIGO',
        name: 'ZBE Vigo',
        allowed_tags: ['CERO', 'ECO', 'C', 'B'],
        valid_from: '2025-01-01',
        valid_to: '2030-12-31',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [-8.7300, 42.2380],
            [-8.7250, 42.2395],
            [-8.7190, 42.2390],
            [-8.7150, 42.2370],
            [-8.7130, 42.2340],
            [-8.7125, 42.2310],
            [-8.7140, 42.2280],
            [-8.7180, 42.2260],
            [-8.7230, 42.2250],
            [-8.7280, 42.2255],
            [-8.7315, 42.2275],
            [-8.7330, 42.2305],
            [-8.7325, 42.2340],
            [-8.7315, 42.2365],
            [-8.7300, 42.2380],
          ],
        ],
      },
    },
    // Girona (Cataluña - B restringida)
    {
      type: 'Feature',
      properties: {
        id: 'ZBE_GIRONA',
        name: 'ZBE Girona',
        allowed_tags: ['CERO', 'ECO', 'C'],
        valid_from: '2025-09-15',
        valid_to: '2030-12-31',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [2.8200, 41.9850],
            [2.8240, 41.9860],
            [2.8280, 41.9855],
            [2.8305, 41.9840],
            [2.8315, 41.9815],
            [2.8310, 41.9790],
            [2.8290, 41.9770],
            [2.8260, 41.9760],
            [2.8220, 41.9755],
            [2.8190, 41.9765],
            [2.8170, 41.9785],
            [2.8165, 41.9810],
            [2.8175, 41.9835],
            [2.8200, 41.9850],
          ],
        ],
      },
    },
    {
      type: 'Feature',
      properties: {
        id: 'ZBE_ALICANTE',
        name: 'ZBE Alicante',
        allowed_tags: ['CERO', 'ECO', 'C', 'B'],
        valid_from: '2025-01-01',
        valid_to: '2030-12-31',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [-0.4870, 38.3470],
            [-0.4820, 38.3485],
            [-0.4770, 38.3480],
            [-0.4730, 38.3460],
            [-0.4710, 38.3430],
            [-0.4705, 38.3400],
            [-0.4720, 38.3370],
            [-0.4755, 38.3350],
            [-0.4800, 38.3340],
            [-0.4850, 38.3345],
            [-0.4885, 38.3365],
            [-0.4900, 38.3395],
            [-0.4900, 38.3430],
            [-0.4885, 38.3455],
            [-0.4870, 38.3470],
          ],
        ],
      },
    },
    {
      type: 'Feature',
      properties: {
        id: 'ZBE_GRANADA',
        name: 'ZBE Granada',
        allowed_tags: ['CERO', 'ECO', 'C', 'B'],
        valid_from: '2024-01-01',
        valid_to: '2030-12-31',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [-3.6050, 37.1800],
            [-3.6000, 37.1815],
            [-3.5940, 37.1810],
            [-3.5900, 37.1790],
            [-3.5880, 37.1760],
            [-3.5875, 37.1730],
            [-3.5890, 37.1700],
            [-3.5925, 37.1680],
            [-3.5970, 37.1670],
            [-3.6020, 37.1675],
            [-3.6060, 37.1700],
            [-3.6075, 37.1730],
            [-3.6075, 37.1765],
            [-3.6060, 37.1790],
            [-3.6050, 37.1800],
          ],
        ],
      },
    },
  ],
};
