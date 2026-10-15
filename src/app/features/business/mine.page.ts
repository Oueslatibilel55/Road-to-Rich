import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { businessInfo } from '../../core/data/businesses';
import { BusinessId, Vehicle } from '../../core/models/game.models';
import { GameStore } from '../../core/state/game.store';
import { BUSINESS_THEME } from '../../shared/business-theme';
import { BUSINESS_ICON, ICONS } from '../../shared/icons';
import { VehicleCardComponent } from '../../shared/vehicle-card.component';
import { RepairAllComponent } from '../../shared/repair-all.component';
import { PropertyCardComponent } from './property-card.component';

/** What a business owns: its vehicles, or its restaurants / stations. */
@Component({
  selector: 'app-mine-page',
  imports: [LucideAngularModule, RouterLink, VehicleCardComponent, PropertyCardComponent, RepairAllComponent],
  template: `
    @if (count() === 0) {
      <div class="card flex flex-col items-center p-10 text-center">
        <span class="grid h-14 w-14 place-items-center rounded-2xl" [class]="theme().tile"><lucide-icon [img]="icon()" [size]="26" /></span>
        <h2 class="mt-4 font-semibold text-fg">Nothing here yet</h2>
        <p class="mt-1 max-w-sm text-sm text-fg-2">{{ info().tagline }}</p>
        <a routerLink="buy" class="btn-primary mt-5"><lucide-icon [img]="icons.Store" [size]="16" /> Buy your first one</a>
      </div>
    } @else if (info().assets === 'vehicles') {
      @if (stats().alerts > 0) {
        <div class="mb-4"><app-repair-all [businessId]="businessId()" /></div>
      }
      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        @for (v of vehicles(); track v.id) {
          <app-vehicle-card [vehicle]="v" />
        }
      </div>
    } @else {
      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        @for (p of properties(); track p.id) {
          <app-property-card [property]="p" [tile]="theme().tile" [icon]="icon()" />
        }
      </div>
    }
  `,
})
export class MinePage {
  readonly businessId = input.required<BusinessId>();

  private readonly store = inject(GameStore);
  protected readonly icons = ICONS;
  protected readonly info = computed(() => businessInfo(this.businessId()));
  protected readonly theme = computed(() => BUSINESS_THEME[this.info().accent]);
  protected readonly icon = computed(() => BUSINESS_ICON[this.info().icon]);
  protected readonly stats = computed(() => this.store.businessStats()[this.businessId()]);

  /** Broken and worn-out first, then in the order they were bought. */
  protected readonly vehicles = computed(() =>
    this.store
      .vehicles()
      .filter((v) => v.businessId === this.businessId())
      .sort((a, b) => rank(a) - rank(b)),
  );
  protected readonly properties = computed(() => this.store.properties().filter((p) => p.businessId === this.businessId()));
  protected readonly count = computed(() => this.vehicles().length + this.properties().length);
}

function rank(v: Vehicle): number {
  return v.status === 'broken' ? 0 : v.status === 'worn-out' ? 1 : 2;
}
