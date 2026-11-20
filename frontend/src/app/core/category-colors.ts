import { LibraryItem, topCategory } from './models';

// Bookcloth: vijf bandkleuren; alles wat niet past krijgt --cat-overig.
export interface CategoryGroup {
  name: string;
  color: string;
  /** Tekstkleur op de band (psychologie is licht, dus donkere tekst). */
  ink: string;
}

const LIGHT = 'var(--on-dark)';

export const CATEGORY_GROUPS: CategoryGroup[] = [
  { name: 'Literatuur', color: 'var(--cat-literatuur)', ink: LIGHT },
  { name: 'Informatica', color: 'var(--cat-informatica)', ink: LIGHT },
  { name: 'Wetenschap', color: 'var(--cat-wetenschap)', ink: LIGHT },
  { name: 'Psychologie', color: 'var(--cat-psychologie)', ink: 'var(--cat-psychologie-text)' },
  { name: 'Geschiedenis', color: 'var(--cat-geschiedenis)', ink: LIGHT },
  { name: 'Overig', color: 'var(--cat-overig)', ink: LIGHT },
];

// Google Books-categorieën (hoogste niveau) per groep
const GROUP_OF: Record<string, string> = {
  'Fiction': 'Literatuur',
  'Literary Criticism': 'Literatuur',
  'Literary Collections': 'Literatuur',
  'Poetry': 'Literatuur',
  'Drama': 'Literatuur',
  'Juvenile Fiction': 'Literatuur',
  'Young Adult Fiction': 'Literatuur',
  'Comics & Graphic Novels': 'Literatuur',
  'Computers': 'Informatica',
  'Technology & Engineering': 'Informatica',
  'Science': 'Wetenschap',
  'Mathematics': 'Wetenschap',
  'Nature': 'Wetenschap',
  'Medical': 'Wetenschap',
  'Psychology': 'Psychologie',
  'Self-Help': 'Psychologie',
  'History': 'Geschiedenis',
  'Biography & Autobiography': 'Geschiedenis',
};

export function categoryGroup(item: Pick<LibraryItem, 'type' | 'category'>): CategoryGroup {
  const name = item.type === 'BOOK' ? GROUP_OF[topCategory(item.category)] : undefined;
  return CATEGORY_GROUPS.find((g) => g.name === name) ?? CATEGORY_GROUPS[CATEGORY_GROUPS.length - 1];
}

export function categoryColor(item: Pick<LibraryItem, 'type' | 'category'>): string {
  return categoryGroup(item).color;
}

export function categoryLabel(item: Pick<LibraryItem, 'type' | 'category'>): string {
  return item.type === 'DOCUMENTARY' ? 'Documentaire' : topCategory(item.category);
}
