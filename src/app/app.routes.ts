import { inject } from '@angular/core';
import { CanActivateFn, Router, Routes } from '@angular/router';
import { BUSINESS_IDS } from './core/data/businesses';
import { BusinessId } from './core/models/game.models';
import { GameStore } from './core/state/game.store';

/** A business's pages exist only once it is open; otherwise go and open it. */
const businessOpen: CanActivateFn = (route) => {
  const id = route.paramMap.get('businessId') as BusinessId;
  return (BUSINESS_IDS.includes(id) && inject(GameStore).isOpen(id)) || inject(Router).parseUrl('/businesses');
};

export const routes: Routes = [
  { path: '', title: 'Home · Road to Rich', loadComponent: () => import('./features/home/home.page').then((m) => m.HomePage) },
  { path: 'businesses', title: 'Businesses · Road to Rich', loadComponent: () => import('./features/businesses/businesses.page').then((m) => m.BusinessesPage) },
  { path: 'activity', title: 'Activity · Road to Rich', loadComponent: () => import('./features/activity/activity.page').then((m) => m.ActivityPage) },
  { path: 'admin', title: 'Admin · Road to Rich', loadComponent: () => import('./features/admin/admin.page').then((m) => m.AdminPage) },
  {
    path: 'b/:businessId',
    canActivate: [businessOpen],
    loadChildren: () => import('./features/business/business.routes').then((m) => m.BUSINESS_ROUTES),
  },
  { path: '**', redirectTo: '' },
];
