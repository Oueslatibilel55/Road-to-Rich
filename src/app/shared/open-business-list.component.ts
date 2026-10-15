import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { BUSINESSES, BusinessInfo } from '../core/data/businesses';
import { GameStore } from '../core/state/game.store';
import { MoneyPipe } from '../core/util/format';
import { BUSINESS_THEME, businessLink } from './business-theme';
import { BUSINESS_ICON, ICONS } from './icons';

/** Businesses not opened yet, with their licence price. */
@Component({
  selector: 'app-open-business-list',
  imports: [LucideAngularModule, MoneyPipe],
  template: `
    <div class="grid gap-3 sm:grid-cols-2">
      @for (b of closed(); track b.id) {
        <article class="card flex items-center gap-4 p-4" [class.opacity-60]="b.comingSoon">
          <span class="grid h-12 w-12 shrink-0 place-items-center rounded-2xl" [class]="b.comingSoon ? 'bg-sunken text-fg-3' : theme(b).tile">
            <lucide-icon [img]="icon(b)" [size]="24" />
          </span>
          <div class="min-w-0 flex-1">
            <p class="font-semibold text-fg">{{ b.name }}</p>
            <p class="text-xs text-fg-3">{{ b.tagline }}</p>
          </div>
          @if (b.comingSoon) {
            <span class="pill shrink-0 bg-sunken text-fg-3"><lucide-icon [img]="icons.Lock" [size]="11" /> Soon</span>
          } @else {
            <button class="btn-primary shrink-0 !px-3" [disabled]="store.cash() < b.openCost" (click)="open(b)">
              {{ b.openCost ? (b.openCost | money: 'short') : 'Free' }}
            </button>
          }
        </article>
      } @empty {
        <p class="text-sm text-fg-3">You run every business there is — for now.</p>
      }
    </div>
  `,
})
export class OpenBusinessListComponent {
  protected readonly store = inject(GameStore);
  private readonly router = inject(Router);
  protected readonly icons = ICONS;

  protected readonly closed = computed(() => BUSINESSES.filter((b) => !this.store.openBusinesses().includes(b)));

  protected theme(b: BusinessInfo) {
    return BUSINESS_THEME[b.accent];
  }
  protected icon(b: BusinessInfo) {
    return BUSINESS_ICON[b.icon];
  }
  protected open(b: BusinessInfo): void {
    if (this.store.openBusiness(b.id)) this.router.navigateByUrl(businessLink(b.id, 'buy'));
  }
}
