import { BusinessId } from '../models/game.models';

export interface BusinessInfo {
  id: BusinessId;
  name: string;
  /** One line for cards. */
  tagline: string;
  /** Price of the licence to open it. You can't afford them all at first. */
  openCost: number;
  /** What the business owns: vehicles (fleet) or sites (restaurants, stations). */
  assets: 'vehicles' | 'properties';
  /** Label of its "mine" tab and counts: "Fleet", "Restaurants". */
  assetsLabel: string;
  /** Not playable yet — shown as "coming soon". */
  comingSoon: boolean;
  icon: 'truck' | 'key' | 'utensils' | 'fuel' | 'building';
  /** Colour family the UI uses for this business (see shared/business-theme.ts). */
  accent: 'teal' | 'sky' | 'orange' | 'rose' | 'violet';
}

// Each business owns its own assets and has its own space in the app (/b/<id>).
export const BUSINESSES: readonly BusinessInfo[] = [
  {
    id: 'delivery',
    name: 'Delivery Company',
    tagline: 'Scooters to semi trucks on delivery shifts.',
    openCost: 0,
    assets: 'vehicles',
    assetsLabel: 'Vehicles',
    comingSoon: false,
    icon: 'truck',
    accent: 'teal',
  },
  {
    id: 'car-rental',
    name: 'Car Rental',
    tagline: 'Buy cars, rent them out by the day.',
    openCost: 20_000,
    assets: 'vehicles',
    assetsLabel: 'Cars',
    comingSoon: false,
    icon: 'key',
    accent: 'sky',
  },
  {
    id: 'restaurants',
    name: 'Restaurant Chain',
    tagline: 'Restaurants across town. Level them up, hire more staff.',
    openCost: 120_000,
    assets: 'properties',
    assetsLabel: 'Restaurants',
    comingSoon: false,
    icon: 'utensils',
    accent: 'orange',
  },
  {
    id: 'gas-stations',
    name: 'Gas Stations',
    tagline: 'Fuel stations with a brand partner. More pumps, more money.',
    openCost: 300_000,
    assets: 'properties',
    assetsLabel: 'Stations',
    comingSoon: false,
    icon: 'fuel',
    accent: 'rose',
  },
  {
    id: 'real-estate',
    name: 'Real Estate',
    tagline: 'Buy, renovate and rent out apartments.',
    openCost: 1_000_000,
    assets: 'properties',
    assetsLabel: 'Buildings',
    comingSoon: true,
    icon: 'building',
    accent: 'violet',
  },
];

export const BUSINESS_IDS = BUSINESSES.map((b) => b.id);

export function businessInfo(id: BusinessId): BusinessInfo {
  return BUSINESSES.find((b) => b.id === id)!;
}
