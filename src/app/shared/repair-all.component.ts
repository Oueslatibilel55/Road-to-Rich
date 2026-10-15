import { Component, computed, inject, input, signal } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { businessInfo } from '../core/data/businesses';
import { modelName, vehicleModel } from '../core/data/vehicle-catalog';
import { BusinessId, Vehicle } from '../core/models/game.models';
import { GameStore } from '../core/state/game.store';
import { MoneyPipe } from '../core/util/format';
import { ICONS, VEHICLE_ICON } from './icons';
import { ModalComponent } from './modal.component';
import { classTile } from './vehicle-status';

/**
 * "Repair all" button + its sheet: every broken vehicle, what broke, what each repair
 * costs, and the total. Hidden when nothing is broken.
 */
@Component({
  selector: 'app-repair-all',
  imports: [LucideAngularModule, MoneyPipe, ModalComponent],
  template: `
    @if (broken().length) {
      <button class="btn-primary w-full sm:w-auto" (click)="open.set(true)">
        <lucide-icon [img]="icons.Wrench" [size]="16" />
        Repair all ({{ broken().length }}) · {{ total() | money }}
      </button>
    }

    @if (open()) {
      <app-modal title="Repair all" [subtitle]="broken().length + ' broken vehicle' + (broken().length > 1 ? 's' : '')" (closed)="open.set(false)">
        <ul class="divide-y divide-line rounded-2xl border border-line">
          @for (v of broken(); track v.id) {
            <li class="flex items-center gap-3 p-3">
              <span class="grid h-9 w-9 shrink-0 place-items-center rounded-lg" [class]="tile(v)">
                <lucide-icon [img]="icon(v)" [size]="18" />
              </span>
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-semibold text-fg">{{ name(v) }}</p>
                <p class="truncate text-xs text-fg-3">
                  {{ v.breakdown!.label }} · {{ v.name }}@if (showBusiness()) { · {{ businessName(v) }}}
                </p>
              </div>
              <p class="num shrink-0 text-sm font-semibold text-fg">{{ v.breakdown!.cost | money }}</p>
            </li>
          }
        </ul>

        <div class="mt-4 flex items-center justify-between rounded-2xl bg-sunken p-4">
          <p class="font-semibold text-fg">Total</p>
          <p class="num text-xl font-bold text-fg">{{ total() | money }}</p>
        </div>
        <p class="mt-2 text-xs text-fg-3">Each vehicle goes to the garage and is back at work when its repair is done.</p>

        <button class="btn-primary mt-4 w-full" [disabled]="store.cash() < total()" (click)="repair()">
          {{ store.cash() < total() ? 'Not enough cash' : 'Repair all for ' + (total() | money) }}
        </button>
      </app-modal>
    }
  `,
})
export class RepairAllComponent {
  /** One business only; every business when absent. */
  readonly businessId = input<BusinessId>();

  protected readonly store = inject(GameStore);
  protected readonly icons = ICONS;
  protected readonly open = signal(false);

  protected readonly broken = computed(() =>
    this.store.vehicles().filter((v) => v.status === 'broken' && v.breakdown && (!this.businessId() || v.businessId === this.businessId())),
  );
  protected readonly total = computed(() => this.broken().reduce((sum, v) => sum + v.breakdown!.cost, 0));
  protected readonly showBusiness = computed(() => !this.businessId() && new Set(this.broken().map((v) => v.businessId)).size > 1);

  protected name(v: Vehicle) {
    return modelName(vehicleModel(v.modelId));
  }
  protected icon(v: Vehicle) {
    return VEHICLE_ICON[vehicleModel(v.modelId).class];
  }
  protected tile(v: Vehicle) {
    return classTile(vehicleModel(v.modelId).class);
  }
  protected businessName(v: Vehicle) {
    return businessInfo(v.businessId).name;
  }

  protected repair(): void {
    if (this.store.repairAll(this.businessId())) this.open.set(false);
  }
}
