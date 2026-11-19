import { firstValueFrom } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterLink } from '@angular/router';
import { LibraryItems } from '../../core/library-items';
import {
  ItemStatus,
  ItemType,
  STATUS_LABELS,
  itemRoute,
  statusOptions,
  topCategory,
} from '../../core/models';
import { SortKey, filterItems } from '../../core/list-filter';
import { ConfirmDialog } from '../../shared/confirm-dialog';
import { Tilt } from '../../shared/tilt';
import { categoryColor } from '../../core/category-colors';
import { Component, computed, inject, input, resource, signal } from '@angular/core';

@Component({
  selector: 'app-library-list',
  imports: [MatButtonModule, MatIconModule, RouterLink, Tilt],
  templateUrl: './library-list.html',
  styleUrl: './library-list.scss',
})
export class LibraryList {
  private readonly libraryItems = inject(LibraryItems);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  readonly type = input.required<ItemType>();

  protected readonly title = computed(() => (this.type() === 'BOOK' ? 'Boeken' : 'Documentaires'));

  protected readonly addRoute = computed(() => `${itemRoute(this.type())}/new`);

  protected readonly editBase = computed(() => itemRoute(this.type()));

  protected readonly items = resource({
    params: () => this.type(),
    loader: ({ params }) => this.libraryItems.list(params),
  });

  protected readonly query = signal('');
  protected readonly statusFilter = signal<ItemStatus | ''>('');
  protected readonly sort = signal<SortKey>('newest');

  protected readonly statusOptions = computed(() => statusOptions(this.type()));

  protected readonly visible = computed(() =>
    filterItems(this.items.value() ?? [], this.query(), this.statusFilter(), this.sort()),
  );

  protected setQuery(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }

  protected setStatus(event: Event): void {
    this.statusFilter.set((event.target as HTMLSelectElement).value as ItemStatus | '');
  }

  protected setSort(event: Event): void {
    this.sort.set((event.target as HTMLSelectElement).value as SortKey);
  }

  protected readonly deleting = signal<Record<string, boolean>>({});

  protected readonly topCategory = topCategory;
  protected readonly color = categoryColor;

  protected statusLabel(type: ItemType, status: keyof (typeof STATUS_LABELS)['BOOK']): string {
    return STATUS_LABELS[type][status];
  }

  protected async deleteItem(id: string): Promise<void> {
    const dialogRef = this.dialog.open(ConfirmDialog, {
      data: {
        title: 'Item verwijderen',
        message: 'Dit item verwijderen? Dit kan niet ongedaan worden gemaakt.',
      },
    });
    const confirmed = await firstValueFrom(dialogRef.afterClosed());
    if (!confirmed) {
      return;
    }

    this.deleting.set({ ...this.deleting(), [id]: true });
    try {
      await this.libraryItems.remove(id);
      this.items.reload();
    } catch (err) {
      console.error('Delete failed:', err);
      this.snackBar.open('Verwijderen mislukt. Probeer het opnieuw.', 'Sluiten', {
        duration: 5000,
      });
    } finally {
      this.deleting.set({ ...this.deleting(), [id]: false });
    }
  }
}
