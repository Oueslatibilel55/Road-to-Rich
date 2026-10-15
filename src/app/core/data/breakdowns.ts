import { BreakdownType } from '../models/game.models';

// Breakdown table. A breakdown is rolled by the engine (see engine/vehicle-rules.ts); which
// one happens is weighted, and worn vehicles lean towards the expensive ones.

export const BREAKDOWN_TYPES: readonly BreakdownType[] = [
  { id: 'flat-tire',   label: 'Flat tyre',            severity: 'minor',    costShare: 0.003, minCost: 40,  hours: 2,  weight: 30, wearWeight: 0 },
  { id: 'battery',     label: 'Dead battery',         severity: 'minor',    costShare: 0.006, minCost: 90,  hours: 3,  weight: 20, wearWeight: 4 },
  { id: 'brakes',      label: 'Worn-out brakes',      severity: 'major',    costShare: 0.012, minCost: 150, hours: 6,  weight: 15, wearWeight: 8 },
  { id: 'electrical',  label: 'Electrical fault',     severity: 'major',    costShare: 0.015, minCost: 200, hours: 8,  weight: 10, wearWeight: 6 },
  { id: 'overheating', label: 'Engine overheating',   severity: 'major',    costShare: 0.02,  minCost: 250, hours: 10, weight: 12, wearWeight: 10 },
  { id: 'clutch',      label: 'Clutch failure',       severity: 'major',    costShare: 0.035, minCost: 400, hours: 18, weight: 6,  wearWeight: 10 },
  { id: 'gearbox',     label: 'Gearbox failure',      severity: 'critical', costShare: 0.06,  minCost: 600, hours: 36, weight: 4,  wearWeight: 14 },
  { id: 'engine',      label: 'Engine failure',       severity: 'critical', costShare: 0.1,   minCost: 900, hours: 72, weight: 2,  wearWeight: 16 },
];
