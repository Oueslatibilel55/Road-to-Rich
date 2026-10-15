import { Component, computed, inject, input, signal } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { MAX_PROPERTY_LEVEL, propertyType } from '../../core/data/property-catalog';
import { propertyIncomePerDay, propertySellValue, propertyStaff, upgradeCost } from '../../core/engine/property-rules';
import { Property } from '../../core/models/game.models';
import { GameStore } from '../../core/state/game.store';
import { MoneyPipe } from '../../core/util/format';
import { ICONS } from '../../shared/icons';
import { ModalComponent } from '../../shared/modal.component';

/** A restaurant or gas station: where it is, its level, its workers, what it earns, and Upgrade. */
@Component({
  selector: 'app-property-card',
  imports: [LucideAngularModule, MoneyPipe, ModalComponent],
  template: `
    <article class="card flex flex-col p-4">
      <div class="flex items-start gap-3">
        <span class="grid h-11 w-11 shrink-0 place-items-center rounded-xl" [class]="tile()">
          <lucide-icon [img]="icon()" [size]="22" />
        </span>
        <div class="min-w-0 flex-1">
          <p class="truncate font-semibold text-fg">{{ type().name }}</p>
          <p class="flex items-center gap-1 truncate text-xs text-fg-3">
            <lucide-icon [img]="icons.MapPin" [size]="12" />
            {{ property().partner ? property().partner + ' · ' : '' }}{{ property().address }}
          </p>
        </div>
        <button class="rounded-lg p-1 text-fg-3 hover:bg-sunken hover:text-fg" (click)="confirmSell.set(true)" aria-label="Sell">
          <lucide-icon [img]="icons.Ellipsis" [size]="18" />
        </button>
      </div>

      <!-- Level -->
      <div class="mt-4 flex items-center justify-between">
        <div class="flex gap-0.5" [attr.aria-label]="'Level ' + property().level + ' of ' + maxLevel">
          @for (i of levels; track i) {
            <span class="h-2 w-3.5 rounded-sm" [class]="i <= property().level ? 'bg-brand-600' : 'bg-sunken'"></span>
          }
        </div>
        <span class="text-xs font-semibold text-fg-2">Level {{ property().level }}</span>
      </div>

      <div class="mt-3 flex items-center justify-between">
        <span class="flex items-center gap-1.5 text-sm text-fg-2"><lucide-icon [img]="icons.Users" [size]="15" /> {{ staff() }} workers</span>
        <span class="num text-base font-bold text-emerald-700">+{{ income() | money }} <span class="font-sans text-xs font-normal text-fg-3">/ day</span></span>
      </div>

      @if (nextCost() !== null) {
        <button class="btn-primary mt-4 w-full" [disabled]="store.cash() < nextCost()!" (click)="store.upgradeProperty(property().id)">
          <lucide-icon [img]="icons.ChevronsUp" [size]="16" /> Upgrade · {{ nextCost()! | money: 'short' }}
          <span class="font-normal opacity-80">(+{{ nextGain() | money }}/day)</span>
        </button>
      } @else {
        <p class="mt-4 rounded-xl bg-emerald-50 py-2.5 text-center text-sm font-semibold text-emerald-700">
          <lucide-icon [img]="icons.Star" [size]="14" /> Max level
        </p>
      }
    </article>

    @if (confirmSell()) {
      <app-modal [title]="'Sell this ' + type().name + '?'" [subtitle]="property().address" (closed)="confirmSell.set(false)">
        <p class="mb-4 text-sm text-fg-2">A buyer offers <span class="num font-semibold text-fg">{{ sellValue() | money }}</span>. Its workers go with it.</p>
        <div class="flex gap-2">
          <button class="btn-ghost flex-1" (click)="confirmSell.set(false)">Keep it</button>
          <button class="btn-danger flex-1" (click)="sell()">Sell</button>
        </div>
      </app-modal>
    }
  `,
})
export class PropertyCardComponent {
  readonly property = input.required<Property>();
  readonly tile = input.required<string>();
  readonly icon = input.required<typeof ICONS.Store>();

  protected readonly store = inject(GameStore);
  protected readonly icons = ICONS;
  protected readonly maxLevel = MAX_PROPERTY_LEVEL;
  protected readonly levels = Array.from({ length: MAX_PROPERTY_LEVEL }, (_, i) => i + 1);
  protected readonly confirmSell = signal(false);

  protected readonly type = computed(() => propertyType(this.property().typeId));
  protected readonly income = computed(() => propertyIncomePerDay(this.property()));
  protected readonly staff = computed(() => propertyStaff(this.property()));
  protected readonly nextCost = computed(() => upgradeCost(this.property()));
  protected readonly nextGain = computed(
    () => propertyIncomePerDay({ ...this.property(), level: this.property().level + 1 }) - this.income(),
  );
  protected readonly sellValue = computed(() => propertySellValue(this.property()));

  protected sell(): void {
    if (this.store.sellProperty(this.property().id)) this.confirmSell.set(false);
  }
}
