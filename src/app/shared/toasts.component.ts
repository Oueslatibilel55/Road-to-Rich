import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { EventTone } from '../core/models/game.models';
import { ToastService } from '../core/state/toast.service';
import { ICONS, IconData } from './icons';

const TONE: Record<EventTone, { icon: IconData; bar: string; text: string }> = {
  info: { icon: ICONS.Info, bar: 'bg-sky-500', text: 'text-sky-600' },
  success: { icon: ICONS.Check, bar: 'bg-emerald-500', text: 'text-emerald-600' },
  warning: { icon: ICONS.TriangleAlert, bar: 'bg-amber-500', text: 'text-amber-600' },
  danger: { icon: ICONS.Siren, bar: 'bg-rose-500', text: 'text-rose-600' },
};

@Component({
  selector: 'app-toasts',
  imports: [LucideAngularModule, RouterLink],
  template: `
    <div
      class="pointer-events-none fixed inset-x-0 top-16 z-[60] flex flex-col items-center gap-2 px-4 lg:bottom-6 lg:left-auto lg:right-6 lg:top-auto lg:items-end"
      aria-live="polite"
    >
      @for (t of service.toasts(); track t.id) {
        <div class="pointer-events-auto relative flex w-full max-w-sm animate-slide-up items-start gap-3 overflow-hidden rounded-2xl border border-line bg-surface p-3.5 pl-4 shadow-lift">
          <span class="absolute inset-y-0 left-0 w-1" [class]="tone[t.tone].bar"></span>
          <span class="mt-0.5 shrink-0" [class]="tone[t.tone].text"><lucide-icon [img]="tone[t.tone].icon" [size]="18" /></span>
          <div class="min-w-0 flex-1">
            <p class="text-sm font-semibold text-fg">{{ t.title }}</p>
            @if (t.detail) {
              <p class="mt-0.5 text-xs leading-relaxed text-fg-2">{{ t.detail }}</p>
            }
            @if (t.link) {
              <a [routerLink]="t.link" (click)="service.dismiss(t.id)" class="mt-2 inline-block text-xs font-semibold text-brand-700 hover:text-brand-800">
                Open vehicle →
              </a>
            }
          </div>
          <button class="text-fg-3 hover:text-fg" (click)="service.dismiss(t.id)" aria-label="Dismiss">
            <lucide-icon [img]="icons.X" [size]="14" />
          </button>
        </div>
      }
    </div>
  `,
})
export class ToastsComponent {
  protected readonly service = inject(ToastService);
  protected readonly tone = TONE;
  protected readonly icons = ICONS;
}
