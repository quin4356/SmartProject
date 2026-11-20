import { Component, computed, inject, resource, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LibraryItems } from '../../core/library-items';
import { download, toCsv } from '../../core/export';
import {
  YEAR_GOAL,
  authorCounts,
  booksInYear,
  booksPerMonth,
  categoryStats,
  pagesPerDay,
  readYears,
} from '../../core/stats';
import { Auth } from '../../core/auth';
import { CATEGORY_GROUPS, categoryColor, categoryGroup } from '../../core/category-colors';
import { LibraryItem, datesForStatus, itemRoute } from '../../core/models';
import { Shelf } from '../../shared/shelf';

const GOAL_KEY = 'yearGoal';
const PAGE_KEY = 'currentPage:';

/** Huidige pagina per boek, lokaal bewaard (zoals het jaardoel). */
function storedPage(id: string): number {
  try {
    return Number(localStorage.getItem(PAGE_KEY + id)) || 0;
  } catch {
    return 0;
  }
}

function storedGoal(): number {
  try {
    const value = Number(localStorage.getItem(GOAL_KEY));
    return Number.isInteger(value) && value > 0 ? value : YEAR_GOAL;
  } catch {
    return YEAR_GOAL;
  }
}

function greeting(hour: number): string {
  if (hour < 6) {
    return 'Goedenacht';
  }
  if (hour < 12) {
    return 'Goedemorgen';
  }
  return hour < 18 ? 'Goedemiddag' : 'Goedenavond';
}

const MONTHS = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];

@Component({
  selector: 'app-dashboard',
  imports: [DecimalPipe, RouterLink, Shelf],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {
  private readonly libraryItems = inject(LibraryItems);
  private readonly auth = inject(Auth);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly months = MONTHS;
  protected readonly goal = signal(storedGoal());
  protected readonly currentYear = new Date().getFullYear();

  protected readonly items = resource({ loader: () => this.libraryItems.list() });
  protected readonly data = computed(() => this.items.value() ?? []);

  protected readonly selectedYear = signal(this.currentYear);
  protected readonly years = computed(() =>
    [...new Set([this.currentYear, ...readYears(this.data())])].sort((a, b) => b - a),
  );

  protected readonly categories = computed(() => categoryStats(this.data()));
  protected readonly maxBooks = computed(() =>
    Math.max(1, ...this.categories().map((c) => c.books)),
  );
  protected readonly perMonth = computed(() => booksPerMonth(this.data(), this.selectedYear()));
  protected readonly maxMonth = computed(() => Math.max(1, ...this.perMonth()));
  protected readonly yearCount = computed(() => booksInYear(this.data(), this.currentYear));
  protected readonly goalPercent = computed(() =>
    Math.min(100, (this.yearCount() / this.goal()) * 100),
  );
  protected readonly pace = computed(() => pagesPerDay(this.data()));
  protected readonly authors = computed(() => authorCounts(this.data()).slice(0, 6));

  protected readonly firstName = computed(
    () =>
      ((this.auth.user()?.user_metadata?.['full_name'] as string | undefined) ?? '').split(' ')[0],
  );
  protected readonly greeting = greeting(new Date().getHours());
  protected readonly nameSuffix = computed(() => (this.firstName() ? `, ${this.firstName()}` : ''));
  protected readonly today = new Date().toLocaleDateString('nl-NL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  protected readonly docsThisYear = computed(
    () =>
      this.data().filter(
        (i) =>
          i.type === 'DOCUMENTARY' &&
          i.status === 'DONE' &&
          i.end_date?.startsWith(String(this.currentYear)),
      ).length,
  );

  /** Plank van dit jaar: dit jaar uitgelezen of bekeken, plus wat nu bezig is. */
  protected readonly yearShelf = computed(() =>
    this.data()
      .filter(
        (i) =>
          i.status === 'IN_PROGRESS' ||
          (i.status === 'DONE' && i.end_date?.startsWith(String(this.currentYear))),
      )
      .sort((a, b) => (a.end_date ?? '9999').localeCompare(b.end_date ?? '9999')),
  );
  protected readonly reading = computed(() =>
    this.data().filter((i) => i.status === 'IN_PROGRESS'),
  );
  protected readonly toRead = computed(() =>
    this.data()
      .filter((i) => i.status === 'TO_DO')
      .slice(0, 10),
  );
  protected readonly groups = CATEGORY_GROUPS;
  protected readonly group = categoryGroup;

  /** Pagina's die in deze sessie zijn bijgewerkt (overschrijft de lokale opslag). */
  private readonly pages = signal<Record<string, number>>({});
  protected readonly editingPage = signal<string | null>(null);
  protected readonly busy = signal<string | null>(null);
  protected readonly totalRead = computed(
    () => this.data().filter((i) => i.status === 'DONE').length,
  );
  protected readonly totalPages = computed(() =>
    this.data()
      .filter((i) => i.type === 'BOOK' && i.status === 'DONE')
      .reduce((sum, i) => sum + (i.page_count ?? 0), 0),
  );
  protected readonly color = categoryColor;

  protected link(item: LibraryItem): string[] {
    return [itemRoute(item.type), item.id];
  }

  protected setGoal(event: Event): void {
    const value = Math.floor(Number((event.target as HTMLInputElement).value));
    if (value > 0) {
      this.goal.set(value);
      try {
        localStorage.setItem(GOAL_KEY, String(value));
      } catch {
        // opslag niet beschikbaar: doel geldt alleen voor deze sessie
      }
    }
  }

  protected currentPage(item: LibraryItem): number {
    return this.pages()[item.id] ?? storedPage(item.id);
  }

  protected progress(item: LibraryItem): number {
    return item.page_count ? Math.min(100, (this.currentPage(item) / item.page_count) * 100) : 0;
  }

  protected savePage(item: LibraryItem, value: string): void {
    const page = Math.max(0, Math.min(item.page_count ?? Infinity, Math.floor(Number(value))));
    if (Number.isNaN(page)) {
      return;
    }
    this.pages.set({ ...this.pages(), [item.id]: page });
    try {
      localStorage.setItem(PAGE_KEY + item.id, String(page));
    } catch {
      // opslag niet beschikbaar: pagina geldt alleen voor deze sessie
    }
    this.editingPage.set(null);
  }

  protected async markRead(item: LibraryItem): Promise<void> {
    this.busy.set(item.id);
    try {
      await this.libraryItems.update(item.id, {
        status: 'DONE',
        ...datesForStatus(item.status, 'DONE', item.start_date),
      });
      this.items.reload();
    } catch {
      this.snackBar.open('Bijwerken mislukt. Probeer het opnieuw.', 'Sluiten', { duration: 5000 });
    } finally {
      this.busy.set(null);
    }
  }

  protected exportJson(): void {
    download('bibliotheek.json', JSON.stringify(this.data(), null, 2), 'application/json');
  }

  protected exportCsv(): void {
    download('bibliotheek.csv', toCsv(this.data()), 'text/csv');
  }

  protected selectYear(event: Event): void {
    this.selectedYear.set(Number((event.target as HTMLSelectElement).value));
  }
}
