import { useState, useEffect } from 'react';
import { Fuel, Zap, Car } from 'lucide-react';

export type VehicleType = 'gasolina' | 'diesel' | 'electrico' | 'hibrido';

interface VehicleProfile {
  label: string;
  icon: typeof Fuel;
  consumption: number; // L/100km or kWh/100km
  unitPrice: number; // €/L or €/kWh
  unit: string;
}

const VEHICLE_PROFILES: Record<VehicleType, VehicleProfile> = {
  gasolina: { label: 'Gasolina', icon: Fuel, consumption: 7, unitPrice: 1.55, unit: 'L' },
  diesel: { label: 'Diésel', icon: Fuel, consumption: 5.5, unitPrice: 1.45, unit: 'L' },
  electrico: { label: 'Eléctrico', icon: Zap, consumption: 16, unitPrice: 0.15, unit: 'kWh' },
  hibrido: { label: 'Híbrido', icon: Car, consumption: 4.5, unitPrice: 1.55, unit: 'L' },
};

interface TripCostEstimatorProps {
  distanceMeters: number | null;
}

const TripCostEstimator = ({ distanceMeters }: TripCostEstimatorProps) => {
  const [vehicleType, setVehicleType] = useState<VehicleType>(() => {
    return (localStorage.getItem('zbe-vehicle-type') as VehicleType) || 'gasolina';
  });

  useEffect(() => {
    localStorage.setItem('zbe-vehicle-type', vehicleType);
  }, [vehicleType]);

  if (distanceMeters == null || distanceMeters <= 0) return null;

  const distanceKm = distanceMeters / 1000;
  const profile = VEHICLE_PROFILES[vehicleType];
  const consumed = (profile.consumption / 100) * distanceKm;
  const cost = consumed * profile.unitPrice;

  const types: VehicleType[] = ['gasolina', 'diesel', 'electrico', 'hibrido'];

  return (
    <div className="rounded-xl bg-muted/40 border border-border/60 p-3.5 space-y-2.5">
      <div className="flex items-center gap-2 text-foreground font-semibold text-xs">
        <Fuel className="h-3.5 w-3.5 text-muted-foreground" />
        Coste estimado del viaje
      </div>

      {/* Vehicle type selector */}
      <div className="grid grid-cols-4 gap-1">
        {types.map((type) => {
          const p = VEHICLE_PROFILES[type];
          const Icon = p.icon;
          const isActive = vehicleType === type;
          return (
            <button
              key={type}
              onClick={() => setVehicleType(type)}
              className={`flex flex-col items-center gap-0.5 py-1.5 px-1 rounded-lg text-[10px] font-medium transition-colors ${
                isActive
                  ? 'bg-primary/15 text-primary border border-primary/30'
                  : 'bg-background/60 text-muted-foreground hover:bg-muted/60 border border-transparent'
              }`}
            >
              <Icon className="h-3 w-3" />
              {p.label}
            </button>
          );
        })}
      </div>

      {/* Cost result */}
      <div className="flex items-baseline justify-between text-xs">
        <span className="text-muted-foreground">
          {consumed.toFixed(1)} {profile.unit} · {distanceKm.toFixed(1)} km
        </span>
        <span className="text-lg font-bold text-foreground">{cost.toFixed(2)} €</span>
      </div>
    </div>
  );
};

export default TripCostEstimator;
