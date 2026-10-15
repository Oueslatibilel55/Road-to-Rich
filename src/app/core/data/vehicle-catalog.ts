import { BusinessId, VehicleClass, VehicleModel, VehicleModelId } from '../models/game.models';

// Static catalogue for the demo: real makes and models at realistic new prices (USD).
// Incomes are tuned for pace — a delivery vehicle pays itself back in about two months of
// game time, a rental car in about three. Later this comes from the backend.

export const VEHICLE_MODELS: readonly VehicleModel[] = [
  // ── Delivery Company ─────────────────────────────────────────────────────
  {
    id: 'scooter', businessId: 'delivery', brand: 'Honda', model: 'PCX 125', class: 'scooter', price: 3_500,
    delivery: { kmPerHour: 25, revenuePerHour: 26, fuelPerKm: 0.05, driverWagePerHour: 14 },
    insurancePerDay: 2, serviceIntervalKm: 6_000, serviceCost: 120, kmBetweenBreakdowns: 6_000,
  },
  {
    id: 'compact-car', businessId: 'delivery', brand: 'Toyota', model: 'Corolla', class: 'car', price: 22_000,
    delivery: { kmPerHour: 30, revenuePerHour: 48, fuelPerKm: 0.1, driverWagePerHour: 17 },
    insurancePerDay: 6, serviceIntervalKm: 15_000, serviceCost: 280, kmBetweenBreakdowns: 10_000,
  },
  {
    id: 'cargo-van', businessId: 'delivery', brand: 'Ford', model: 'Transit', class: 'van', price: 46_000,
    delivery: { kmPerHour: 35, revenuePerHour: 85, fuelPerKm: 0.16, driverWagePerHour: 19 },
    insurancePerDay: 10, serviceIntervalKm: 20_000, serviceCost: 450, kmBetweenBreakdowns: 11_000,
  },
  {
    id: 'box-truck', businessId: 'delivery', brand: 'Isuzu', model: 'NPR-HD Box Truck', class: 'truck', price: 90_000,
    delivery: { kmPerHour: 45, revenuePerHour: 160, fuelPerKm: 0.32, driverWagePerHour: 24 },
    insurancePerDay: 18, serviceIntervalKm: 25_000, serviceCost: 900, kmBetweenBreakdowns: 12_000,
  },
  {
    id: 'semi-truck', businessId: 'delivery', brand: 'Volvo', model: 'VNL 860', class: 'semi', price: 165_000,
    delivery: { kmPerHour: 65, revenuePerHour: 290, fuelPerKm: 0.55, driverWagePerHour: 30 },
    insurancePerDay: 30, serviceIntervalKm: 40_000, serviceCost: 1_600, kmBetweenBreakdowns: 15_000,
  },

  // ── Car Rental ───────────────────────────────────────────────────────────
  rental('dacia-sandero', 'Dacia', 'Sandero', 'car', 17_000, 175, 160),
  rental('toyota-corolla', 'Toyota', 'Corolla', 'car', 23_000, 235, 170),
  rental('vw-golf', 'Volkswagen', 'Golf', 'car', 28_000, 285, 170),
  rental('tesla-model-3', 'Tesla', 'Model 3', 'car', 42_000, 430, 180),
  rental('bmw-3-series', 'BMW', '3 Series', 'premium', 46_000, 475, 170),
  rental('mercedes-e-class', 'Mercedes-Benz', 'E-Class', 'premium', 63_000, 650, 170),
  rental('range-rover-sport', 'Land Rover', 'Range Rover Sport', 'premium', 85_000, 880, 160),
  rental('porsche-911', 'Porsche', '911 Carrera', 'premium', 120_000, 1_250, 120),
];

function rental(
  id: string,
  brand: string,
  model: string,
  cls: VehicleClass,
  price: number,
  ratePerDay: number,
  kmPerDay: number,
): VehicleModel {
  return {
    id,
    businessId: 'car-rental',
    brand,
    model,
    class: cls,
    price,
    rental: { ratePerDay, kmPerDay },
    insurancePerDay: Math.round(price * 0.0004),
    serviceIntervalKm: 15_000,
    serviceCost: Math.round(Math.max(200, price * 0.012) / 10) * 10,
    kmBetweenBreakdowns: 14_000,
  };
}

const BY_ID = new Map(VEHICLE_MODELS.map((m) => [m.id, m]));

export function vehicleModel(id: VehicleModelId): VehicleModel {
  const model = BY_ID.get(id);
  if (!model) throw new Error(`Unknown vehicle model ${id}`);
  return model;
}

export function modelsOf(businessId: BusinessId): VehicleModel[] {
  return VEHICLE_MODELS.filter((m) => m.businessId === businessId);
}

export function modelName(m: VehicleModel): string {
  return `${m.brand} ${m.model}`;
}

/** Short label used to name vehicles: "Van #4". */
export const CLASS_LABEL: Record<VehicleClass, string> = {
  scooter: 'Scooter',
  car: 'Car',
  premium: 'Car',
  van: 'Van',
  truck: 'Truck',
  semi: 'Semi',
};
