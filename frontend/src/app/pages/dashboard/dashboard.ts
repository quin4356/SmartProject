import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { Auth } from '../../core/auth';
import { ConfirmDialog } from '../../shared/confirm-dialog';
import { LibraryList } from '../library-list/library-list';

@Component({
  selector: 'app-dashboard',
  imports: [MatButtonModule, LibraryList],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);

  protected readonly errorMessage = signal<string | null>(null);

  protected readonly displayName = computed(() => {
    const user = this.auth.user();
    return user?.user_metadata?.['full_name'] ?? user?.email ?? '';
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
