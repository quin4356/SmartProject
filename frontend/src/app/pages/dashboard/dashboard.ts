import { Component, computed, inject, resource, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
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
import { categoryColor } from '../../core/category-colors';
import { LibraryItem, itemRoute } from '../../core/models';

const GOAL_KEY = 'yearGoal';

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
  imports: [DecimalPipe, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {
  private readonly libraryItems = inject(LibraryItems);
  private readonly auth = inject(Auth);

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

  /** Wat nu gelezen of bekeken wordt, en anders de laatst toegevoegde items. */
  protected readonly shelf = computed(() => {
    const busy = this.data().filter((i) => i.status === 'IN_PROGRESS');
    return busy.length ? busy : this.data().slice(0, 8);
  });
  protected readonly shelfIsBusy = computed(() =>
    this.data().some((i) => i.status === 'IN_PROGRESS'),
  );
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
