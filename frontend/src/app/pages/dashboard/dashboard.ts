import { Component, computed, inject, resource, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { LibraryItems } from '../../core/library-items';
import {
  YEAR_GOAL,
  authorCounts,
  booksInYear,
  booksPerMonth,
  categoryStats,
  pagesPerDay,
  readYears,
} from '../../core/stats';
import { LibraryList } from '../library-list/library-list';

const MONTHS = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];

@Component({
  selector: 'app-dashboard',
  imports: [LibraryList, DecimalPipe, RouterLink, MatButtonModule, MatIconModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {
  private readonly libraryItems = inject(LibraryItems);

  protected readonly months = MONTHS;
  protected readonly goal = YEAR_GOAL;
  protected readonly currentYear = new Date().getFullYear();

  protected readonly items = resource({ loader: () => this.libraryItems.list() });
  protected readonly data = computed(() => this.items.value() ?? []);

  protected readonly selectedYear = signal(this.currentYear);
  protected readonly years = computed(() =>
    [...new Set([this.currentYear, ...readYears(this.data())])].sort((a, b) => b - a),
  );

  protected readonly categories = computed(() => categoryStats(this.data()));
  protected readonly maxBooks = computed(() => Math.max(1, ...this.categories().map((c) => c.books)));
  protected readonly perMonth = computed(() => booksPerMonth(this.data(), this.selectedYear()));
  protected readonly maxMonth = computed(() => Math.max(1, ...this.perMonth()));
  protected readonly yearCount = computed(() => booksInYear(this.data(), this.currentYear));
  protected readonly goalPercent = computed(() => Math.min(100, (this.yearCount() / YEAR_GOAL) * 100));
  protected readonly pace = computed(() => pagesPerDay(this.data()));
  protected readonly authors = computed(() => authorCounts(this.data()));

  protected selectYear(event: Event): void {
    this.selectedYear.set(Number((event.target as HTMLSelectElement).value));
  }
}
