import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { GameStore } from '../../core/state/game.store';
import { MoneyPipe } from '../../core/util/format';
import { AttentionListComponent } from '../../shared/attention-list.component';
import { BusinessCardComponent } from '../../shared/business-card.component';
import { ICONS } from '../../shared/icons';
import { OpenBusinessListComponent } from '../../shared/open-business-list.component';
import { RepairAllComponent } from '../../shared/repair-all.component';

@Component({
  selector: 'app-home-page',
  imports: [LucideAngularModule, RouterLink, MoneyPipe, BusinessCardComponent, AttentionListComponent, OpenBusinessListComponent, RepairAllComponent],
  template: `
    <!-- The three numbers that matter -->
    <section class="card mb-6 overflow-hidden bg-gradient-to-br from-teal-50 via-surface to-surface p-5 sm:p-6">
      <p class="label">Cash</p>
      <p class="num mt-1 text-4xl font-bold text-fg sm:text-5xl">{{ store.cash() | money }}</p>
      <div class="mt-4 flex flex-wrap gap-x-8 gap-y-2">
        <p class="text-sm text-fg-2">
          Income
          <span class="num ml-1 text-base font-bold" [class]="store.incomePerDay() >= 0 ? 'text-emerald-700' : 'text-rose-700'">
            {{ store.incomePerDay() >= 0 ? '+' : '' }}{{ store.incomePerDay() | money }}
          </span>
          / day
        </p>
        <p class="text-sm text-fg-2">Net worth <span class="num ml-1 text-base font-bold text-fg">{{ store.netWorth() | money: 'short' }}</span></p>
      </div>
    </section>

    @if (store.totals().alerts > 0) {
      <section class="card mb-6 border-rose-200 p-5">
        <h2 class="mb-2 flex items-center gap-2 font-semibold text-rose-800">
          <lucide-icon [img]="icons.Siren" [size]="18" /> {{ store.totals().alerts }} vehicle{{ store.totals().alerts > 1 ? 's' : '' }} off the road
        </h2>
        <app-attention-list [max]="20" [problemsOnly]="true" />
        <div class="mt-3"><app-repair-all /></div>
      </section>
    }

    @if (store.openBusinesses().length) {
      <section class="mb-8">
        <h2 class="mb-3 font-display text-lg font-semibold text-fg">Your businesses</h2>
        <div class="grid gap-3 lg:grid-cols-2">
          @for (b of store.openBusinesses(); track b.id) {
            <app-business-card [business]="b" />
          }
        </div>
      </section>
    }

    <section>
      <h2 class="mb-1 font-display text-lg font-semibold text-fg">{{ store.openBusinesses().length ? 'Grow' : 'Open your first business' }}</h2>
      <p class="mb-3 text-sm text-fg-2">{{ hint() }}</p>
      <app-open-business-list />
    </section>

    <a routerLink="/admin" class="mt-8 flex items-center justify-center gap-1.5 text-xs text-fg-3 hover:text-fg-2 lg:hidden">
      <lucide-icon [img]="icons.ShieldCheck" [size]="12" /> Admin — money & reset
    </a>
  `,
})
export class HomePage {
  protected readonly store = inject(GameStore);
  protected readonly icons = ICONS;

  protected readonly hint = computed(() =>
    this.store.openBusinesses().length
      ? 'Bigger businesses cost a licence. Save up to open them.'
      : 'The Delivery Company is free to open — start with a scooter, or a car you drive yourself.',
  );
}
