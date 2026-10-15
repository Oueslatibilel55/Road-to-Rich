import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { BusinessInfo } from './core/data/businesses';
import { GameStore } from './core/state/game.store';
import { GameTimePipe, MoneyPipe } from './core/util/format';
import { SpeedControlComponent } from './layout/speed-control.component';
import { BUSINESS_THEME, businessLink } from './shared/business-theme';
import { BUSINESS_ICON, ICONS } from './shared/icons';
import { ToastsComponent } from './shared/toasts.component';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    LucideAngularModule,
    MoneyPipe,
    GameTimePipe,
    SpeedControlComponent,
    ToastsComponent,
  ],
  template: `
    <!-- Sidebar (desktop) -->
    <aside class="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-line bg-surface px-4 py-6 lg:flex">
      <a routerLink="/" class="mb-7 flex items-center gap-3 px-2">
        <span class="grid h-9 w-9 place-items-center rounded-xl bg-brand-700 text-white">
          <lucide-icon [img]="icons.Route" [size]="20" [strokeWidth]="2.5" />
        </span>
        <span class="font-display text-base font-bold text-fg">Road to Rich</span>
      </a>

      <nav class="flex flex-1 flex-col gap-1 overflow-y-auto">
        <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }" class="nav-item">
          <lucide-icon [img]="icons.House" [size]="18" /> Home
        </a>

        <p class="label mb-1 mt-6 px-3">My businesses</p>
        @for (b of store.openBusinesses(); track b.id) {
          <a [routerLink]="link(b)" routerLinkActive="active" class="nav-item">
            <span class="grid h-7 w-7 place-items-center rounded-lg" [class]="theme(b).tile"><lucide-icon [img]="icon(b)" [size]="15" /></span>
            <span class="flex-1 truncate">{{ b.name }}</span>
            @if (store.businessStats()[b.id].alerts > 0) {
              <span class="rounded-full bg-rose-600 px-1.5 text-[10px] font-bold text-white">{{ store.businessStats()[b.id].alerts }}</span>
            }
          </a>
        }
        <a routerLink="/businesses" routerLinkActive="active" class="nav-item">
          <span class="grid h-7 w-7 place-items-center rounded-lg border border-dashed border-line-strong"><lucide-icon [img]="icons.Plus" [size]="15" /></span>
          Open a business
        </a>

        <a routerLink="/activity" routerLinkActive="active" class="nav-item mt-6">
          <lucide-icon [img]="icons.Activity" [size]="18" /> Activity
        </a>
      </nav>

      <div class="mt-4 rounded-2xl bg-sunken p-4">
        <p class="num text-lg font-semibold text-fg">{{ store.clock() | gameTime }}</p>
        <app-speed-control class="mt-3" />
        <a routerLink="/admin" class="mt-3 flex items-center gap-1.5 text-xs text-fg-3 hover:text-fg-2">
          <lucide-icon [img]="icons.ShieldCheck" [size]="12" /> Admin — money & reset
        </a>
      </div>
    </aside>

    <div class="min-h-dvh lg:pl-64">
      <!-- Top bar: cash and income, nothing else -->
      <header class="sticky top-0 z-30 border-b border-line bg-canvas/85 backdrop-blur-lg">
        <div class="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 lg:px-8">
          <a routerLink="/" class="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-700 text-white lg:hidden" aria-label="Home">
            <lucide-icon [img]="icons.Route" [size]="17" [strokeWidth]="2.5" />
          </a>
          <p class="num truncate text-xl font-bold sm:text-2xl" [class]="store.cash() < 0 ? 'text-rose-700' : 'text-fg'">{{ store.cash() | money }}</p>
          <p class="num hidden text-sm font-semibold sm:block" [class]="store.incomePerDay() >= 0 ? 'text-emerald-700' : 'text-rose-700'">
            {{ store.incomePerDay() >= 0 ? '+' : '' }}{{ store.incomePerDay() | money }}<span class="font-sans font-normal text-fg-3"> / day</span>
          </p>

          <button
            class="ml-auto flex items-center gap-2 rounded-xl border border-line bg-surface px-3 py-1.5 shadow-sm lg:hidden"
            (click)="cycleSpeed()"
            aria-label="Change game speed"
          >
            <span class="num text-sm font-semibold text-fg">{{ store.clock() | gameTime: 'time' }}</span>
            <span
              class="grid h-6 min-w-6 place-items-center rounded-md px-1 text-xs font-bold"
              [class]="store.speed() === 0 ? 'bg-amber-100 text-amber-800' : 'bg-brand-50 text-brand-800'"
            >
              @if (store.speed() === 0) {
                <lucide-icon [img]="icons.Pause" [size]="12" />
              } @else {
                {{ store.speed() }}×
              }
            </span>
          </button>
        </div>
      </header>

      <main class="mx-auto max-w-6xl px-4 pb-28 pt-5 lg:px-8 lg:pb-12 lg:pt-8">
        <router-outlet />
      </main>
    </div>

    <!-- Tab bar (phones / tablets) -->
    <nav class="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 pb-safe backdrop-blur-lg lg:hidden">
      <div class="mx-auto grid max-w-md grid-cols-3">
        <a routerLink="/" routerLinkActive="!text-brand-700" [routerLinkActiveOptions]="{ exact: true }" class="tab-item">
          <lucide-icon [img]="icons.House" [size]="21" /> Home
        </a>
        <a routerLink="/businesses" [class]="inBusinesses() ? '!text-brand-700' : ''" class="tab-item">
          <lucide-icon [img]="icons.Briefcase" [size]="21" /> Businesses
          @if (store.totals().alerts > 0) {
            <span class="absolute right-[26%] top-1.5 h-4 min-w-4 rounded-full bg-rose-600 px-1 text-center text-[10px] font-bold leading-4 text-white">
              {{ store.totals().alerts }}
            </span>
          }
        </a>
        <a routerLink="/activity" routerLinkActive="!text-brand-700" class="tab-item">
          <lucide-icon [img]="icons.Activity" [size]="21" /> Activity
        </a>
      </div>
    </nav>

    <app-toasts />
  `,
  styles: `
    .nav-item {
      @apply flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-fg-2 transition hover:bg-sunken hover:text-fg;
    }
    .nav-item.active {
      @apply bg-brand-50 text-brand-800;
    }
    .tab-item {
      @apply relative flex flex-col items-center gap-1 pb-1 pt-2.5 text-[11px] font-medium text-fg-3;
    }
  `,
})
export class AppComponent {
  protected readonly store = inject(GameStore);
  private readonly router = inject(Router);
  protected readonly icons = ICONS;

  protected inBusinesses(): boolean {
    const url = this.router.url;
    return url.startsWith('/b/') || url.startsWith('/businesses');
  }

  protected link(b: BusinessInfo) {
    return businessLink(b.id);
  }
  protected theme(b: BusinessInfo) {
    return BUSINESS_THEME[b.accent];
  }
  protected icon(b: BusinessInfo) {
    return BUSINESS_ICON[b.icon];
  }

  protected cycleSpeed(): void {
    const order = [1, 4, 12, 0] as const;
    const i = order.indexOf(this.store.speed());
    this.store.setSpeed(order[(i + 1) % order.length]);
  }
}
