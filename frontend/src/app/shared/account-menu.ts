import { Component, computed, inject, output, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { firstValueFrom } from 'rxjs';
import { Auth } from '../core/auth';
import { ConfirmDialog } from './confirm-dialog';

@Component({
  selector: 'app-account-menu',
  imports: [MatButtonModule, MatIconModule, MatMenuModule],
  template: `
    @if (user()) {
      <header class="account">
        <button
          mat-icon-button
          class="account__nav"
          (click)="menuToggle.emit()"
          aria-label="Navigatiemenu"
        >
          <mat-icon>menu</mat-icon>
        </button>
        <button mat-button [matMenuTriggerFor]="menu" aria-label="Accountmenu">
          @if (avatarUrl()) {
            <img class="account__avatar" [src]="avatarUrl()" alt="" referrerpolicy="no-referrer" />
          } @else {
            <mat-icon>account_circle</mat-icon>
          }
          {{ displayName() }}
        </button>
        <mat-menu #menu="matMenu" xPosition="before">
          <div class="account__profile">
            <strong>{{ displayName() }}</strong>
            <span>{{ user()?.email }}</span>
          </div>
          <button mat-menu-item (click)="signOut()">
            <mat-icon>logout</mat-icon>
            Uitloggen
          </button>
          <button mat-menu-item (click)="deleteAccount()">
            <mat-icon>delete</mat-icon>
            Account verwijderen
          </button>
        </mat-menu>
        @if (errorMessage()) {
          <p class="account__error" role="alert">{{ errorMessage() }}</p>
        }
      </header>
    }
  `,
  styles: `
    .account {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 1rem;
      padding: 0.5rem 1rem;
    }
    .account__nav {
      margin-right: auto;
    }
    .account__avatar {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      margin-right: 8px;
      object-fit: cover;
    }
    .account__profile {
      display: flex;
      flex-direction: column;
      padding: 0.5rem 1rem;
    }
    .account__profile span {
      font-size: 0.85em;
      color: var(--mat-sys-on-surface-variant);
    }
    .account__error {
      margin: 0;
      color: var(--mat-sys-error);
    }
  `,
})
export class AccountMenu {
  readonly menuToggle = output<void>();
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);

  protected readonly user = this.auth.user;
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly displayName = computed(() => {
    const user = this.user();
    return user?.user_metadata?.['full_name'] ?? user?.email ?? '';
  });
  protected readonly avatarUrl = computed(() => {
    const meta = this.user()?.user_metadata;
    return (meta?.['avatar_url'] ?? meta?.['picture'] ?? '') as string;
  });

  protected async signOut(): Promise<void> {
    await this.auth.signOut();
    await this.router.navigate(['/login']);
  }

  protected async deleteAccount(): Promise<void> {
    this.errorMessage.set(null);
    const dialogRef = this.dialog.open(ConfirmDialog, {
      data: {
        title: 'Delete account',
        message: 'Delete your account and all your data? This action cannot be undone.',
      },
    });
    if (!(await firstValueFrom(dialogRef.afterClosed()))) {
      return;
    }
    try {
      await this.auth.deleteAccount();
      await this.router.navigate(['/login']);
    } catch {
      this.errorMessage.set('Account verwijderen is mislukt. Probeer het opnieuw.');
    }
  }
}
