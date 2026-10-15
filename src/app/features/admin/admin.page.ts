import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { GameStore } from '../../core/state/game.store';
import { MoneyPipe } from '../../core/util/format';
import { ICONS } from '../../shared/icons';
import { ModalComponent } from '../../shared/modal.component';

/**
 * Testing tools: change the cash, reset the account. Open to everyone in the demo; with the
 * backend it becomes an admin-only area (like RichLife's admin panel).
 */
@Component({
  selector: 'app-admin-page',
  imports: [LucideAngularModule, MoneyPipe, ModalComponent],
  template: `
    <div class="mb-6">
      <h1 class="h1">Admin</h1>
      <p class="mt-1 text-sm text-fg-2">Testing tools. Money added here is not counted as earnings.</p>
    </div>

    <div class="grid gap-5 lg:grid-cols-2">
      <!-- Money -->
      <section class="card p-5">
        <h2 class="mb-4 flex items-center gap-2 font-semibold text-fg"><lucide-icon [img]="icons.Wallet" [size]="18" /> Money</h2>
        <p class="label">Cash now</p>
        <p class="num mt-1 text-3xl font-bold text-fg">{{ store.cash() | money }}</p>

        <p class="label mb-2 mt-5">Add</p>
        <div class="grid grid-cols-3 gap-2">
          @for (a of quick; track a) {
            <button class="btn-ghost" (click)="store.grantTestCash(a)">+{{ a | money: 'short' }}</button>
          }
        </div>

        <p class="label mb-2 mt-5">Set to an exact amount</p>
        <div class="flex gap-2">
          <div class="relative flex-1">
            <span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-3">$</span>
            <input
              #amount
              type="number"
              min="0"
              step="1000"
              inputmode="numeric"
              placeholder="500000"
              class="w-full rounded-xl border border-line bg-surface py-2.5 pl-7 pr-3 text-fg outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
              (keydown.enter)="set(amount)"
            />
          </div>
          <button class="btn-primary" (click)="set(amount)">Set cash</button>
        </div>
      </section>

      <!-- Reset -->
      <section class="card p-5">
        <h2 class="mb-4 flex items-center gap-2 font-semibold text-fg"><lucide-icon [img]="icons.RotateCcw" [size]="18" /> Reset account</h2>
        <p class="text-sm text-fg-2">
          Back to the start: $50,000, no businesses, no vehicles, no restaurants or stations, an empty activity log.
          It cannot be undone.
        </p>
        <button class="btn-danger mt-5 w-full" (click)="confirmReset.set(true)">Reset the account</button>
      </section>
    </div>

    @if (confirmReset()) {
      <app-modal title="Reset the account?" subtitle="Everything is wiped. This cannot be undone." (closed)="confirmReset.set(false)">
        <div class="flex gap-2">
          <button class="btn-ghost flex-1" (click)="confirmReset.set(false)">Cancel</button>
          <button class="btn-danger flex-1" (click)="reset()">Reset</button>
        </div>
      </app-modal>
    }
  `,
})
export class AdminPage {
  protected readonly store = inject(GameStore);
  private readonly router = inject(Router);
  protected readonly icons = ICONS;
  protected readonly quick = [100_000, 1_000_000, 10_000_000];
  protected readonly confirmReset = signal(false);

  protected set(input: HTMLInputElement): void {
    if (input.value === '') return;
    if (this.store.setCash(Number(input.value))) input.value = '';
  }

  protected reset(): void {
    this.store.resetGame();
    this.confirmReset.set(false);
    this.router.navigateByUrl('/');
  }
}
