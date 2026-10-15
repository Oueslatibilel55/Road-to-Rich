import { Component, inject } from '@angular/core';
import { GameStore } from '../../core/state/game.store';
import { BusinessCardComponent } from '../../shared/business-card.component';
import { OpenBusinessListComponent } from '../../shared/open-business-list.component';

@Component({
  selector: 'app-businesses-page',
  imports: [BusinessCardComponent, OpenBusinessListComponent],
  template: `
    <h1 class="h1 mb-6">Businesses</h1>

    @if (store.openBusinesses().length) {
      <h2 class="label mb-3">Mine</h2>
      <div class="mb-8 grid gap-3 lg:grid-cols-2">
        @for (b of store.openBusinesses(); track b.id) {
          <app-business-card [business]="b" />
        }
      </div>
    }

    <h2 class="label mb-1">Open a new one</h2>
    <p class="mb-3 text-sm text-fg-2">The price is the licence. Then you buy what it runs on.</p>
    <app-open-business-list />
  `,
})
export class BusinessesPage {
  protected readonly store = inject(GameStore);
}
