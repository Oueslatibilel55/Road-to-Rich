import { Component, inject } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { GameSpeed } from '../core/models/game.models';
import { GameStore } from '../core/state/game.store';
import { ICONS } from '../shared/icons';

@Component({
  selector: 'app-speed-control',
  imports: [LucideAngularModule],
  host: { class: 'block' },
  template: `
    <div class="segmented flex w-full" role="group" aria-label="Game speed">
      <button [class.active]="store.speed() === 0" (click)="store.setSpeed(0)" aria-label="Pause">
        <lucide-icon [img]="icons.Pause" [size]="14" />
      </button>
      @for (s of speeds; track s) {
        <button [class.active]="store.speed() === s" (click)="store.setSpeed(s)">{{ s }}×</button>
      }
    </div>
  `,
})
export class SpeedControlComponent {
  protected readonly store = inject(GameStore);
  protected readonly icons = ICONS;
  protected readonly speeds: GameSpeed[] = [1, 4, 12];
}
