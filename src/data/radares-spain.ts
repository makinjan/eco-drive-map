/**
 * Fixed speed cameras (radares fijos) on major Spanish highways.
 * Source: DGT public data. This is a representative subset of the most
 * common radars on Spain's main motorways / autovías.
 *
 * speed_limit is in km/h.
 */

export interface RadarPoint {
  id: string;
  lat: number;
  lng: number;
  road: string;
  km: number;
  speed_limit: number;
  direction: 'creciente' | 'decreciente' | 'ambos';
  type: 'fijo' | 'tramo' | 'semaforo';
}

export const radaresSpain: RadarPoint[] = [
  // ===== A-1 (Madrid – Burgos – Irún) =====
  { id: 'A1-018', lat: 40.5348, lng: -3.6362, road: 'A-1', km: 18, speed_limit: 120, direction: 'creciente', type: 'fijo' },
  { id: 'A1-045', lat: 40.7821, lng: -3.5421, road: 'A-1', km: 45, speed_limit: 120, direction: 'decreciente', type: 'fijo' },
  { id: 'A1-068', lat: 40.9575, lng: -3.4182, road: 'A-1', km: 68, speed_limit: 120, direction: 'creciente', type: 'fijo' },
  { id: 'A1-100', lat: 41.1250, lng: -3.3800, road: 'A-1', km: 100, speed_limit: 120, direction: 'ambos', type: 'fijo' },
  { id: 'A1-152', lat: 41.4760, lng: -3.3481, road: 'A-1', km: 152, speed_limit: 120, direction: 'creciente', type: 'fijo' },
  { id: 'A1-237', lat: 42.0195, lng: -3.3680, road: 'A-1', km: 237, speed_limit: 120, direction: 'decreciente', type: 'fijo' },

  // ===== A-2 (Madrid – Zaragoza – Barcelona) =====
  { id: 'A2-033', lat: 40.4705, lng: -3.2618, road: 'A-2', km: 33, speed_limit: 120, direction: 'creciente', type: 'fijo' },
  { id: 'A2-055', lat: 40.4863, lng: -3.0125, road: 'A-2', km: 55, speed_limit: 120, direction: 'decreciente', type: 'fijo' },
  { id: 'A2-092', lat: 40.6520, lng: -2.6350, road: 'A-2', km: 92, speed_limit: 120, direction: 'creciente', type: 'fijo' },
  { id: 'A2-132', lat: 40.8740, lng: -2.2670, road: 'A-2', km: 132, speed_limit: 120, direction: 'ambos', type: 'fijo' },
  { id: 'A2-268', lat: 41.4365, lng: -1.1110, road: 'A-2', km: 268, speed_limit: 120, direction: 'creciente', type: 'fijo' },
  { id: 'A2-314', lat: 41.6453, lng: -0.8360, road: 'A-2', km: 314, speed_limit: 120, direction: 'decreciente', type: 'fijo' },

  // ===== A-3 (Madrid – Valencia) =====
  { id: 'A3-021', lat: 40.3750, lng: -3.5500, road: 'A-3', km: 21, speed_limit: 120, direction: 'creciente', type: 'fijo' },
  { id: 'A3-060', lat: 40.1935, lng: -3.1840, road: 'A-3', km: 60, speed_limit: 120, direction: 'decreciente', type: 'fijo' },
  { id: 'A3-190', lat: 39.4580, lng: -1.7350, road: 'A-3', km: 190, speed_limit: 120, direction: 'creciente', type: 'fijo' },
  { id: 'A3-295', lat: 39.3780, lng: -0.6840, road: 'A-3', km: 295, speed_limit: 100, direction: 'ambos', type: 'fijo' },
  { id: 'A3-340', lat: 39.4620, lng: -0.4220, road: 'A-3', km: 340, speed_limit: 80, direction: 'creciente', type: 'fijo' },

  // ===== A-4 (Madrid – Córdoba – Sevilla – Cádiz) =====
  { id: 'A4-022', lat: 40.2850, lng: -3.6730, road: 'A-4', km: 22, speed_limit: 120, direction: 'creciente', type: 'fijo' },
  { id: 'A4-048', lat: 40.0920, lng: -3.6010, road: 'A-4', km: 48, speed_limit: 120, direction: 'decreciente', type: 'fijo' },
  { id: 'A4-119', lat: 39.5385, lng: -3.6148, road: 'A-4', km: 119, speed_limit: 120, direction: 'creciente', type: 'fijo' },
  { id: 'A4-194', lat: 38.9190, lng: -3.7870, road: 'A-4', km: 194, speed_limit: 120, direction: 'ambos', type: 'fijo' },
  { id: 'A4-337', lat: 37.9390, lng: -4.7230, road: 'A-4', km: 337, speed_limit: 120, direction: 'creciente', type: 'fijo' },
  { id: 'A4-400', lat: 37.8450, lng: -4.7880, road: 'A-4', km: 400, speed_limit: 120, direction: 'decreciente', type: 'fijo' },
  { id: 'A4-528', lat: 37.3815, lng: -5.9720, road: 'A-4', km: 528, speed_limit: 120, direction: 'creciente', type: 'fijo' },
  { id: 'A4-617', lat: 36.7610, lng: -6.1520, road: 'A-4', km: 617, speed_limit: 120, direction: 'ambos', type: 'fijo' },
  { id: 'A4-645', lat: 36.6483, lng: -6.1758, road: 'A-4', km: 645, speed_limit: 120, direction: 'decreciente', type: 'fijo' },

  // ===== A-5 (Madrid – Badajoz) =====
  { id: 'A5-020', lat: 40.3810, lng: -3.8320, road: 'A-5', km: 20, speed_limit: 120, direction: 'creciente', type: 'fijo' },
  { id: 'A5-068', lat: 40.2460, lng: -4.3280, road: 'A-5', km: 68, speed_limit: 120, direction: 'decreciente', type: 'fijo' },
  { id: 'A5-182', lat: 39.8540, lng: -5.2010, road: 'A-5', km: 182, speed_limit: 120, direction: 'creciente', type: 'fijo' },

  // ===== A-6 (Madrid – A Coruña) =====
  { id: 'A6-023', lat: 40.5120, lng: -3.8100, road: 'A-6', km: 23, speed_limit: 120, direction: 'creciente', type: 'fijo' },
  { id: 'A6-068', lat: 40.6630, lng: -4.2010, road: 'A-6', km: 68, speed_limit: 120, direction: 'decreciente', type: 'fijo' },
  { id: 'A6-115', lat: 40.7340, lng: -4.5850, road: 'A-6', km: 115, speed_limit: 120, direction: 'creciente', type: 'fijo' },

  // ===== A-7 / AP-7 (Mediterráneo) =====
  { id: 'A7-435', lat: 36.7200, lng: -4.3960, road: 'A-7', km: 435, speed_limit: 100, direction: 'creciente', type: 'fijo' },
  { id: 'A7-475', lat: 36.6920, lng: -4.0580, road: 'A-7', km: 475, speed_limit: 120, direction: 'decreciente', type: 'fijo' },
  { id: 'A7-598', lat: 37.1670, lng: -3.5940, road: 'A-7', km: 598, speed_limit: 100, direction: 'ambos', type: 'fijo' },
  { id: 'AP7-115', lat: 41.1680, lng: 1.1970, road: 'AP-7', km: 115, speed_limit: 120, direction: 'creciente', type: 'fijo' },
  { id: 'AP7-152', lat: 41.0540, lng: 0.8710, road: 'AP-7', km: 152, speed_limit: 120, direction: 'decreciente', type: 'fijo' },
  { id: 'AP7-179', lat: 40.7270, lng: 0.5610, road: 'AP-7', km: 179, speed_limit: 120, direction: 'creciente', type: 'fijo' },
  { id: 'AP7-239', lat: 40.0320, lng: -0.0280, road: 'AP-7', km: 239, speed_limit: 120, direction: 'ambos', type: 'fijo' },

  // ===== M-30 (Madrid circunvalación) =====
  { id: 'M30-001', lat: 40.3930, lng: -3.6760, road: 'M-30', km: 1, speed_limit: 90, direction: 'creciente', type: 'fijo' },
  { id: 'M30-002', lat: 40.4180, lng: -3.6920, road: 'M-30', km: 3, speed_limit: 70, direction: 'decreciente', type: 'fijo' },
  { id: 'M30-003', lat: 40.4420, lng: -3.6720, road: 'M-30', km: 6, speed_limit: 90, direction: 'creciente', type: 'fijo' },
  { id: 'M30-004', lat: 40.4620, lng: -3.6980, road: 'M-30', km: 9, speed_limit: 70, direction: 'ambos', type: 'fijo' },
  { id: 'M30-005', lat: 40.4350, lng: -3.7180, road: 'M-30', km: 14, speed_limit: 90, direction: 'decreciente', type: 'fijo' },

  // ===== M-40 =====
  { id: 'M40-001', lat: 40.4830, lng: -3.7350, road: 'M-40', km: 5, speed_limit: 100, direction: 'creciente', type: 'fijo' },
  { id: 'M40-002', lat: 40.3560, lng: -3.7240, road: 'M-40', km: 18, speed_limit: 100, direction: 'decreciente', type: 'fijo' },
  { id: 'M40-003', lat: 40.3810, lng: -3.6150, road: 'M-40', km: 28, speed_limit: 100, direction: 'creciente', type: 'fijo' },

  // ===== AP-2 (Zaragoza – Mediterráneo) =====
  { id: 'AP2-040', lat: 41.4700, lng: -0.5100, road: 'AP-2', km: 40, speed_limit: 120, direction: 'creciente', type: 'fijo' },
  { id: 'AP2-085', lat: 41.3950, lng: 0.0580, road: 'AP-2', km: 85, speed_limit: 120, direction: 'decreciente', type: 'fijo' },

  // ===== B-23 / C-31 / C-32 (Barcelona área) =====
  { id: 'B23-005', lat: 41.3680, lng: 2.0670, road: 'B-23', km: 5, speed_limit: 80, direction: 'ambos', type: 'fijo' },
  { id: 'C31-185', lat: 41.3250, lng: 2.0730, road: 'C-31', km: 185, speed_limit: 80, direction: 'creciente', type: 'fijo' },
  { id: 'C32-050', lat: 41.4130, lng: 2.2280, road: 'C-32', km: 50, speed_limit: 80, direction: 'decreciente', type: 'fijo' },
  { id: 'C33-010', lat: 41.4510, lng: 2.1790, road: 'C-33', km: 10, speed_limit: 80, direction: 'creciente', type: 'fijo' },

  // ===== Rondas Barcelona =====
  { id: 'RONDA-LIT-01', lat: 41.3870, lng: 2.1580, road: 'Ronda Litoral', km: 3, speed_limit: 60, direction: 'ambos', type: 'fijo' },
  { id: 'RONDA-DAL-01', lat: 41.4210, lng: 2.1370, road: 'Ronda de Dalt', km: 5, speed_limit: 80, direction: 'creciente', type: 'fijo' },

  // ===== A-42 (Madrid – Toledo) =====
  { id: 'A42-035', lat: 40.1340, lng: -3.7610, road: 'A-42', km: 35, speed_limit: 120, direction: 'creciente', type: 'fijo' },
  { id: 'A42-060', lat: 39.9540, lng: -3.8270, road: 'A-42', km: 60, speed_limit: 120, direction: 'decreciente', type: 'fijo' },

  // ===== A-92 (Sevilla – Granada) =====
  { id: 'A92-015', lat: 37.3640, lng: -5.8750, road: 'A-92', km: 15, speed_limit: 120, direction: 'creciente', type: 'fijo' },
  { id: 'A92-115', lat: 37.2580, lng: -4.7130, road: 'A-92', km: 115, speed_limit: 120, direction: 'decreciente', type: 'fijo' },
  { id: 'A92-215', lat: 37.1730, lng: -3.6540, road: 'A-92', km: 215, speed_limit: 100, direction: 'creciente', type: 'fijo' },

  // ===== AG-55 / AP-9 (Galicia) =====
  { id: 'AP9-025', lat: 42.1970, lng: -8.7230, road: 'AP-9', km: 25, speed_limit: 120, direction: 'creciente', type: 'fijo' },
  { id: 'AP9-070', lat: 42.5580, lng: -8.4920, road: 'AP-9', km: 70, speed_limit: 120, direction: 'decreciente', type: 'fijo' },
  { id: 'AP9-120', lat: 43.0120, lng: -8.4350, road: 'AP-9', km: 120, speed_limit: 120, direction: 'creciente', type: 'fijo' },

  // ===== A-66 (Ruta de la Plata) =====
  { id: 'A66-640', lat: 37.5320, lng: -5.9780, road: 'A-66', km: 640, speed_limit: 120, direction: 'creciente', type: 'fijo' },
  { id: 'A66-520', lat: 38.4360, lng: -6.0810, road: 'A-66', km: 520, speed_limit: 120, direction: 'decreciente', type: 'fijo' },
  { id: 'A66-290', lat: 39.9620, lng: -5.8530, road: 'A-66', km: 290, speed_limit: 120, direction: 'creciente', type: 'fijo' },

  // ===== Radares de tramo (section speed cameras) =====
  { id: 'TRAMO-M30-T1', lat: 40.4030, lng: -3.6680, road: 'M-30', km: 2, speed_limit: 70, direction: 'ambos', type: 'tramo' },
  { id: 'TRAMO-AP7-T1', lat: 41.2910, lng: 1.5160, road: 'AP-7', km: 90, speed_limit: 120, direction: 'ambos', type: 'tramo' },
  { id: 'TRAMO-A3-T1', lat: 39.4200, lng: -0.5800, road: 'A-3', km: 310, speed_limit: 100, direction: 'ambos', type: 'tramo' },
  { id: 'TRAMO-A7-T1', lat: 36.7450, lng: -4.4800, road: 'A-7', km: 430, speed_limit: 80, direction: 'ambos', type: 'tramo' },
];
