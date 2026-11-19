import { Component, computed, inject, input, resource } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LibraryItems } from '../../core/library-items';
import { ItemType, STATUS_LABELS, itemRoute } from '../../core/models';
import { categoryColor } from '../../core/category-colors';

@Component({
  selector: 'app-item-detail',
  imports: [RouterLink],
  templateUrl: './item-detail.html',
  styleUrl: './item-detail.scss',
})
export class ItemDetail {
  private readonly libraryItems = inject(LibraryItems);

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

  protected readonly color = categoryColor;

  protected readonly editRoute = computed(() => [itemRoute(this.type()), this.id(), 'edit']);
}
