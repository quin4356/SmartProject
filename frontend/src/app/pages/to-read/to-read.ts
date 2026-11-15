import { Component, computed, inject, resource, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { LibraryItems } from '../../core/library-items';
import { ItemType } from '../../core/models';
import { categoryColor, categoryLabel } from '../../core/category-colors';

@Component({
  selector: 'app-to-read',
  imports: [RouterLink, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './to-read.html',
  styleUrl: './to-read.scss',
})
export class ToRead {
  private readonly libraryItems = inject(LibraryItems);

  protected readonly items = resource({ loader: () => this.libraryItems.list() });
  protected readonly type = signal<ItemType | ''>('');
  protected readonly category = signal('');

  private readonly open = computed(() =>
    (this.items.value() ?? []).filter((i) => i.status === 'TO_DO'),
  );
  protected readonly categories = computed(() =>
    [...new Set(this.open().map(categoryLabel))].sort((a, b) => a.localeCompare(b)),
  );
  protected readonly filtered = computed(() =>
    this.open().filter(
      (i) =>
        (!this.type() || i.type === this.type()) &&
        (!this.category() || categoryLabel(i) === this.category()),
    ),
  );

  protected readonly color = categoryColor;
  protected readonly label = categoryLabel;

  protected setType(event: Event): void {
    this.type.set((event.target as HTMLSelectElement).value as ItemType | '');
  }

  protected setCategory(event: Event): void {
    this.category.set((event.target as HTMLSelectElement).value);
  }

  protected editLink(type: ItemType, id: string): string[] {
    return [type === 'BOOK' ? '/library/books' : '/library/documentaries', id, 'edit'];
  }
}
