import { Injectable, signal } from '@angular/core';
import { EventTone } from '../models/game.models';

export interface Toast {
  id: number;
  tone: EventTone;
  title: string;
  detail?: string;
  /** Router link for an "Open" action, e.g. the broken vehicle. */
  link?: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private nextId = 1;
  readonly toasts = signal<Toast[]>([]);

  show(tone: EventTone, title: string, detail?: string, link?: string): void {
    const toast: Toast = { id: this.nextId++, tone, title, detail, link };
    // Keep the stack short: at 12× speed breakdowns can come in bursts.
    this.toasts.update((list) => [...list, toast].slice(-4));
    setTimeout(() => this.dismiss(toast.id), tone === 'danger' ? 7000 : 4000);
  }

  dismiss(id: number): void {
    this.toasts.update((list) => list.filter((t) => t.id !== id));
  }
}
