import { LibraryItem } from './models';
import { booksInYear, booksPerMonth, categoryStats, pagesPerDay } from './stats';

const book = (over: Partial<LibraryItem>): LibraryItem =>
  ({
    type: 'BOOK',
    status: 'DONE',
    creator_name: 'X',
    category: 'Science / Physics',
    rating: null,
    page_count: null,
    start_date: null,
    end_date: null,
    ...over,
  }) as LibraryItem;

describe('stats', () => {
  const items = [
    book({ end_date: '2026-03-10', start_date: '2026-03-01', page_count: 100, rating: 4 }),
    book({ end_date: '2026-03-20', rating: 2 }),
    book({ status: 'TO_DO', end_date: '2026-03-25' }),
  ];

  it('telt alleen gelezen boeken per maand', () => {
    expect(booksPerMonth(items, 2026)[2]).toBe(2);
    expect(booksInYear(items, 2026)).toBe(2);
    expect(booksInYear(items, 2025)).toBe(0);
  });

  it('groepeert per hoofdcategorie met gemiddelde rating', () => {
    expect(categoryStats(items)).toEqual([
      { category: 'Science', books: 2, pages: 100, avgRating: 3 },
    ]);
  });

  it('berekent pagina’s per dag', () => {
    expect(pagesPerDay(items)).toBe(10);
    expect(pagesPerDay([])).toBeNull();
  });
});
