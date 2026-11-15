import { filterItems } from './list-filter';
import { LibraryItem } from './models';

const item = (over: Partial<LibraryItem>): LibraryItem =>
  ({
    id: '1',
    type: 'BOOK',
    status: 'TO_DO',
    title: 'A',
    creator_name: 'Auteur',
    category: null,
    rating: null,
    ...over,
  }) as LibraryItem;

describe('filterItems', () => {
  const items = [
    item({ id: '1', title: 'Zebra', status: 'DONE', rating: 2 }),
    item({ id: '2', title: 'Appel', creator_name: 'Jansen', rating: 5 }),
  ];

  it('zoekt op titel en maker', () => {
    expect(filterItems(items, 'zeb', '', 'newest').map((i) => i.id)).toEqual(['1']);
    expect(filterItems(items, 'jans', '', 'newest').map((i) => i.id)).toEqual(['2']);
  });

  it('filtert op status', () => {
    expect(filterItems(items, '', 'DONE', 'newest').map((i) => i.id)).toEqual(['1']);
  });

  it('sorteert op titel en rating', () => {
    expect(filterItems(items, '', '', 'title').map((i) => i.id)).toEqual(['2', '1']);
    expect(filterItems(items, '', '', 'rating').map((i) => i.id)).toEqual(['2', '1']);
  });
});
