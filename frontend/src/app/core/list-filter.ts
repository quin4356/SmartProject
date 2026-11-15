import { ItemStatus, LibraryItem } from './models';

export type SortKey = 'newest' | 'title' | 'rating';

/** Zoekt op titel/maker/categorie, filtert op status en sorteert. */
export function filterItems(
  items: LibraryItem[],
  query: string,
  status: ItemStatus | '',
  sort: SortKey,
): LibraryItem[] {
  const q = query.trim().toLowerCase();
  const result = items.filter(
    (i) =>
      (!status || i.status === status) &&
      (!q || [i.title, i.creator_name, i.category ?? ''].some((v) => v.toLowerCase().includes(q))),
  );
  if (sort === 'title') {
    return result.sort((a, b) => a.title.localeCompare(b.title));
  }
  if (sort === 'rating') {
    return result.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
  }
  return result;
}
