import { BusinessInfo } from '../core/data/businesses';
import { BusinessId } from '../core/models/game.models';

export interface BusinessTheme {
  /** Icon tile: soft background + strong foreground. */
  tile: string;
  /** Solid chip. */
  solid: string;
  text: string;
  /** Soft gradient start for card headers. */
  wash: string;
}

// Full class strings (not built from parts) so Tailwind keeps them.
export const BUSINESS_THEME: Record<BusinessInfo['accent'], BusinessTheme> = {
  teal: { tile: 'bg-teal-50 text-teal-700', solid: 'bg-teal-700 text-white', text: 'text-teal-700', wash: 'from-teal-50' },
  sky: { tile: 'bg-sky-50 text-sky-700', solid: 'bg-sky-600 text-white', text: 'text-sky-700', wash: 'from-sky-50' },
  orange: { tile: 'bg-orange-50 text-orange-700', solid: 'bg-orange-600 text-white', text: 'text-orange-700', wash: 'from-orange-50' },
  rose: { tile: 'bg-rose-50 text-rose-700', solid: 'bg-rose-600 text-white', text: 'text-rose-700', wash: 'from-rose-50' },
  violet: { tile: 'bg-violet-50 text-violet-700', solid: 'bg-violet-600 text-white', text: 'text-violet-700', wash: 'from-violet-50' },
};

/** /b/<id> is what the business owns; /b/<id>/buy its shop; /b/<id>/v/<vehicle> one vehicle. */
export function businessLink(id: BusinessId, path = ''): string {
  return path ? `/b/${id}/${path}` : `/b/${id}`;
}
