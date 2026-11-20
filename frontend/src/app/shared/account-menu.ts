import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar } from '@angular/material/snack-bar';
import { firstValueFrom } from 'rxjs';
import { Auth } from '../core/auth';
import { ConfirmDialog } from './confirm-dialog';

@Component({
  selector: 'app-account-menu',
  imports: [MatButtonModule, MatIconModule, MatMenuModule],
  template: `
    @if (user()) {
      <button
        mat-button
        class="account"
        [matMenuTriggerFor]="menu"
        [attr.aria-label]="'Account van ' + displayName()"
      >
        @if (avatarUrl()) {
          <img class="account__avatar" [src]="avatarUrl()" alt="" referrerpolicy="no-referrer" />
        } @else {
          <span class="account__initial" aria-hidden="true">{{ initial() }}</span>
        }
        <span class="account__name">{{ firstName() }}</span>
      </button>
      <mat-menu #menu="matMenu" xPosition="before" class="account-panel">
        <div class="account__profile">
          <strong>{{ displayName() }}</strong>
          <span>{{ user()?.email }}</span>
        </div>
        <button mat-menu-item (click)="signOut()">
          <mat-icon>logout</mat-icon>
          Uitloggen
        </button>
        <button mat-menu-item class="account__danger" (click)="deleteAccount()">
          <mat-icon>delete</mat-icon>
          Account verwijderen
        </button>
      </mat-menu>
    }
  `,
  styles: `
    :host {
      display: contents;
    }
    .account {
      --mat-button-text-label-text-color: var(--ink);
      padding: 0 0.75rem 0 0.35rem;
      height: 40px;
    }
    .account__avatar,
    .account__initial {
      width: 30px;
      height: 30px;
      border-radius: 0;
      margin-right: 0.6rem;
      object-fit: cover;
    }
    .account__initial {
      display: inline-grid;
      place-items: center;
      background: var(--primary);
      color: var(--on-dark);
      font: 500 0.85rem var(--font-body);
    }
    .account__profile {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
      padding: 0.75rem 1rem;
      border-bottom: 1px solid var(--rule);
      margin-bottom: 0.25rem;
    }
    .account__profile span {
      font-size: 0.85em;
      color: var(--ink-soft);
    }
    .account__danger {
      color: var(--primary);
    }
    @media (max-width: 520px) {
      .account__name {
        display: none;
      }
      .account__avatar,
      .account__initial {
        margin-right: 0;
      }
    }
  `,
})
export class AccountMenu {
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly user = this.auth.user;

  protected readonly displayName = computed(() => {
    const user = this.user();
    return (user?.user_metadata?.['full_name'] ?? user?.email ?? '') as string;
  });
  protected readonly firstName = computed(() => this.displayName().split(' ')[0]);
  protected readonly initial = computed(() => this.displayName().charAt(0).toUpperCase());
  protected readonly avatarUrl = computed(() => {
    const meta = this.user()?.user_metadata;
    return (meta?.['avatar_url'] ?? meta?.['picture'] ?? '') as string;
  });

  protected async signOut(): Promise<void> {
    try {
      await this.auth.signOut();
      await this.router.navigate(['/login']);
    } catch {
      this.showError('Uitloggen is mislukt. Probeer het opnieuw.');
    }
  }

  protected async deleteAccount(): Promise<void> {
    const dialogRef = this.dialog.open(ConfirmDialog, {
      data: {
        title: 'Account verwijderen',
        message: 'Je account en al je gegevens verwijderen? Dit kan niet ongedaan worden gemaakt.',
      },
    });
    if (!(await firstValueFrom(dialogRef.afterClosed()))) {
      return;
    }
    try {
      await this.auth.deleteAccount();
      await this.router.navigate(['/login']);
    } catch {
      this.showError('Account verwijderen is mislukt. Probeer het opnieuw.');
    }
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Sluiten', { duration: 5000 });
  }
}
