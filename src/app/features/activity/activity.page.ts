import { Component } from '@angular/core';
import { ActivityListComponent } from '../../shared/activity-list.component';

@Component({
  selector: 'app-activity-page',
  imports: [ActivityListComponent],
  template: `
    <h1 class="h1 mb-6">Activity</h1>
    <app-activity-list />
  `,
})
export class ActivityPage {}
