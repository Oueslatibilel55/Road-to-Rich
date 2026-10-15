import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { BusinessInfo } from '../core/data/businesses';
import { GameStore } from '../core/state/game.store';
import { MoneyPipe } from '../core/util/format';
import { BUSINESS_THEME, businessLink } from './business-theme';
import { BUSINESS_ICON, ICONS } from './icons';

/** An open business at a glance: how many things it owns and what it earns per day. */
@Component({
  selector: 'app-business-card',
  imports: [LucideAngularModule, RouterLink, MoneyPipe],
  template: `
    <a [routerLink]="link()" class="card card-hover group flex items-center gap-4 p-4">
      <span class="grid h-12 w-12 shrink-0 place-items-center rounded-2xl" [class]="theme().solid">
        <lucide-icon [img]="icon()" [size]="24" />
      </span>
      <div class="min-w-0 flex-1">
        <p class="flex items-center gap-2 font-semibold text-fg">
          <span class="truncate">{{ business().name }}</span>
          @if (stats().alerts > 0) {
            <span class="pill !px-2 !py-0.5 bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200">
              <lucide-icon [img]="icons.Siren" [size]="11" /> {{ stats().alerts }}
            </span>
          }
        </p>
        <p class="text-xs text-fg-3">{{ stats().assets }} {{ business().assetsLabel.toLowerCase() }}</p>
      </div>
      <p class="num text-right font-bold" [class]="stats().incomePerDay > 0 ? 'text-emerald-700' : 'text-fg-3'">
        {{ stats().incomePerDay > 0 ? '+' : '' }}{{ stats().incomePerDay | money: 'short' }}
        <span class="block font-sans text-[11px] font-normal text-fg-3">/ day</span>
      </p>
      <span class="text-fg-3 transition group-hover:translate-x-0.5"><lucide-icon [img]="icons.ChevronRight" [size]="18" /></span>
    </a>
  `,
})
export class BusinessCardComponent {
  readonly business = input.required<BusinessInfo>();

  private readonly store = inject(GameStore);
  protected readonly icons = ICONS;
  protected readonly link = computed(() => businessLink(this.business().id));
  protected readonly theme = computed(() => BUSINESS_THEME[this.business().accent]);
  protected readonly icon = computed(() => BUSINESS_ICON[this.business().icon]);
  protected readonly stats = computed(() => this.store.businessStats()[this.business().id]);
}
