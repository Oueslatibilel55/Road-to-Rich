import { Component, computed, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { businessInfo } from '../../core/data/businesses';
import { typesOf } from '../../core/data/property-catalog';
import { modelName, modelsOf, vehicleModel } from '../../core/data/vehicle-catalog';
import { formatDuration } from '../../core/engine/clock';
import { dailyEstimate, workingJob } from '../../core/engine/vehicle-rules';
import { BusinessId, PropertyType, UsedListing, VehicleModel } from '../../core/models/game.models';
import { GameStore } from '../../core/state/game.store';
import { KmPipe, MoneyPipe } from '../../core/util/format';
import { BUSINESS_THEME, businessLink } from '../../shared/business-theme';
import { BUSINESS_ICON, ICONS, VEHICLE_ICON } from '../../shared/icons';
import { ModalComponent } from '../../shared/modal.component';
import { classTile, wearColor } from '../../shared/vehicle-status';
import { VehicleBuySheetComponent, VehiclePurchase } from './vehicle-buy-sheet.component';

/** The shop of a business: vehicles (new or used) or new sites. One price, one income each. */
@Component({
  selector: 'app-buy-page',
  imports: [LucideAngularModule, MoneyPipe, KmPipe, ModalComponent, VehicleBuySheetComponent],
  template: `
    @if (info().assets === 'vehicles') {
      <div class="segmented mb-5 flex sm:inline-flex">
        <button [class.active]="tab() === 'new'" (click)="tab.set('new')">New</button>
        <button [class.active]="tab() === 'used'" (click)="tab.set('used')">Used · cheaper, more worn</button>
      </div>

      <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        @if (tab() === 'new') {
          @for (m of models(); track m.id) {
            <article class="card flex items-center gap-3 p-4">
              <span class="grid h-12 w-12 shrink-0 place-items-center rounded-xl" [class]="tileOf(m)"><lucide-icon [img]="iconOf(m)" [size]="24" /></span>
              <div class="min-w-0 flex-1">
                <p class="truncate font-semibold text-fg">{{ nameOf(m) }}</p>
                <p class="num text-sm font-semibold text-emerald-700">+{{ incomeOf(m) | money }} <span class="font-sans font-normal text-fg-3">/ day</span></p>
              </div>
              <button class="btn-primary shrink-0 !px-3" [disabled]="store.cash() < m.price" (click)="purchase.set({ modelId: m.id, price: m.price, km: 0 })">
                {{ m.price | money: 'short' }}
              </button>
            </article>
          }
        } @else {
          @for (l of listings(); track l.id) {
            @let m = modelOfListing(l);
            <article class="card p-4">
              <div class="flex items-center gap-3">
                <span class="grid h-12 w-12 shrink-0 place-items-center rounded-xl" [class]="tileOf(m)"><lucide-icon [img]="iconOf(m)" [size]="24" /></span>
                <div class="min-w-0 flex-1">
                  <p class="truncate font-semibold text-fg">{{ nameOf(m) }}</p>
                  <p class="num text-sm font-semibold text-emerald-700">+{{ incomeOf(m) | money }} <span class="font-sans font-normal text-fg-3">/ day</span></p>
                </div>
                <button class="btn-primary shrink-0 !px-3" [disabled]="store.cash() < l.price" (click)="purchase.set({ modelId: l.modelId, price: l.price, km: l.km, listingId: l.id })">
                  {{ l.price | money: 'short' }}
                </button>
              </div>
              <div class="bar mt-3"><span [style.width.%]="l.km / 10000" [class]="wear(l.km)"></span></div>
              <p class="num mt-1.5 text-xs text-fg-2">{{ l.km | km }} <span class="font-sans text-fg-3">of 1,000,000</span></p>
            </article>
          } @empty {
            <p class="col-span-full py-8 text-center text-sm text-fg-3">The lot is empty.</p>
          }
        }
      </div>
      @if (tab() === 'used') {
        <p class="mt-4 text-xs text-fg-3">New stock in {{ restockIn() }}. High mileage means more breakdowns.</p>
      }
    } @else {
      <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        @for (t of types(); track t.id) {
          <article class="card flex flex-col p-5">
            <div class="flex items-center gap-3">
              <span class="grid h-12 w-12 shrink-0 place-items-center rounded-xl" [class]="theme().tile"><lucide-icon [img]="businessIcon()" [size]="24" /></span>
              <div class="min-w-0">
                <p class="font-semibold text-fg">{{ t.name }}</p>
                <p class="flex items-center gap-1.5 text-xs text-fg-3"><lucide-icon [img]="icons.Users" [size]="12" /> {{ t.staff }} workers</p>
              </div>
            </div>
            <p class="num mt-4 text-lg font-bold text-emerald-700">+{{ t.incomePerDay | money }} <span class="font-sans text-xs font-normal text-fg-3">/ day</span></p>
            <button class="btn-primary mt-4 w-full" [disabled]="store.cash() < t.price" (click)="site.set(t)">
              Buy · {{ t.price | money: 'short' }}
            </button>
          </article>
        }
      </div>
    }

    @if (purchase(); as req) {
      <app-vehicle-buy-sheet [request]="req" (closed)="bought()" />
    }

    @if (site(); as t) {
      <app-modal [title]="'Buy a ' + t.name + '?'" subtitle="It opens at a random address in town." (closed)="site.set(null)">
        <div class="flex items-center justify-between rounded-2xl bg-sunken p-4">
          <p class="num text-2xl font-bold text-fg">{{ t.price | money }}</p>
          <p class="num text-sm font-semibold text-emerald-700">+{{ t.incomePerDay | money }} / day</p>
        </div>
        <button class="btn-primary mt-5 w-full" [disabled]="store.cash() < t.price" (click)="buySite(t)">Buy</button>
      </app-modal>
    }
  `,
})
export class BuyPage {
  readonly businessId = input.required<BusinessId>();

  protected readonly store = inject(GameStore);
  private readonly router = inject(Router);
  protected readonly icons = ICONS;
  protected readonly tab = signal<'new' | 'used'>('new');
  protected readonly purchase = signal<VehiclePurchase | null>(null);
  protected readonly site = signal<PropertyType | null>(null);

  protected readonly info = computed(() => businessInfo(this.businessId()));
  protected readonly theme = computed(() => BUSINESS_THEME[this.info().accent]);
  protected readonly businessIcon = computed(() => BUSINESS_ICON[this.info().icon]);
  protected readonly models = computed(() => modelsOf(this.businessId()));
  protected readonly types = computed(() => typesOf(this.businessId()));
  protected readonly listings = computed(() =>
    this.store.market().listings.filter((l) => vehicleModel(l.modelId).businessId === this.businessId()),
  );
  protected readonly restockIn = computed(() => formatDuration(this.store.market().refreshAt - this.store.clock()));

  protected nameOf(m: VehicleModel) {
    return modelName(m);
  }
  protected iconOf(m: VehicleModel) {
    return VEHICLE_ICON[m.class];
  }
  protected tileOf(m: VehicleModel) {
    return classTile(m.class);
  }
  /** What it earns with a hired driver (delivery) or rented out. */
  protected incomeOf(m: VehicleModel) {
    return dailyEstimate(m, workingJob(m), 'hired').net;
  }
  protected modelOfListing(l: UsedListing) {
    return vehicleModel(l.modelId);
  }
  protected wear(km: number) {
    return wearColor(km);
  }

  protected bought(): void {
    this.purchase.set(null);
  }

  protected buySite(t: PropertyType): void {
    if (this.store.buyProperty(t.id)) {
      this.site.set(null);
      this.router.navigateByUrl(businessLink(this.businessId()));
    }
  }
}
