import { Component, computed, inject, input, resource } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LibraryItems } from '../../core/library-items';
import { ItemType, STATUS_LABELS } from '../../core/models';

@Component({
  selector: 'app-item-detail',
  imports: [RouterLink, MatButtonModule, MatProgressSpinnerModule],
  template: `
    <main class="detail">
      @if (item.isLoading()) {
        <mat-spinner diameter="32" />
      } @else if (item.value(); as i) {
        <h1>{{ i.title }}</h1>
        <p>{{ i.creator_name }}</p>
        @if (i.cover_url) {
          <img [src]="i.cover_url" [alt]="'Omslag van ' + i.title" width="120" />
        }
        <p>{{ statusLabel() }}</p>
        @if (i.rating) {
          <p>Beoordeling: {{ i.rating }} / 5</p>
        }
        @if (i.category) {
          <p>Categorie: {{ i.category }}</p>
        }
        @if (i.page_count) {
          <p>{{ i.page_count }} pagina's</p>
        }
        @if (i.start_date) {
          <p>Gestart: {{ i.start_date }}{{ i.end_date ? ' · Afgerond: ' + i.end_date : '' }}</p>
        }
        @if (i.description) {
          <p>{{ i.description }}</p>
        }
        <a mat-flat-button [routerLink]="editRoute()">Bewerken</a>
      } @else {
        <p>Item niet gevonden.</p>
      }
    </main>
  `,
  styles: `.detail { max-width: 720px; margin: 0 auto; padding: 2rem 1rem; }`,
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

  protected readonly editRoute = computed(() => [
    this.type() === 'BOOK' ? '/library/books' : '/library/documentaries',
    this.id(),
    'edit',
  ]);
}
