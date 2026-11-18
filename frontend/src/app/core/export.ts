import { LibraryItem } from './models';

const COLUMNS: (keyof LibraryItem)[] = [
  'type', 'status', 'title', 'creator_name', 'category', 'rating',
  'page_count', 'start_date', 'end_date', 'description',
];

const cell = (value: unknown): string => {
  const text = value === null || value === undefined ? '' : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export function toCsv(items: LibraryItem[]): string {
  const rows = items.map((item) => COLUMNS.map((c) => cell(item[c])).join(','));
  return [COLUMNS.join(','), ...rows].join('\n');
}

export function download(filename: string, content: string, mime: string): void {
  const url = URL.createObjectURL(new Blob([content], { type: `${mime};charset=utf-8` }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
