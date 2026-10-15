import { Component, computed, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { GAME } from '../../core/data/game-constants';
import { modelName, vehicleModel } from '../../core/data/vehicle-catalog';
import { dailyEstimate, isServiceDue, overhaulCost, repairQuote, sellValue, wearOf, workingJob } from '../../core/engine/vehicle-rules';
import { BusinessId } from '../../core/models/game.models';
import { GameStore } from '../../core/state/game.store';
import { KmPipe, MoneyPipe } from '../../core/util/format';
import { businessLink } from '../../shared/business-theme';
import { ICONS, VEHICLE_ICON } from '../../shared/icons';
import { ModalComponent } from '../../shared/modal.component';
import { classTile, vehicleStatus, wearColor } from '../../shared/vehicle-status';

/** One vehicle: is it working, what it earns, its mileage — and the buttons that matter. */
@Component({
  selector: 'app-vehicle-page',
  imports: [LucideAngularModule, RouterLink, MoneyPipe, KmPipe, ModalComponent],
  template: `
    <a [routerLink]="back()" class="mb-4 inline-flex items-center gap-1 text-sm font-medium text-fg-3 hover:text-fg">
      <lucide-icon [img]="icons.ChevronLeft" [size]="16" /> Back
    </a>

    @if (vehicle(); as v) {
      <div class="mx-auto max-w-xl space-y-4">
        <!-- Identity + income -->
        <section class="card p-5">
          <div class="flex items-center gap-4">
            <span class="grid h-14 w-14 shrink-0 place-items-center rounded-2xl" [class]="tile()">
              <lucide-icon [img]="icon()" [size]="28" />
            </span>
            <div class="min-w-0 flex-1">
              <h2 class="truncate font-display text-xl font-bold text-fg">{{ name() }}</h2>
              <button class="text-xs text-fg-3 hover:text-fg" (click)="renaming.set(true)">{{ v.name }} · {{ v.plate }} ✎</button>
            </div>
            <span class="pill" [class]="status().classes">
              <span class="h-1.5 w-1.5 rounded-full" [class]="status().dot" [class.animate-pulse-soft]="status().pulse"></span>
              {{ status().label }}
            </span>
          </div>
          <p class="num mt-4 text-3xl font-bold" [class]="income() > 0 ? 'text-emerald-700' : 'text-fg-3'">
            {{ income() > 0 ? '+' + (income() | money) : '$0' }} <span class="font-sans text-sm font-normal text-fg-3">/ day</span>
          </p>
        </section>

        <!-- What needs doing -->
        @if (v.status === 'broken' && v.breakdown) {
          <section class="rounded-2xl border border-rose-200 bg-rose-50 p-5">
            <p class="flex items-center gap-2 font-semibold text-rose-900"><lucide-icon [img]="icons.Siren" [size]="18" /> {{ v.breakdown.label }}</p>
            <p class="mt-1 text-sm text-rose-800/80">It earns nothing until it's repaired.</p>
            <div class="mt-4 grid grid-cols-2 gap-2">
              <button class="btn-primary" [disabled]="store.cash() < normal().cost" (click)="store.repair(v.id, false)">
                Repair · {{ normal().cost | money }}
              </button>
              <button class="btn-warn" [disabled]="store.cash() < express().cost" (click)="store.repair(v.id, true)">
                <lucide-icon [img]="icons.Zap" [size]="15" /> Fast · {{ express().cost | money }}
              </button>
            </div>
            <p class="mt-2 text-center text-xs text-rose-800/70">{{ normal().hours }} h at the garage, or {{ express().hours }} h fast</p>
          </section>
        } @else if (v.status === 'worn-out') {
          <section class="rounded-2xl border border-rose-200 bg-rose-50 p-5">
            <p class="flex items-center gap-2 font-semibold text-rose-900"><lucide-icon [img]="icons.Gauge" [size]="18" /> 1,000,000 km — worn out</p>
            <p class="mt-1 text-sm text-rose-800/80">Rebuild the engine to reset it to 0 km, or scrap it.</p>
            <div class="mt-4 grid grid-cols-2 gap-2">
              <button class="btn-primary" [disabled]="store.cash() < overhaulPrice()" (click)="store.overhaul(v.id)">Overhaul · {{ overhaulPrice() | money: 'short' }}</button>
              <button class="btn-ghost" (click)="confirmSell.set(true)">Scrap · {{ offer() | money: 'short' }}</button>
            </div>
          </section>
        } @else if (v.status === 'in-garage' && v.garage) {
          <section class="rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <p class="flex items-center gap-2 font-semibold text-amber-950"><lucide-icon [img]="icons.Wrench" [size]="18" /> At the garage</p>
            <div class="bar mt-3 !h-2 !bg-amber-100"><span class="bg-amber-500" [style.width.%]="garageProgress() * 100"></span></div>
          </section>
        }

        <!-- Job -->
        @if (v.status === 'active') {
          <section class="card p-5">
            <div class="segmented flex w-full">
              <button [class.active]="v.assignment !== 'idle'" (click)="store.setAssignment(v.id, job())">
                <lucide-icon [img]="job() === 'delivery' ? icons.Package : icons.KeyRound" [size]="14" />
                {{ job() === 'delivery' ? 'Delivering' : 'Rented out' }}
              </button>
              <button [class.active]="v.assignment === 'idle'" (click)="store.setAssignment(v.id, 'idle')">
                <lucide-icon [img]="icons.Warehouse" [size]="14" /> Parked
              </button>
            </div>
            @if (v.assignment === 'delivery') {
              <div class="segmented mt-2 flex w-full">
                <button [class.active]="v.driver === 'hired'" (click)="store.setDriver(v.id, 'hired')">
                  <lucide-icon [img]="icons.Users" [size]="14" /> Hired driver
                </button>
                <button [class.active]="v.driver === 'owner'" (click)="store.setDriver(v.id, 'owner')">
                  <lucide-icon [img]="icons.UserRound" [size]="14" /> I drive
                </button>
              </div>
            }
          </section>
        }

        <!-- Condition -->
        <section class="card p-5">
          <div class="flex items-baseline justify-between">
            <p class="label">Odometer</p>
            <p class="num font-semibold text-fg">{{ v.km | km }}</p>
          </div>
          <div class="bar mt-2 !h-2"><span [style.width.%]="wear() * 100" [class]="wearBar()"></span></div>
          <div class="mt-4 flex items-center justify-between gap-3">
            <p class="text-sm" [class]="serviceDue() ? 'font-semibold text-amber-700' : 'text-fg-2'">
              {{ serviceDue() ? 'Service due' : 'Service OK' }}
            </p>
            <button class="btn-ghost btn-sm" [disabled]="v.status !== 'active' || store.cash() < model()!.serviceCost" (click)="store.service(v.id)">
              <lucide-icon [img]="icons.ShieldCheck" [size]="14" /> Service · {{ model()!.serviceCost | money }}
            </button>
          </div>
        </section>

        @if (v.status !== 'worn-out') {
          <button class="w-full py-2 text-sm font-medium text-fg-3 hover:text-rose-700 disabled:opacity-40" [disabled]="v.status === 'in-garage'" (click)="confirmSell.set(true)">
            Sell for {{ offer() | money }}
          </button>
        }
      </div>

      @if (confirmSell()) {
        <app-modal [title]="(v.status === 'worn-out' ? 'Scrap ' : 'Sell ') + v.name + '?'" (closed)="confirmSell.set(false)">
          <p class="mb-4 text-sm text-fg-2">You get <span class="num font-semibold text-fg">{{ offer() | money }}</span>.</p>
          <div class="flex gap-2">
            <button class="btn-ghost flex-1" (click)="confirmSell.set(false)">Keep it</button>
            <button class="btn-danger flex-1" (click)="sell()">Sell</button>
          </div>
        </app-modal>
      }

      @if (renaming()) {
        <app-modal title="Rename" (closed)="renaming.set(false)">
          <input
            #name
            class="w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-fg outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
            [value]="v.name"
            maxlength="24"
            (keydown.enter)="rename(name.value)"
          />
          <button class="btn-primary mt-3 w-full" (click)="rename(name.value)">Save</button>
        </app-modal>
      }
    } @else {
      <div class="card p-10 text-center text-sm text-fg-2">This vehicle is no longer yours.</div>
    }
  `,
})
export class VehiclePage {
  readonly businessId = input.required<BusinessId>();
  readonly id = input.required<string>();

  protected readonly store = inject(GameStore);
  private readonly router = inject(Router);
  protected readonly icons = ICONS;
  protected readonly confirmSell = signal(false);
  protected readonly renaming = signal(false);

  protected readonly back = computed(() => businessLink(this.businessId()));
  protected readonly vehicle = computed(() => this.store.vehicles().find((v) => v.id === this.id()) ?? null);
  protected readonly model = computed(() => {
    const v = this.vehicle();
    return v ? vehicleModel(v.modelId) : null;
  });
  protected readonly name = computed(() => modelName(this.model()!));
  protected readonly icon = computed(() => VEHICLE_ICON[this.model()!.class]);
  protected readonly tile = computed(() => classTile(this.model()!.class));
  protected readonly job = computed(() => workingJob(this.model()!));
  protected readonly status = computed(() => vehicleStatus(this.vehicle()!, this.store.clock()));
  protected readonly income = computed(() => {
    const v = this.vehicle()!;
    return dailyEstimate(this.model()!, v.status === 'active' ? v.assignment : 'idle', v.driver).net;
  });
  protected readonly wear = computed(() => wearOf(this.vehicle()!.km));
  protected readonly wearBar = computed(() => wearColor(this.vehicle()!.km));
  protected readonly serviceDue = computed(() => isServiceDue(this.vehicle()!));
  protected readonly normal = computed(() => repairQuote(this.vehicle()!.breakdown!, false));
  protected readonly express = computed(() => repairQuote(this.vehicle()!.breakdown!, true));
  protected readonly overhaulPrice = computed(() => overhaulCost(this.model()!));
  protected readonly offer = computed(() => sellValue(this.vehicle()!));
  protected readonly garageProgress = computed(() => {
    const g = this.vehicle()!.garage;
    return g ? Math.min(1, Math.max(0, 1 - (g.readyAt - this.store.clock()) / g.hours)) : 0;
  });
  protected readonly kmLimit = GAME.kmLimit;

  protected sell(): void {
    if (this.store.sell(this.id())) {
      this.confirmSell.set(false);
      this.router.navigateByUrl(this.back());
    }
  }

  protected rename(name: string): void {
    if (this.store.rename(this.id(), name)) this.renaming.set(false);
  }
}
