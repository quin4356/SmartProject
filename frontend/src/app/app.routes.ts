import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Dashboard } from './pages/dashboard/dashboard';
import { authGuard, guestGuard } from './core/auth-guard';
import { LibraryList } from './pages/library-list/library-list';
import { ItemForm } from './pages/item-form/item-form';
import { Calendar } from './pages/calendar/calendar';
import { ToRead } from './pages/to-read/to-read';
import { Privacy } from './pages/privacy/privacy';
import { Terms } from './pages/terms/terms';

export const routes: Routes = [
  { path: 'login', component: Login, canActivate: [guestGuard] },
  { path: 'dashboard', component: Dashboard, canActivate: [authGuard] },
  {
    path: 'library/books',
    component: LibraryList,
    data: { type: 'BOOK' },
    canActivate: [authGuard],
  },
  {
    path: 'library/documentaries',
    component: LibraryList,
    data: { type: 'DOCUMENTARY' },
    canActivate: [authGuard],
  },
  {
    path: 'library/books/new',
    component: ItemForm,
    data: { type: 'BOOK' },
    canActivate: [authGuard],
  },
  {
    path: 'library/documentaries/new',
    component: ItemForm,
    data: { type: 'DOCUMENTARY' },
    canActivate: [authGuard],
  },
  {
    path: 'library/books/:id/edit',
    component: ItemForm,
    data: { type: 'BOOK' },
    canActivate: [authGuard],
  },
  {
    path: 'library/documentaries/:id/edit',
    component: ItemForm,
    data: { type: 'DOCUMENTARY' },
    canActivate: [authGuard],
  },
  { path: 'calendar', component: Calendar, canActivate: [authGuard] },
  { path: 'to-read', component: ToRead, canActivate: [authGuard] },
  { path: 'privacy', component: Privacy },
  { path: 'terms', component: Terms },
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: '**', redirectTo: 'dashboard' },
];
