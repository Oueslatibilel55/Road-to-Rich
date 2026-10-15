import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { modelName, vehicleModel } from '../core/data/vehicle-catalog';
import { dailyEstimate, isServiceDue, wearOf } from '../core/engine/vehicle-rules';
import { Vehicle } from '../core/models/game.models';
import { GameStore } from '../core/state/game.store';
import { KmPipe, MoneyPipe } from '../core/util/format';
import { businessLink } from './business-theme';
import { ICONS, VEHICLE_ICON } from './icons';
import { classTile, vehicleStatus, wearColor } from './vehicle-status';

/** A vehicle at a glance: what it is, whether it works, its mileage and what it earns. */
@Component({
  selector: 'app-vehicle-card',
  imports: [LucideAngularModule, RouterLink, MoneyPipe, KmPipe],
  template: `
    <div class="card card-hover overflow-hidden" [class]="needsAction() ? '!border-rose-300 ring-2 ring-rose-100' : ''">
    <a [routerLink]="link()" class="block p-4">
      <div class="flex items-center gap-3">
        <span class="grid h-11 w-11 shrink-0 place-items-center rounded-xl" [class]="tile()">
          <lucide-icon [img]="icon()" [size]="22" />
        </span>
        <div class="min-w-0 flex-1">
          <p class="truncate font-semibold text-fg">{{ name() }}</p>
          <p class="truncate text-xs text-fg-3">{{ vehicle().name }} · {{ vehicle().plate }}</p>
        </div>
        <span class="pill shrink-0" [class]="status().classes">
          <span class="h-1.5 w-1.5 rounded-full" [class]="status().dot" [class.animate-pulse-soft]="status().pulse"></span>
          {{ status().label }}
        </span>
      </div>

      <div class="mt-4">
        <div class="bar"><span [style.width.%]="wear() * 100" [class]="wearColor()"></span></div>
        <div class="mt-2 flex items-center justify-between text-xs">
          <span class="num text-fg-2">
            {{ vehicle().km | km }}
            @if (serviceDue()) {
              <span class="ml-1 font-sans font-semibold text-amber-700">· service due</span>
            }
          </span>
          <span class="num text-sm font-semibold" [class]="net() > 0 ? 'text-emerald-700' : 'text-fg-3'">
            {{ net() > 0 ? '+' + (net() | money) + ' / day' : '—' }}
          </span>
        </div>
      </div>
    </a>
    @if (vehicle().status === 'broken' && vehicle().breakdown) {
      <div class="flex items-center gap-3 border-t border-rose-100 bg-rose-50 px-4 py-2.5">
        <p class="min-w-0 flex-1 truncate text-xs font-medium text-rose-800">{{ vehicle().breakdown!.label }}</p>
        <button class="btn-primary btn-sm shrink-0" [disabled]="store.cash() < vehicle().breakdown!.cost" (click)="store.repair(vehicle().id, false)">
          <lucide-icon [img]="icons.Wrench" [size]="13" /> Repair · {{ vehicle().breakdown!.cost | money }}
        </button>
      </div>
    }
    </div>
  `,
})
export class VehicleCardComponent {
  readonly vehicle = input.required<Vehicle>();

  protected readonly store = inject(GameStore);
  protected readonly icons = ICONS;

  protected readonly link = computed(() => businessLink(this.vehicle().businessId, `v/${this.vehicle().id}`));
  protected readonly model = computed(() => vehicleModel(this.vehicle().modelId));
  protected readonly name = computed(() => modelName(this.model()));
  protected readonly icon = computed(() => VEHICLE_ICON[this.model().class]);
  protected readonly tile = computed(() => classTile(this.model().class));
  protected readonly status = computed(() => vehicleStatus(this.vehicle(), this.store.clock()));
  protected readonly wear = computed(() => wearOf(this.vehicle().km));
  protected readonly wearColor = computed(() => wearColor(this.vehicle().km));
  protected readonly serviceDue = computed(() => this.vehicle().status === 'active' && isServiceDue(this.vehicle()));
  protected readonly needsAction = computed(() => this.vehicle().status === 'broken' || this.vehicle().status === 'worn-out');
  protected readonly net = computed(() => {
    const v = this.vehicle();
    return dailyEstimate(this.model(), v.status === 'active' ? v.assignment : 'idle', v.driver).net;
  });
}
