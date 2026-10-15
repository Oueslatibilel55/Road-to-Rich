import { BusinessId, PropertyType, PropertyTypeId } from '../models/game.models';

// Restaurants and gas stations. Each site is bought at a random address, then levelled up:
// every level adds workers and income (see engine/property-rules.ts).

export const PROPERTY_TYPES: readonly PropertyType[] = [
  // ── Restaurant Chain ─────────────────────────────────────────────────────
  { id: 'burger', businessId: 'restaurants', name: 'Burger Joint', price: 180_000, incomePerDay: 1_900, staff: 6, staffPerLevel: 2, levelPerk: '+2 workers' },
  { id: 'pizzeria', businessId: 'restaurants', name: 'Pizzeria', price: 260_000, incomePerDay: 2_700, staff: 8, staffPerLevel: 2, levelPerk: '+2 workers' },
  { id: 'sushi', businessId: 'restaurants', name: 'Sushi Bar', price: 380_000, incomePerDay: 3_900, staff: 10, staffPerLevel: 3, levelPerk: '+3 workers' },
  { id: 'steakhouse', businessId: 'restaurants', name: 'Steakhouse', price: 550_000, incomePerDay: 5_600, staff: 14, staffPerLevel: 3, levelPerk: '+3 workers' },

  // ── Gas Stations ─────────────────────────────────────────────────────────
  { id: 'neighborhood', businessId: 'gas-stations', name: 'Neighborhood Station', price: 650_000, incomePerDay: 6_500, staff: 4, staffPerLevel: 1, levelPerk: '+2 pumps' },
  { id: 'town', businessId: 'gas-stations', name: 'Town Station & Shop', price: 1_200_000, incomePerDay: 12_000, staff: 8, staffPerLevel: 2, levelPerk: '+2 pumps' },
  { id: 'highway', businessId: 'gas-stations', name: 'Highway Service Area', price: 2_500_000, incomePerDay: 25_000, staff: 16, staffPerLevel: 3, levelPerk: '+4 pumps' },
];

export const MAX_PROPERTY_LEVEL = 10;

/** Fuel brands a station can partner with — picked at random when it is bought. */
export const FUEL_BRANDS = ['Shell', 'TotalEnergies', 'BP', 'Esso', 'Chevron', 'Texaco', 'Q8', 'Agip'] as const;

const BY_ID = new Map(PROPERTY_TYPES.map((t) => [t.id, t]));

export function propertyType(id: PropertyTypeId): PropertyType {
  const type = BY_ID.get(id);
  if (!type) throw new Error(`Unknown property type ${id}`);
  return type;
}

export function typesOf(businessId: BusinessId): PropertyType[] {
  return PROPERTY_TYPES.filter((t) => t.businessId === businessId);
}
