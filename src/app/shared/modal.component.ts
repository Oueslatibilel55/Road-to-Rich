import { Component, input, output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from './icons';

/** Bottom sheet on phones, centered dialog from `sm` up. */
@Component({
  selector: 'app-modal',
  imports: [LucideAngularModule],
  host: { '(document:keydown.escape)': 'closed.emit()' },
  template: `
    <div class="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <div class="absolute inset-0 animate-fade-in bg-stone-900/30 backdrop-blur-[2px]" (click)="closed.emit()"></div>
      <div
        role="dialog"
        aria-modal="true"
        class="relative max-h-[92dvh] w-full animate-slide-up overflow-y-auto rounded-t-3xl bg-surface p-5 pb-safe shadow-2xl sm:max-w-lg sm:rounded-3xl sm:pb-5"
      >
        <div class="mx-auto mb-4 h-1 w-10 rounded-full bg-line-strong sm:hidden"></div>
        <div class="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 class="font-display text-lg font-semibold text-fg">{{ title() }}</h2>
            @if (subtitle()) {
              <p class="mt-0.5 text-sm text-fg-2">{{ subtitle() }}</p>
            }
          </div>
          <button class="rounded-lg p-1.5 text-fg-3 hover:bg-sunken hover:text-fg" (click)="closed.emit()" aria-label="Close">
            <lucide-icon [img]="icons.X" [size]="18" />
          </button>
        </div>
        <ng-content />
      </div>
    </div>
  `,
})
export class ModalComponent {
  readonly title = input.required<string>();
  readonly subtitle = input<string>();
  readonly closed = output<void>();
  protected readonly icons = ICONS;
}
