import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { businessInfo } from '../core/data/businesses';
import { vehicleModel } from '../core/data/vehicle-catalog';
import { isServiceDue } from '../core/engine/vehicle-rules';
import { BusinessId, Vehicle } from '../core/models/game.models';
import { GameStore } from '../core/state/game.store';
import { formatMoneyShort } from '../core/util/format';
import { businessLink } from './business-theme';
import { ICONS, VEHICLE_ICON } from './icons';

interface Item {
  vehicle: Vehicle;
  reason: string;
  action: string;
  tone: string;
  order: number;
}

/** What needs the player: broken and worn-out vehicles first, then services and idle ones. */
@Component({
  selector: 'app-attention-list',
  imports: [LucideAngularModule, RouterLink],
  template: `
    <ul class="divide-y divide-line">
      @for (a of items(); track a.vehicle.id) {
        <li>
          <a [routerLink]="link(a.vehicle)" class="-mx-2 flex items-center gap-3 rounded-xl px-2 py-3 hover:bg-sunken">
            <span class="grid h-9 w-9 shrink-0 place-items-center rounded-lg" [class]="a.tone">
              <lucide-icon [img]="icon(a.vehicle)" [size]="18" />
            </span>
            <span class="min-w-0 flex-1">
              <span class="block truncate text-sm font-medium text-fg">
                {{ a.vehicle.name }}
                @if (showBusiness()) {
                  <span class="font-normal text-fg-3"> · {{ businessName(a.vehicle.businessId) }}</span>
                }
              </span>
              <span class="block truncate text-xs text-fg-2">{{ a.reason }}</span>
            </span>
            <span class="text-xs font-semibold text-brand-700">{{ a.action }} →</span>
          </a>
        </li>
      } @empty {
        <li class="flex items-center gap-3 py-5 text-sm text-fg-2">
          <span class="grid h-9 w-9 place-items-center rounded-lg bg-emerald-50 text-emerald-700"><lucide-icon [img]="icons.Check" [size]="18" /></span>
          {{ empty() }}
        </li>
      }
    </ul>
  `,
})
export class AttentionListComponent {
  /** Limit to one business; all businesses when absent. */
  readonly businessId = input<BusinessId>();
  readonly max = input(8);
  /** Only what stops income (breakdowns, worn out) — not services or parked vehicles. */
  readonly problemsOnly = input(false);

  private readonly store = inject(GameStore);
  protected readonly icons = ICONS;
  protected readonly showBusiness = computed(() => !this.businessId() && this.store.openBusinesses().length > 1);

  protected readonly items = computed(() => {
    const scope = this.businessId();
    const items: Item[] = [];
    for (const v of this.store.vehicles()) {
      if (scope && v.businessId !== scope) continue;
      if (v.status === 'broken' && v.breakdown) {
        items.push({ vehicle: v, reason: `${v.breakdown.label} · repair ${formatMoneyShort(v.breakdown.cost)}`, action: 'Repair', tone: 'bg-rose-50 text-rose-700', order: 0 });
      } else if (v.status === 'worn-out') {
        items.push({ vehicle: v, reason: 'Reached 1,000,000 km', action: 'Overhaul', tone: 'bg-rose-50 text-rose-700', order: 1 });
      } else if (this.problemsOnly()) {
        continue;
      } else if (v.status === 'active' && isServiceDue(v)) {
        items.push({ vehicle: v, reason: 'Service due — breakdowns get likelier', action: 'Service', tone: 'bg-amber-50 text-amber-700', order: 2 });
      } else if (v.status === 'active' && v.assignment === 'idle') {
        items.push({ vehicle: v, reason: 'Parked — it earns nothing', action: 'Assign', tone: 'bg-stone-100 text-stone-600', order: 3 });
      }
    }
    return items.sort((a, b) => a.order - b.order).slice(0, this.max());
  });

  protected readonly empty = computed(() => {
    const has = this.store.vehicles().some((v) => !this.businessId() || v.businessId === this.businessId());
    return has ? 'Everything is running. Nothing to fix.' : 'No vehicles yet.';
  });

  protected link(v: Vehicle) {
    return businessLink(v.businessId, `v/${v.id}`);
  }
  protected icon(v: Vehicle) {
    return VEHICLE_ICON[vehicleModel(v.modelId).class];
  }
  protected businessName(id: BusinessId) {
    return businessInfo(id).name;
  }
}
