import { MAX_PROPERTY_LEVEL, propertyType } from '../data/property-catalog';
import { Property } from '../models/game.models';
import { roundTo } from './random';

// Pure rules for restaurants and gas stations.

/** Each level above 1 adds 35 % of the base income. */
export function propertyIncomePerDay(p: Pick<Property, 'typeId' | 'level'>): number {
  return propertyType(p.typeId).incomePerDay * (1 + 0.35 * (p.level - 1));
}

export function propertyStaff(p: Pick<Property, 'typeId' | 'level'>): number {
  const t = propertyType(p.typeId);
  return t.staff + t.staffPerLevel * (p.level - 1);
}

/** Level n → n+1 costs 25 % of the site price × 1.35^(n−1). Null at the top level. */
export function upgradeCost(p: Pick<Property, 'typeId' | 'level'>): number | null {
  if (p.level >= MAX_PROPERTY_LEVEL) return null;
  return roundTo(propertyType(p.typeId).price * 0.25 * Math.pow(1.35, p.level - 1), 1_000);
}

/** A buyer pays 70 % of everything put into the site. */
export function propertySellValue(p: Property): number {
  return roundTo(p.invested * 0.7, 1_000);
}

/** What the site is worth for net worth: the same as its sell value. */
export const propertyValue = propertySellValue;
