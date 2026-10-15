import { GAME } from '../data/game-constants';
import { modelsOf } from '../data/vehicle-catalog';
import { BusinessId, UsedListing, VehicleModel } from '../models/game.models';
import { marketValue } from './vehicle-rules';
import { between, pick, pickWeighted, roundTo, uid } from './random';

const SELLERS = [
  'City Auto Trade',
  'Northside Motors',
  'Private seller',
  'Fleet liquidation',
  'Express Couriers (closing)',
  'Highway Truck Center',
  'Second Gear Lot',
  'Auction house',
];

/** Businesses that buy vehicles, each with its own corner of the used lot. */
const VEHICLE_BUSINESSES: BusinessId[] = ['delivery', 'car-rental'];

export function usedListing(models: VehicleModel[]): UsedListing {
  // Cheaper models show up more often.
  const model = pickWeighted(models, (m) => 1 / Math.sqrt(m.price));
  // Mostly mid-life vehicles, with a real chance of near-worn-out bargains.
  const km = roundTo(Math.random() < 0.25 ? between(750_000, 985_000) : between(15_000, 750_000), 100);
  return {
    id: uid(),
    modelId: model.id,
    km,
    price: roundTo(marketValue(model, km) * between(0.92, 1.08), 50),
    seller: pick(SELLERS),
  };
}

export function restockListings(): UsedListing[] {
  return VEHICLE_BUSINESSES.flatMap((b) => {
    const models = modelsOf(b);
    return Array.from({ length: GAME.marketListings }, () => usedListing(models));
  });
}
