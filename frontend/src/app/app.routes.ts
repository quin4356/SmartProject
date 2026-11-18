import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/auth-guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./pages/login/login').then((m) => m.Login), canActivate: [guestGuard] },
  { path: 'dashboard', loadComponent: () => import('./pages/dashboard/dashboard').then((m) => m.Dashboard), canActivate: [authGuard] },
  {
    path: 'library/books',
    loadComponent: () => import('./pages/library-list/library-list').then((m) => m.LibraryList),
    data: { type: 'BOOK' },
    canActivate: [authGuard],
  },
  {
    path: 'library/documentaries',
    loadComponent: () => import('./pages/library-list/library-list').then((m) => m.LibraryList),
    data: { type: 'DOCUMENTARY' },
    canActivate: [authGuard],
  },
  {
    path: 'library/books/new',
    loadComponent: () => import('./pages/item-form/item-form').then((m) => m.ItemForm),
    data: { type: 'BOOK' },
    canActivate: [authGuard],
  },
  {
    path: 'library/documentaries/new',
    loadComponent: () => import('./pages/item-form/item-form').then((m) => m.ItemForm),
    data: { type: 'DOCUMENTARY' },
    canActivate: [authGuard],
  },
  {
    path: 'library/books/:id/edit',
    loadComponent: () => import('./pages/item-form/item-form').then((m) => m.ItemForm),
    data: { type: 'BOOK' },
    canActivate: [authGuard],
  },
  {
    path: 'library/documentaries/:id/edit',
    loadComponent: () => import('./pages/item-form/item-form').then((m) => m.ItemForm),
    data: { type: 'DOCUMENTARY' },
    canActivate: [authGuard],
  },
  {
    path: 'library/books/:id',
    loadComponent: () => import('./pages/item-detail/item-detail').then((m) => m.ItemDetail),
    data: { type: 'BOOK' },
    canActivate: [authGuard],
  },
  {
    path: 'library/documentaries/:id',
    loadComponent: () => import('./pages/item-detail/item-detail').then((m) => m.ItemDetail),
    data: { type: 'DOCUMENTARY' },
    canActivate: [authGuard],
  },
  { path: 'calendar', loadComponent: () => import('./pages/calendar/calendar').then((m) => m.Calendar), canActivate: [authGuard] },
  { path: 'to-read', loadComponent: () => import('./pages/to-read/to-read').then((m) => m.ToRead), canActivate: [authGuard] },
  { path: 'privacy', loadComponent: () => import('./pages/privacy/privacy').then((m) => m.Privacy) },
  { path: 'terms', loadComponent: () => import('./pages/terms/terms').then((m) => m.Terms) },
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: '**', redirectTo: 'dashboard' },
];
