import { datesForStatus, topCategory, todayIso } from './models';

describe('topCategory', () => {
  it('neemt het hoogste niveau van het pad', () => {
    expect(topCategory('Psychology / Cognitive Psychology')).toBe('Psychology');
  });

  it('valt terug op Onbekend', () => {
    expect(topCategory(null)).toBe('Onbekend');
    expect(topCategory('')).toBe('Onbekend');
  });
});

describe('datesForStatus', () => {
  const today = todayIso();

  it('wist datums bij TO_DO', () => {
    expect(datesForStatus('DONE', 'TO_DO', '2026-01-01')).toEqual({ start_date: null, end_date: null });
  });

  it('zet startdatum op vandaag bij IN_PROGRESS', () => {
    expect(datesForStatus('TO_DO', 'IN_PROGRESS', null)).toEqual({ start_date: today, end_date: null });
  });

  it('behoudt startdatum bij terugzetten van DONE naar IN_PROGRESS', () => {
    expect(datesForStatus('DONE', 'IN_PROGRESS', '2026-01-01')).toEqual({
      start_date: '2026-01-01',
      end_date: null,
    });
  });

  it('zet einddatum op vandaag bij DONE', () => {
    expect(datesForStatus('IN_PROGRESS', 'DONE', '2026-01-01')).toEqual({
      start_date: '2026-01-01',
      end_date: today,
    });
  });
});
