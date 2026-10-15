import { Routes } from '@angular/router';
import { BusinessLayoutComponent } from './business-layout.component';

// Every business shares these pages; each page adapts to what the business owns
// (vehicles or sites). Route param: businessId.
export const BUSINESS_ROUTES: Routes = [
  {
    path: '',
    component: BusinessLayoutComponent,
    children: [
      { path: '', loadComponent: () => import('./mine.page').then((m) => m.MinePage) },
      { path: 'buy', loadComponent: () => import('./buy.page').then((m) => m.BuyPage) },
      { path: 'v/:id', loadComponent: () => import('./vehicle.page').then((m) => m.VehiclePage) },
    ],
  },
];
