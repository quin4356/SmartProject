import { Component, computed, inject, input, resource, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { firstValueFrom } from 'rxjs';
import { LibraryItems } from '../../core/library-items';
import { ItemType, STATUS_LABELS, itemRoute } from '../../core/models';
import { categoryGroup, categoryLabel } from '../../core/category-colors';
import { ItemExtras } from '../../core/item-extras';
import { ConfirmDialog } from '../../shared/confirm-dialog';

@Component({
  selector: 'app-item-detail',
  imports: [DatePipe, RouterLink],
  templateUrl: './item-detail.html',
  styleUrl: './item-detail.scss',
})
export class ItemDetail {
  private readonly libraryItems = inject(LibraryItems);
  private readonly extras = inject(ItemExtras);

  readonly id = input.required<string>();
  readonly type = input.required<ItemType>();

  protected readonly item = resource({
    params: () => this.id(),
    loader: ({ params }) => this.libraryItems.get(params),
  });

  protected readonly statusLabel = computed(() => {
    const i = this.item.value();
    return i ? STATUS_LABELS[i.type][i.status] : '';
  });

  protected readonly history = resource({
    params: () => this.id(),
    loader: ({ params }) => this.extras.history(params),
  });

  protected readonly group = categoryGroup;
  protected readonly categoryLabel = categoryLabel;

  protected label(type: ItemType, status: keyof (typeof STATUS_LABELS)['BOOK']): string {
    return STATUS_LABELS[type][status];
  }

  protected readonly editRoute = computed(() => [itemRoute(this.type()), this.id(), 'edit']);

  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);
  protected readonly deleting = signal(false);

  protected async remove(id: string, title: string): Promise<void> {
    const ref = this.dialog.open(ConfirmDialog, {
      data: {
        title: 'Verwijderen',
        message: `"${title}" verwijderen? Dit kan niet ongedaan worden gemaakt.`,
      },
    });
    if (!(await firstValueFrom(ref.afterClosed()))) {
      return;
    }
    this.deleting.set(true);
    try {
      await this.libraryItems.remove(id);
      await this.router.navigateByUrl(itemRoute(this.type()));
    } catch {
      this.snackBar.open('Verwijderen mislukt. Probeer het opnieuw.', 'Sluiten', {
        duration: 5000,
      });
      this.deleting.set(false);
    }
  }
}
