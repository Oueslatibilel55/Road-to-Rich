import { Component, computed, inject, input } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { businessInfo } from '../../core/data/businesses';
import { BusinessId } from '../../core/models/game.models';
import { GameStore } from '../../core/state/game.store';
import { MoneyPipe } from '../../core/util/format';
import { BUSINESS_THEME, businessLink } from '../../shared/business-theme';
import { BUSINESS_ICON, ICONS } from '../../shared/icons';

/** Frame of every business: name, its income, and two tabs — what you own, and the shop. */
@Component({
  selector: 'app-business-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, LucideAngularModule, MoneyPipe],
  template: `
    <header class="mb-5">
      <a routerLink="/businesses" class="mb-3 inline-flex items-center gap-1 text-xs font-medium text-fg-3 hover:text-fg lg:hidden">
        <lucide-icon [img]="icons.ChevronLeft" [size]="14" /> Businesses
      </a>
      <div class="flex items-center gap-4">
        <span class="grid h-12 w-12 shrink-0 place-items-center rounded-2xl" [class]="theme().solid">
          <lucide-icon [img]="icon()" [size]="24" />
        </span>
        <div class="min-w-0 flex-1">
          <h1 class="h1 truncate">{{ info().name }}</h1>
          <p class="num text-sm font-semibold" [class]="stats().incomePerDay >= 0 ? 'text-emerald-700' : 'text-rose-700'">
            {{ stats().incomePerDay >= 0 ? '+' : '' }}{{ stats().incomePerDay | money }} <span class="font-sans font-normal text-fg-3">/ day</span>
          </p>
        </div>
      </div>

      <nav class="mt-5 flex gap-1 border-b border-line">
        <a [routerLink]="link('')" routerLinkActive="!border-brand-700 !text-fg" [routerLinkActiveOptions]="{ exact: true }" class="tab">
          {{ info().assetsLabel }}
          <span class="rounded-md bg-sunken px-1.5 text-[11px] text-fg-2">{{ stats().assets }}</span>
          @if (stats().alerts > 0) {
            <span class="rounded-full bg-rose-600 px-1.5 text-[10px] font-bold text-white">{{ stats().alerts }}</span>
          }
        </a>
        <a [routerLink]="link('buy')" routerLinkActive="!border-brand-700 !text-fg" class="tab">
          <lucide-icon [img]="icons.Store" [size]="16" /> Buy
        </a>
      </nav>
    </header>

    <router-outlet />
  `,
  styles: `
    .tab {
      @apply -mb-px flex items-center gap-2 border-b-2 border-transparent px-3 pb-3 pt-1 text-sm font-semibold text-fg-3 transition hover:text-fg;
    }
  `,
})
export class BusinessLayoutComponent {
  readonly businessId = input.required<BusinessId>();

  private readonly store = inject(GameStore);
  protected readonly icons = ICONS;

  protected readonly info = computed(() => businessInfo(this.businessId()));
  protected readonly theme = computed(() => BUSINESS_THEME[this.info().accent]);
  protected readonly icon = computed(() => BUSINESS_ICON[this.info().icon]);
  protected readonly stats = computed(() => this.store.businessStats()[this.businessId()]);

  protected link(path: string) {
    return businessLink(this.businessId(), path);
  }
}
