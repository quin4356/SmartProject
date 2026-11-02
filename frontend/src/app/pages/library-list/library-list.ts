import { Component, computed, inject, input, resource } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { LibraryItems } from '../../core/library-items';
import { ItemType, STATUS_LABELS } from '../../core/models';

@Component({
  selector: 'app-library-list',
  imports: [MatCardModule, MatButtonModule, MatProgressSpinnerModule, RouterLink],
  templateUrl: './library-list.html',
  styleUrl: './library-list.scss',
})
export class LibraryList {
  private readonly libraryItems = inject(LibraryItems);

  readonly type = input.required<ItemType>();

  protected readonly title = computed(() => (this.type() === 'BOOK' ? 'Boeken' : 'Documentaires'));

  protected readonly addRoute = computed(() =>
    this.type() === 'BOOK' ? '/library/books/new' : '/library/documentaries/new',
  );

  protected readonly items = resource({
    params: () => this.type(),
    loader: ({ params }) => this.libraryItems.list(params),
  });

  protected statusLabel(type: ItemType, status: keyof (typeof STATUS_LABELS)['BOOK']): string {
    return STATUS_LABELS[type][status];
  }
}
