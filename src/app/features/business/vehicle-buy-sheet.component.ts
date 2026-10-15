import { Component, computed, inject, input, output, signal } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { modelName, vehicleModel } from '../../core/data/vehicle-catalog';
import { dailyEstimate, workingJob } from '../../core/engine/vehicle-rules';
import { DriverKind, VehicleModelId } from '../../core/models/game.models';
import { GameStore } from '../../core/state/game.store';
import { KmPipe, MoneyPipe } from '../../core/util/format';
import { ICONS, VEHICLE_ICON } from '../../shared/icons';
import { ModalComponent } from '../../shared/modal.component';
import { classTile } from '../../shared/vehicle-status';

export interface VehiclePurchase {
  modelId: VehicleModelId;
  price: number;
  km: number;
  /** Set for a used listing. */
  listingId?: string;
}

/** Confirm a vehicle purchase. Delivery vehicles ask who drives; that's the only choice. */
@Component({
  selector: 'app-vehicle-buy-sheet',
  imports: [LucideAngularModule, ModalComponent, MoneyPipe, KmPipe],
  template: `
    <app-modal [title]="name()" [subtitle]="request().listingId ? 'Used · ' + (request().km | km) : 'Brand new'" (closed)="closed.emit()">
      <div class="flex items-center gap-4 rounded-2xl bg-sunken p-4">
        <span class="grid h-14 w-14 place-items-center rounded-2xl" [class]="tile()">
          <lucide-icon [img]="icon()" [size]="28" />
        </span>
        <div>
          <p class="num text-2xl font-bold text-fg">{{ request().price | money }}</p>
          <p class="num text-sm font-semibold text-emerald-700">+{{ income() | money }} <span class="font-sans font-normal text-fg-3">/ day</span></p>
        </div>
      </div>

      @if (isDelivery()) {
        <p class="label mb-2 mt-5">Who drives?</p>
        <div class="segmented flex w-full">
          <button [class.active]="driver() === 'hired'" (click)="driver.set('hired')">
            <lucide-icon [img]="icons.Users" [size]="14" /> A hired driver
          </button>
          <button [class.active]="driver() === 'owner'" (click)="driver.set('owner')">
            <lucide-icon [img]="icons.UserRound" [size]="14" /> Me
          </button>
        </div>
        <p class="mt-2 text-xs text-fg-3">
          @if (driver() === 'owner') {
            No wage to pay. You can only drive one vehicle@if (store.ownerVehicle()) { — {{ store.ownerVehicle()!.name }} gets a hired driver}.
          } @else {
            Works the 08:00–20:00 delivery shift.
          }
        </p>
      }

      <button class="btn-primary mt-5 w-full" [disabled]="store.cash() < request().price" (click)="confirm()">
        {{ store.cash() < request().price ? 'Not enough cash' : 'Buy for ' + (request().price | money) }}
      </button>
    </app-modal>
  `,
})
export class VehicleBuySheetComponent {
  readonly request = input.required<VehiclePurchase>();
  readonly closed = output<void>();

  protected readonly store = inject(GameStore);
  protected readonly icons = ICONS;
  protected readonly driver = signal<DriverKind>('hired');

  protected readonly model = computed(() => vehicleModel(this.request().modelId));
  protected readonly name = computed(() => modelName(this.model()));
  protected readonly icon = computed(() => VEHICLE_ICON[this.model().class]);
  protected readonly tile = computed(() => classTile(this.model().class));
  protected readonly isDelivery = computed(() => workingJob(this.model()) === 'delivery');
  protected readonly income = computed(() => dailyEstimate(this.model(), workingJob(this.model()), this.driver()).net);

  protected confirm(): void {
    const req = this.request();
    const opts = { assignment: workingJob(this.model()), driver: this.isDelivery() ? this.driver() : ('hired' as const) };
    const ok = req.listingId ? this.store.buyUsed(req.listingId, opts) : this.store.buyNew(req.modelId, opts);
    if (ok) this.closed.emit();
  }
}
