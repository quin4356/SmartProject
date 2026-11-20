import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LibraryItem, STATUS_LABELS, itemRoute } from '../core/models';
import { categoryGroup } from '../core/category-colors';

/** Zo lang na toevoegen schuift een rug nog op de plank. */
const NEW_MS = 2 * 60 * 1000;

interface Spine {
  item: LibraryItem;
  link: string[];
  label: string;
  color: string;
  ink: string;
  width: number;
  height: number;
  read: boolean;
  isNew: boolean;
}

/**
 * Boekenplank: staande ruggen voor boeken, liggende documentaires aan het einde.
 * Elke rug is een link; de rug zelf is role="img" met titel, maker, pagina's en status.
 */
@Component({
  selector: 'app-shelf',
  imports: [RouterLink],
  template: `
    <div class="shelf" tabindex="0" [attr.aria-label]="label()">
      @for (s of books(); track s.item.id) {
        <a
          class="spine"
          [class.is-unread]="!s.read"
          [class.is-new]="s.isNew"
          [routerLink]="s.link"
          [style.--c]="s.color"
          [style.--t]="s.ink"
          [style.width.px]="s.width"
          [style.height.px]="s.height"
        >
          <span class="spine__title" role="img" [attr.aria-label]="s.label">{{ s.item.title }}</span>
        </a>
      }
      @if (docs().length) {
        <div class="stack">
          @for (s of docs(); track s.item.id) {
            <a
              class="flat"
              [class.is-unread]="!s.read"
              [class.is-new]="s.isNew"
              [routerLink]="s.link"
              [style.--c]="s.color"
              [style.--t]="s.ink"
            >
              <span class="flat__title" role="img" [attr.aria-label]="s.label">{{ s.item.title }}</span>
            </a>
          }
        </div>
      }
    </div>
  `,
  styles: `
    .shelf {
      display: flex;
      align-items: flex-end;
      gap: 3px;
      min-height: 230px;
      padding: 0 0.5rem;
      border-bottom: 10px solid var(--ink);
      overflow-x: auto;
      overflow-y: hidden;
    }
    .spine,
    .flat {
      flex-shrink: 0;
      box-sizing: border-box;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      background: var(--c);
      color: var(--t);
      text-decoration: none;
      font: 500 0.85rem/1.1 var(--font-display);
    }
    .spine__title {
      writing-mode: vertical-rl;
      transform: rotate(180deg);
      max-height: calc(100% - 1rem);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .stack {
      display: flex;
      flex-direction: column-reverse;
      gap: 2px;
      margin-left: 0.75rem;
      flex-shrink: 0;
    }
    .flat {
      width: 180px;
      height: 32px;
      padding: 0 0.6rem;
    }
    .flat__title {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    /* Niet uitgelezen: alleen een rand, met lichte diagonale arcering */
    .is-unread {
      border: 2px solid var(--c);
      color: var(--ink);
      background: repeating-linear-gradient(
        45deg,
        transparent 0 6px,
        color-mix(in srgb, var(--c) 18%, transparent) 6px 8px
      );
    }
    .spine:focus-visible,
    .flat:focus-visible {
      outline-offset: -3px;
    }
    .is-new {
      animation: slide-in 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) both;
    }
    @keyframes slide-in {
      from {
        transform: translateX(60px);
        opacity: 0;
      }
    }
  `,
})
export class Shelf {
  readonly items = input.required<LibraryItem[]>();
  readonly label = input('Boekenplank');

  private readonly spines = computed(() => this.items().map(toSpine));
  protected readonly books = computed(() => this.spines().filter((s) => s.item.type === 'BOOK'));
  protected readonly docs = computed(() =>
    this.spines().filter((s) => s.item.type === 'DOCUMENTARY'),
  );
}

function toSpine(item: LibraryItem): Spine {
  const group = categoryGroup(item);
  const pages = item.page_count ? `${item.page_count} pagina's` : "pagina's onbekend";
  const status = STATUS_LABELS[item.type][item.status];
  return {
    item,
    link: [itemRoute(item.type), item.id],
    label: `${item.title}, ${item.creator_name}, ${pages}, ${status}`,
    color: group.color,
    ink: group.ink,
    width: Math.round((item.page_count ?? 300) / 15) + 14,
    height: 150 + (item.rating ?? 0) * 14,
    read: item.status === 'DONE',
    isNew: Date.now() - new Date(item.created_at).getTime() < NEW_MS,
  };
}
