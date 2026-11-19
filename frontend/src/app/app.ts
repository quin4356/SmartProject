import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { Auth } from './core/auth';
import { AccountMenu } from './shared/account-menu';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatButtonModule,
    MatIconModule,
    MatSidenavModule,
    AccountMenu,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly user = inject(Auth).user;

  protected readonly links = [
    { path: '/dashboard', label: 'Overzicht' },
    { path: '/library/books', label: 'Boeken' },
    { path: '/library/documentaries', label: 'Documentaires' },
    { path: '/to-read', label: 'Te lezen' },
    { path: '/calendar', label: 'Kalender' },
  ];
}
