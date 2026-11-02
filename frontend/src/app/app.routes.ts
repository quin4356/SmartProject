import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Dashboard } from './pages/dashboard/dashboard';
import { authGuard, guestGuard } from './core/auth-guard';
import { LibraryList } from './pages/library-list/library-list';

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
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: '**', redirectTo: 'dashboard' },
];