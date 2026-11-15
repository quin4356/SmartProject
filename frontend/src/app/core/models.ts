export type ItemType = 'BOOK' | 'DOCUMENTARY';
export type ItemStatus = 'TO_DO' | 'IN_PROGRESS' | 'DONE';

export interface LibraryItem {
  id: string;
  user_id: string;
  type: ItemType;
  status: ItemStatus;
  title: string;
  creator_name: string;
  description: string | null;
  cover_url: string | null;
  language: string | null;
  publication_year: number | null;
  isbn: string | null;
  publisher: string | null;
  page_count: number | null;
  release_date: string | null;
  runtime_minutes: number | null;
  country: string | null;
  external_source: 'GOOGLE_BOOKS' | 'TMDB' | null;
  external_id: string | null;
  category: string | null;
  rating: number | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

export type NewLibraryItem = Pick<LibraryItem, 'type' | 'title' | 'creator_name'> &
  Partial<Omit<LibraryItem, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;

export const STATUS_LABELS: Record<ItemType, Record<ItemStatus, string>> = {
  BOOK: { TO_DO: 'Te lezen', IN_PROGRESS: 'Aan het lezen', DONE: 'Gelezen' },
  DOCUMENTARY: { TO_DO: 'Te bekijken', IN_PROGRESS: 'Aan het bekijken', DONE: 'Bekeken' },
};

/** Hoogste niveau van het categoriepad; boeken zonder categorie vallen in "Onbekend". */
export function topCategory(category: string | null): string {
  return category?.split('/')[0].trim() || 'Onbekend';
}


export function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Automatische datums bij een statuswijziging (old = null bij een nieuw item). */
export function datesForStatus(
  old: ItemStatus | null,
  next: ItemStatus,
  start: string | null,
  end: string | null,
): { start_date: string | null; end_date: string | null } {
  const today = todayIso();
  if (next === 'TO_DO') {
    return { start_date: null, end_date: null };
  }
  if (next === 'IN_PROGRESS') {
    return { start_date: old === 'DONE' ? start : today, end_date: null };
  }
  return { start_date: start ?? today, end_date: today };
}
