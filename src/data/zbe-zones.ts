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
 * - Ayuntamiento de Valencia (valencia.es) — 27.8 km²
 * - Ayuntamiento de Sevilla — solo Isla de la Cartuja
 * - Ayuntamiento de Málaga (movilidad.malaga.eu) — 437 ha
 * - Ayuntamiento de Granada (movilidadgranada.com) — 23.55 km²
 * - MITECO (miteco.gob.es)
 * - ecociudades.es, RACE
 *
 * Key rules:
 * - Madrid: todo el municipio (~604 km²) es ZBE (solo SIN ETIQUETA restringido).
 *   ZBEDEP Centro y Plaza Elíptica: solo CERO y ECO.
 *   Se puede transitar por M-40, M-45, M-50 y radiales.
 * - Barcelona (Cataluña): ~95 km² dentro de Rondas. B restringida desde 2026.
 * - Sevilla: solo Isla de la Cartuja (Norte y Sur). L-V 7:00-19:00.
 * - Valencia: 27.8 km² + ZBEES Ciutat Vella 0.3 km².
 * - Málaga: 437 ha (~4.37 km²) zona central.
 * - Granada: 23.55 km² casco urbano.
 * - Resto de ciudades: generalmente solo SIN ETIQUETA restringido.
 */
export const zbeZones: FeatureCollection<Polygon, ZBEProperties> = {
  type: 'FeatureCollection',
  features: [
    // ==========================================
    // MADRID — municipio completo ~604 km²
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
            // Perímetro simplificado del municipio de Madrid
            // Norte: Monte de El Pardo
            [-3.7700, 40.5300],
            [-3.7400, 40.5350],
            [-3.7000, 40.5300],
            [-3.6600, 40.5200],
            [-3.6200, 40.5100],
            // Noreste: Barajas
            [-3.5800, 40.5000],
            [-3.5500, 40.4850],
            [-3.5400, 40.4700],
            [-3.5350, 40.4500],
            // Este: Vicálvaro, Vallecas
            [-3.5400, 40.4300],
            [-3.5500, 40.4100],
            [-3.5600, 40.3900],
            [-3.5700, 40.3700],
            // Sureste: Villa de Vallecas
            [-3.5800, 40.3500],
            [-3.6000, 40.3350],
            // Sur: Villaverde
            [-3.6300, 40.3250],
            [-3.6600, 40.3200],
            [-3.7000, 40.3200],
            [-3.7400, 40.3250],
            // Suroeste: Carabanchel, Latina
            [-3.7700, 40.3350],
            [-3.7900, 40.3500],
            [-3.8100, 40.3700],
            // Oeste: Casa de Campo, Moncloa
            [-3.8200, 40.3950],
            [-3.8300, 40.4200],
            [-3.8300, 40.4500],
            // Noroeste: El Pardo
            [-3.8200, 40.4750],
            [-3.8100, 40.4950],
            [-3.7900, 40.5150],
            [-3.7700, 40.5300],
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
            // Perímetro oficial: Alberto Aguilera → Carranza → Sagasta →
            // Génova → Colón → Recoletos → Prado → Atocha →
            // R. Valencia → R. Toledo → Gran Vía S. Francisco →
            // Bailén → Pza. España → Princesa → Alberto Aguilera
            [-3.7120, 40.4290],  // Serrano Jover / Alberto Aguilera
            [-3.7060, 40.4295],  // Glorieta Ruiz Jiménez
            [-3.7010, 40.4290],  // Carranza / Glorieta Bilbao
            [-3.6960, 40.4275],  // Sagasta
            [-3.6930, 40.4255],  // Alonso Martínez
            [-3.6920, 40.4235],  // Génova
            [-3.6925, 40.4210],  // Colón
            [-3.6930, 40.4180],  // Recoletos
            [-3.6935, 40.4150],  // Cibeles
            [-3.6935, 40.4120],  // Prado / Cánovas del Castillo
            [-3.6940, 40.4095],  // Emperador Carlos V / Atocha
            [-3.6980, 40.4085],  // Ronda de Atocha
            [-3.7020, 40.4080],  // Ronda de Valencia
            [-3.7060, 40.4085],  // Glorieta Embajadores
            [-3.7090, 40.4095],  // Ronda de Toledo
            [-3.7110, 40.4110],  // Puerta de Toledo
            [-3.7120, 40.4130],  // Ronda de Segovia
            [-3.7140, 40.4155],  // Cuesta de la Vega
            [-3.7155, 40.4180],  // Bailén
            [-3.7165, 40.4210],  // Plaza de España
            [-3.7150, 40.4245],  // Princesa
            [-3.7135, 40.4270],  // Serrano Jover
            [-3.7120, 40.4290],
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
            // Perímetro: Faro → Abrantes → Portalegre → Oporto →
            // Antonia Lancha → Sta. Lucrecia → Antonio Leyva → Arlanza →
            // P. Sta. María de la Cabeza → Manuel Noya → Cerecinos →
            // Fornillos → Ricardo Beltrán → Princesa Juana → Vía Lusitana → Faro
            [-3.7160, 40.3900],  // Faro norte
            [-3.7110, 40.3910],  // Av. Abrantes
            [-3.7060, 40.3900],  // Portalegre
            [-3.7020, 40.3880],  // Av. Oporto
            [-3.6990, 40.3860],  // Antonia Lancha
            [-3.6980, 40.3835],  // Sta. Lucrecia / Antonio Leyva
            [-3.6990, 40.3810],  // Arlanza
            [-3.7010, 40.3790],  // P. Sta. María de la Cabeza
            [-3.7040, 40.3775],  // Manuel Noya / Cerecinos
            [-3.7070, 40.3770],  // Fornillos
            [-3.7100, 40.3775],  // Ricardo Beltrán
            [-3.7130, 40.3790],  // Princesa Juana de Austria
            [-3.7155, 40.3815],  // Vía Lusitana
            [-3.7170, 40.3845],  // Parque Emperatriz
            [-3.7170, 40.3875],  // Faro sur
            [-3.7160, 40.3900],
          ],
        ],
      },
    },

    // ==========================================
    // BARCELONA — ~95 km² dentro de Rondas
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
            // Perímetro de las Rondas (~95 km²) incluyendo
            // Barcelona + L'Hospitalet + Esplugues + Cornellà +
            // Sant Adrià + Sant Joan Despí + parte Sant Cugat
            // Norte: Collserola / Tibidabo
            [2.0800, 41.4250],
            [2.1050, 41.4350],
            [2.1250, 41.4400],
            [2.1450, 41.4380],
            [2.1650, 41.4330],
            // Noreste: Ronda de Dalt / Sant Adrià
            [2.1850, 41.4250],
            [2.2050, 41.4150],
            [2.2150, 41.4050],
            [2.2200, 41.3950],
            // Este: Litoral / Fòrum
            [2.2250, 41.3850],
            [2.2200, 41.3750],
            // Sureste: Litoral / Port
            [2.2100, 41.3650],
            [2.1900, 41.3550],
            [2.1700, 41.3500],
            // Sur: Zona Franca / Hospitalet
            [2.1500, 41.3450],
            [2.1300, 41.3430],
            [2.1100, 41.3450],
            // Suroeste: Cornellà / Esplugues
            [2.0900, 41.3500],
            [2.0750, 41.3600],
            [2.0650, 41.3750],
            // Oeste: Collserola sur
            [2.0600, 41.3900],
            [2.0620, 41.4050],
            [2.0700, 41.4150],
            [2.0800, 41.4250],
          ],
        ],
      },
    },

    // ==========================================
    // VALENCIA — 27.8 km²
    // ==========================================
    {
      type: 'Feature',
      properties: {
        id: 'ZBE_VALENCIA',
        name: 'ZBE Valencia',
        allowed_tags: ['CERO', 'ECO', 'C', 'B'],
        valid_from: '2025-01-01',
        valid_to: '2030-12-31',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            // Delimitada por Ronda Nord, Av. dels Tarongers,
            // Av. de Serrería y Bulevard Sud — 27.8 km²
            // Norte: Ronda Nord
            [-0.3950, 39.4900],
            [-0.3850, 39.4920],
            [-0.3750, 39.4930],
            [-0.3650, 39.4920],
            [-0.3550, 39.4900],
            // Noreste: Av. dels Tarongers
            [-0.3450, 39.4870],
            [-0.3380, 39.4830],
            [-0.3350, 39.4780],
            // Este: Av. de Serrería / Puerto
            [-0.3330, 39.4720],
            [-0.3340, 39.4650],
            [-0.3370, 39.4580],
            // Sur: Bulevard Sud
            [-0.3420, 39.4520],
            [-0.3500, 39.4480],
            [-0.3600, 39.4460],
            [-0.3700, 39.4450],
            // Suroeste
            [-0.3800, 39.4460],
            [-0.3900, 39.4490],
            [-0.3980, 39.4530],
            // Oeste: Ronda / Turia
            [-0.4020, 39.4590],
            [-0.4040, 39.4660],
            [-0.4030, 39.4740],
            [-0.4000, 39.4820],
            [-0.3950, 39.4900],
          ],
        ],
      },
    },

    // ==========================================
    // SEVILLA — Solo Isla de la Cartuja
    // Activa desde 8 ene 2024. L-V 7:00-19:00.
    // ==========================================
    {
      type: 'Feature',
      properties: {
        id: 'ZBE_SEVILLA',
        name: 'ZBE Sevilla (Isla de la Cartuja)',
        allowed_tags: ['CERO', 'ECO', 'C', 'B'],
        valid_from: '2024-01-08',
        valid_to: '2030-12-31',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            // Isla de la Cartuja: Cartuja Norte + Cartuja Sur
            // Delimitada por el Guadalquivir y canales
            [-6.0100, 37.4080],  // Norte: puente Barqueta area
            [-6.0050, 37.4100],
            [-6.0000, 37.4090],
            [-5.9960, 37.4060],
            [-5.9940, 37.4020],
            [-5.9930, 37.3980],
            [-5.9935, 37.3940],
            [-5.9950, 37.3900],  // Sur: Puente de la Cartuja
            [-5.9980, 37.3880],
            [-6.0020, 37.3870],
            [-6.0060, 37.3885],
            [-6.0090, 37.3910],
            [-6.0110, 37.3950],
            [-6.0120, 37.3990],
            [-6.0120, 37.4030],
            [-6.0110, 37.4060],
            [-6.0100, 37.4080],
          ],
        ],
      },
    },

    // ==========================================
    // MÁLAGA — 437 ha (~4.37 km²)
    // ==========================================
    {
      type: 'Feature',
      properties: {
        id: 'ZBE_MALAGA',
        name: 'ZBE Málaga',
        allowed_tags: ['CERO', 'ECO', 'C', 'B'],
        valid_from: '2025-01-01',
        valid_to: '2030-12-31',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            // Zona central delimitada por Av. de Andalucía,
            // Paseo Marítimo y río Guadalmedina — 437 ha (~4.37 km²)
            // Norte: Cruz de Humilladero / Capuchinos
            [-4.4380, 36.7190],
            [-4.4320, 36.7200],
            [-4.4250, 36.7210],
            [-4.4180, 36.7200],
            // Noreste: La Victoria
            [-4.4130, 36.7180],
            [-4.4100, 36.7150],
            // Este: La Malagueta
            [-4.4090, 36.7120],
            [-4.4100, 36.7090],
            // Sureste: Puerto
            [-4.4120, 36.7065],
            [-4.4160, 36.7050],
            [-4.4220, 36.7040],
            [-4.4300, 36.7045],
            // Sur: Paseo Marítimo
            [-4.4360, 36.7060],
            [-4.4400, 36.7085],
            // Oeste: Guadalmedina
            [-4.4420, 36.7110],
            [-4.4420, 36.7150],
            [-4.4400, 36.7175],
            [-4.4380, 36.7190],
          ],
        ],
      },
    },

    // ==========================================
    // BILBAO — ~8.5 km² almendra central
    // ==========================================
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
            // Zona central de Bilbao siguiendo la ría del Nervión
            // Norte: Deusto / San Ignacio
            [-2.9550, 43.2700],
            [-2.9450, 43.2720],
            [-2.9350, 43.2730],
            [-2.9250, 43.2720],
            [-2.9150, 43.2700],
            // Este: Begoña / Casco Viejo
            [-2.9050, 43.2660],
            [-2.9000, 43.2610],
            [-2.8980, 43.2560],
            // Sureste: Basurto / Zabala
            [-2.9000, 43.2510],
            [-2.9050, 43.2470],
            [-2.9120, 43.2440],
            // Sur: Rekalde / Irala
            [-2.9200, 43.2430],
            [-2.9300, 43.2430],
            [-2.9400, 43.2440],
            // Suroeste: Zorrotzaurre
            [-2.9500, 43.2470],
            [-2.9570, 43.2510],
            [-2.9600, 43.2560],
            // Oeste: Basurto
            [-2.9610, 43.2620],
            [-2.9590, 43.2670],
            [-2.9550, 43.2700],
          ],
        ],
      },
    },

    // ==========================================
    // ZARAGOZA — ~12 km² dentro del tercer cinturón
    // ==========================================
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
            // Zona delimitada por el tercer cinturón
            // Norte
            [-0.8950, 41.6620],
            [-0.8870, 41.6640],
            [-0.8780, 41.6650],
            [-0.8700, 41.6640],
            [-0.8620, 41.6620],
            // Este: Av. Cataluña
            [-0.8560, 41.6580],
            [-0.8530, 41.6530],
            [-0.8520, 41.6480],
            // Sureste: ribera del Ebro
            [-0.8540, 41.6430],
            [-0.8580, 41.6390],
            [-0.8640, 41.6360],
            // Sur
            [-0.8720, 41.6340],
            [-0.8800, 41.6340],
            [-0.8880, 41.6350],
            // Suroeste
            [-0.8940, 41.6380],
            [-0.8980, 41.6420],
            [-0.9000, 41.6470],
            // Oeste
            [-0.9010, 41.6520],
            [-0.8990, 41.6570],
            [-0.8950, 41.6620],
          ],
        ],
      },
    },

    // ==========================================
    // PALMA DE MALLORCA — ~14 km² zona urbana
    // ==========================================
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
            // Zona urbana de Palma dentro de la Vía de Cintura
            // Norte
            [2.6250, 39.5800],
            [2.6350, 39.5820],
            [2.6450, 39.5830],
            [2.6550, 39.5820],
            [2.6650, 39.5790],
            // Este
            [2.6700, 39.5750],
            [2.6720, 39.5700],
            [2.6710, 39.5650],
            // Sureste: paseo marítimo
            [2.6680, 39.5610],
            [2.6620, 39.5580],
            [2.6550, 39.5570],
            // Sur: bahía
            [2.6450, 39.5560],
            [2.6350, 39.5570],
            [2.6270, 39.5590],
            // Suroeste
            [2.6220, 39.5620],
            [2.6190, 39.5660],
            [2.6180, 39.5710],
            // Oeste
            [2.6190, 39.5750],
            [2.6220, 39.5780],
            [2.6250, 39.5800],
          ],
        ],
      },
    },

    // ==========================================
    // CÓRDOBA — ~5 km² centro histórico
    // ==========================================
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
            // Zona centro de Córdoba incluyendo casco histórico
            // Norte: Av. Ollerías / Ronda de los Tejares
            [-4.7900, 37.8910],
            [-4.7840, 37.8930],
            [-4.7770, 37.8940],
            [-4.7700, 37.8930],
            [-4.7640, 37.8910],
            // Este: Av. del Aeropuerto
            [-4.7600, 37.8880],
            [-4.7580, 37.8840],
            [-4.7580, 37.8800],
            // Sureste: río Guadalquivir
            [-4.7600, 37.8760],
            [-4.7640, 37.8730],
            [-4.7700, 37.8710],
            // Sur: ribera
            [-4.7770, 37.8700],
            [-4.7840, 37.8710],
            [-4.7900, 37.8730],
            // Oeste
            [-4.7940, 37.8760],
            [-4.7960, 37.8800],
            [-4.7960, 37.8840],
            [-4.7940, 37.8880],
            [-4.7900, 37.8910],
          ],
        ],
      },
    },

    // ==========================================
    // VIGO — ~10 km² zona urbana
    // ==========================================
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
            // Zona urbana de Vigo desde el centro hasta la ría
            // Norte: Teis / Lavadores
            [-8.7400, 42.2450],
            [-8.7320, 42.2470],
            [-8.7230, 42.2480],
            [-8.7140, 42.2470],
            [-8.7060, 42.2440],
            // Este: Av. de Madrid
            [-8.7010, 42.2400],
            [-8.6980, 42.2350],
            [-8.6980, 42.2300],
            // Sureste: puerto / ría
            [-8.7000, 42.2250],
            [-8.7050, 42.2210],
            [-8.7120, 42.2190],
            // Sur: ribera
            [-8.7200, 42.2180],
            [-8.7300, 42.2190],
            [-8.7380, 42.2210],
            // Oeste
            [-8.7430, 42.2250],
            [-8.7460, 42.2300],
            [-8.7460, 42.2360],
            [-8.7440, 42.2410],
            [-8.7400, 42.2450],
          ],
        ],
      },
    },

    // ==========================================
    // GIRONA — B restringida (Cataluña 2026)
    // ==========================================
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
            // Zona urbana de Girona ~6 km²
            // Norte: Montjuïc / Pont Major
            [2.8100, 41.9920],
            [2.8170, 41.9940],
            [2.8250, 41.9950],
            [2.8320, 41.9940],
            // Este: Pedret / Santa Eugènia
            [2.8380, 41.9910],
            [2.8410, 41.9870],
            [2.8420, 41.9830],
            // Sureste: Devesa
            [2.8400, 41.9790],
            [2.8360, 41.9760],
            [2.8300, 41.9740],
            // Sur: Av. Sant Narcís
            [2.8230, 41.9730],
            [2.8160, 41.9740],
            [2.8100, 41.9760],
            // Oeste: Montilivi
            [2.8060, 41.9790],
            [2.8040, 41.9830],
            [2.8040, 41.9870],
            [2.8060, 41.9900],
            [2.8100, 41.9920],
          ],
        ],
      },
    },

    // ==========================================
    // ALICANTE — ~15 km² zona urbana
    // ==========================================
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
            // Zona urbana de Alicante
            // Norte: San Vicente / Villafranqueza
            [-0.5000, 38.3550],
            [-0.4920, 38.3570],
            [-0.4830, 38.3580],
            [-0.4740, 38.3570],
            [-0.4660, 38.3540],
            // Este: Playa de San Juan
            [-0.4610, 38.3500],
            [-0.4580, 38.3450],
            [-0.4570, 38.3400],
            // Sureste: puerto
            [-0.4580, 38.3350],
            [-0.4610, 38.3300],
            [-0.4660, 38.3260],
            // Sur
            [-0.4730, 38.3240],
            [-0.4820, 38.3240],
            [-0.4910, 38.3250],
            // Suroeste
            [-0.4970, 38.3280],
            [-0.5010, 38.3330],
            [-0.5030, 38.3380],
            // Oeste
            [-0.5030, 38.3440],
            [-0.5020, 38.3500],
            [-0.5000, 38.3550],
          ],
        ],
      },
    },

    // ==========================================
    // GRANADA — 23.55 km² casco urbano
    // ==========================================
    {
      type: 'Feature',
      properties: {
        id: 'ZBE_GRANADA',
        name: 'ZBE Granada',
        allowed_tags: ['CERO', 'ECO', 'C', 'B'],
        valid_from: '2025-04-01',
        valid_to: '2030-12-31',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            // Perímetro oficial ~23.55 km² — casco urbano consolidado
            // Excluye: GR-30, Ronda Sur (A-395), Patronato Alhambra
            [-3.5820, 37.1820],
            [-3.5780, 37.1790],
            [-3.5750, 37.1740],
            [-3.5780, 37.1680],
            [-3.5830, 37.1620],
            [-3.5900, 37.1560],
            [-3.6000, 37.1510],
            [-3.6100, 37.1490],
            [-3.6220, 37.1500],
            [-3.6350, 37.1530],
            [-3.6420, 37.1570],
            [-3.6480, 37.1640],
            [-3.6500, 37.1720],
            [-3.6490, 37.1800],
            [-3.6450, 37.1870],
            [-3.6380, 37.1930],
            [-3.6280, 37.1970],
            [-3.6170, 37.1990],
            [-3.6060, 37.2000],
            [-3.5950, 37.1990],
            [-3.5870, 37.1950],
            [-3.5830, 37.1890],
            [-3.5820, 37.1820],
          ],
        ],
      },
    },
  ],
};
