import { Component, computed, inject } from '@angular/core';
import { Auth } from '../../core/auth';
import { LibraryList } from '../library-list/library-list';

@Component({
  selector: 'app-dashboard',
  imports: [LibraryList],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {
  private readonly auth = inject(Auth);

  protected readonly displayName = computed(() => {
    const user = this.auth.user();
    return user?.user_metadata?.['full_name'] ?? user?.email ?? '';
  });
}
