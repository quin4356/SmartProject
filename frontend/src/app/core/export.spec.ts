import { toCsv } from './export';
import { LibraryItem } from './models';

describe('toCsv', () => {
  it('escapet komma’s en aanhalingstekens', () => {
    const item = { type: 'BOOK', status: 'DONE', title: 'Titel, "met" komma', creator_name: 'A', rating: 4 } as LibraryItem;
    const [header, row] = toCsv([item]).split('\n');
    expect(header.startsWith('type,status,title')).toBe(true);
    expect(row).toBe('BOOK,DONE,"Titel, ""met"" komma",A,,4,,,,');
  });
});
