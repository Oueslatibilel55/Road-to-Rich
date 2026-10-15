import { between, pick } from './random';

const STREETS = [
  'Oak Street', 'Maple Avenue', 'Harbor Road', 'Market Street', 'Elm Street', 'Park Lane', 'Station Road',
  'King Street', 'Queen Avenue', 'River Walk', 'Mill Lane', 'Church Street', 'High Street', 'Victoria Road',
  'Sunset Boulevard', 'Bridge Street', 'Garden Row', 'Liberty Avenue', 'Ocean Drive', 'Union Square',
];

const ROADS = ['Route 9', 'Route 66', 'Interstate 80', 'Highway 101', 'Coastal Highway', 'Ring Road', 'Airport Road'];

/** "24 Oak Street" — somewhere in town. */
export function streetAddress(taken: string[]): string {
  for (let i = 0; i < 20; i++) {
    const address = `${Math.floor(between(1, 180))} ${pick(STREETS)}`;
    if (!taken.includes(address)) return address;
  }
  return `${Math.floor(between(180, 400))} ${pick(STREETS)}`;
}

/** "Route 66, exit 14" — for highway sites. */
export function roadAddress(taken: string[]): string {
  for (let i = 0; i < 20; i++) {
    const address = `${pick(ROADS)}, exit ${Math.floor(between(2, 60))}`;
    if (!taken.includes(address)) return address;
  }
  return `${pick(ROADS)}, km ${Math.floor(between(10, 400))}`;
}
