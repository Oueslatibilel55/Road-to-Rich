import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { businessInfo } from '../core/data/businesses';
import { BusinessId, EventTone } from '../core/models/game.models';
import { GameStore } from '../core/state/game.store';
import { GameTimePipe, MoneyPipe } from '../core/util/format';
import { BUSINESS_THEME, businessLink } from './business-theme';
import { BUSINESS_ICON, ICONS, IconData } from './icons';

const TONE: Record<EventTone, { icon: IconData; classes: string }> = {
  info: { icon: ICONS.Info, classes: 'bg-sky-50 text-sky-700' },
  success: { icon: ICONS.Check, classes: 'bg-emerald-50 text-emerald-700' },
  warning: { icon: ICONS.TriangleAlert, classes: 'bg-amber-50 text-amber-700' },
  danger: { icon: ICONS.Siren, classes: 'bg-rose-50 text-rose-700' },
};

/** The event log, newest first, with one filter: which business. */
@Component({
  selector: 'app-activity-list',
  imports: [LucideAngularModule, RouterLink, GameTimePipe, MoneyPipe],
  template: `
    @if (store.openBusinesses().length > 1) {
      <div class="-mx-4 mb-4 flex gap-1.5 overflow-x-auto px-4 scrollbar-none sm:mx-0 sm:px-0">
        <button class="chip" [class.chip-on]="only() === null" (click)="only.set(null)">All</button>
        @for (b of store.openBusinesses(); track b.id) {
          <button class="chip" [class.chip-on]="only() === b.id" (click)="only.set(b.id)">{{ b.name }}</button>
        }
      </div>
    }

    <div class="card divide-y divide-line">
      @for (e of visible(); track e.id) {
        <div class="flex items-start gap-3 p-4">
          <span class="grid h-9 w-9 shrink-0 place-items-center rounded-lg" [class]="tone[e.tone].classes">
            <lucide-icon [img]="tone[e.tone].icon" [size]="16" />
          </span>
          <div class="min-w-0 flex-1">
            <p class="font-medium text-fg">{{ e.title }}</p>
            <p class="mt-0.5 text-sm text-fg-2">{{ e.detail }}</p>
            <p class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-fg-3">
              <span>{{ e.at | gameTime }}</span>
              @if (e.businessId) {
                <span class="inline-flex items-center gap-1" [class]="themeOf(e.businessId).text">
                  <lucide-icon [img]="iconOf(e.businessId)" [size]="11" /> {{ nameOf(e.businessId) }}
                </span>
              }
              @if (e.vehicleId && e.businessId && exists(e.vehicleId)) {
                <a [routerLink]="vehicleLink(e.businessId, e.vehicleId)" class="font-semibold text-brand-700 hover:text-brand-800">Open →</a>
              }
            </p>
          </div>
          @if (e.amount) {
            <span class="num shrink-0 text-sm font-semibold" [class]="e.amount > 0 ? 'text-emerald-700' : 'text-fg-2'">
              {{ e.amount > 0 ? '+' : '−' }}{{ abs(e.amount) | money: 'short' }}
            </span>
          }
        </div>
      } @empty {
        <p class="p-10 text-center text-sm text-fg-3">Nothing yet.</p>
      }
    </div>
  `,
  styles: `
    .chip {
      @apply shrink-0 rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-fg-2 hover:text-fg;
    }
    .chip-on {
      @apply border-brand-300 bg-brand-50 text-brand-800;
    }
  `,
})
export class ActivityListComponent {
  protected readonly store = inject(GameStore);
  protected readonly tone = TONE;
  protected readonly only = signal<BusinessId | null>(null);
  protected readonly abs = Math.abs;

  protected readonly visible = computed(() => {
    const scope = this.only();
    return this.store.events().filter((e) => !scope || e.businessId === scope);
  });

  private readonly ids = computed(() => new Set(this.store.vehicles().map((v) => v.id)));
  protected exists(id: string): boolean {
    return this.ids().has(id);
  }
  protected vehicleLink(b: BusinessId, id: string) {
    return businessLink(b, `v/${id}`);
  }
  protected themeOf(b: BusinessId) {
    return BUSINESS_THEME[businessInfo(b).accent];
  }
  protected iconOf(b: BusinessId) {
    return BUSINESS_ICON[businessInfo(b).icon];
  }
  protected nameOf(b: BusinessId) {
    return businessInfo(b).name;
  }
}
