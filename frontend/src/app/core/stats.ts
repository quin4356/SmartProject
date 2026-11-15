import { LibraryItem, topCategory } from './models';

export const YEAR_GOAL = 12;

export interface CategoryStat {
  category: string;
  books: number;
  pages: number;
  avgRating: number | null;
}

const isReadBook = (i: LibraryItem) => i.type === 'BOOK' && i.status === 'DONE';
const yearOf = (i: LibraryItem) => (i.end_date ? Number(i.end_date.slice(0, 4)) : null);

export function readBooks(items: LibraryItem[]): LibraryItem[] {
  return items.filter(isReadBook);
}

export function categoryStats(items: LibraryItem[]): CategoryStat[] {
  const groups = new Map<string, LibraryItem[]>();
  for (const item of readBooks(items)) {
    const key = topCategory(item.category);
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }
  return [...groups.entries()]
    .map(([category, books]) => {
      const ratings = books.map((b) => b.rating).filter((r): r is number => r !== null);
      return {
        category,
        books: books.length,
        pages: books.reduce((sum, b) => sum + (b.page_count ?? 0), 0),
        avgRating: ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null,
      };
    })
    .sort((a, b) => b.books - a.books || a.category.localeCompare(b.category));
}

export function readYears(items: LibraryItem[]): number[] {
  const years = new Set(readBooks(items).map(yearOf).filter((y): y is number => y !== null));
  return [...years].sort((a, b) => b - a);
}

/** Gelezen boeken per maand (12 waarden) in het opgegeven jaar. */
export function booksPerMonth(items: LibraryItem[], year: number): number[] {
  const months = new Array<number>(12).fill(0);
  for (const item of readBooks(items)) {
    if (yearOf(item) === year) {
      months[Number(item.end_date!.slice(5, 7)) - 1]++;
    }
  }
  return months;
}

export function booksInYear(items: LibraryItem[], year: number): number {
  return booksPerMonth(items, year).reduce((a, b) => a + b, 0);
}

/** Leestempo: pagina's per dag. Apart van de kennis-per-categorie-statistieken. */
export function pagesPerDay(items: LibraryItem[]): number | null {
  let pages = 0;
  let days = 0;
  for (const i of readBooks(items)) {
    if (i.page_count && i.start_date && i.end_date) {
      pages += i.page_count;
      days += (Date.parse(i.end_date) - Date.parse(i.start_date)) / 86_400_000 + 1;
    }
  }
  return days ? pages / days : null;
}

export function authorCounts(items: LibraryItem[]): { author: string; books: number }[] {
  const counts = new Map<string, number>();
  for (const i of readBooks(items)) {
    counts.set(i.creator_name, (counts.get(i.creator_name) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([author, books]) => ({ author, books }))
    .sort((a, b) => b.books - a.books);
}
