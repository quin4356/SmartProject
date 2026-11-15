import { LibraryItem, topCategory } from './models';

// Gedempte middentonen (HSL, L ~45%): leesbaar met witte tekst op het donkere thema.
const HUES: Record<string, number> = {
  'Political Science': 215, // blauw
  'Psychology': 270, // paars
  'History': 30, // bruin/oranje
  'Business & Economics': 145, // groen
  'Science': 175, // teal
  'Philosophy': 245, // indigo
  'Social Science': 335, // roze
  'Self-Help': 15, // rood-oranje
  'Biography & Autobiography': 50, // geel/goud
  'Computers': 195, // cyaan
  'Health & Fitness': 100, // lime
  'Religion': 290, // magenta
};

const NEUTRAL = 'hsl(220 8% 38%)';
const UNKNOWN = 'hsl(0 0% 30%)';

export function categoryColor(item: Pick<LibraryItem, 'type' | 'category'>): string {
  if (item.type === 'DOCUMENTARY') {
    return NEUTRAL;
  }
  const name = topCategory(item.category);
  if (name === 'Onbekend') {
    return UNKNOWN;
  }
  const hue = HUES[name] ?? hashHue(name);
  return `hsl(${hue} 45% 42%)`;
}

export function categoryLabel(item: Pick<LibraryItem, 'type' | 'category'>): string {
  return item.type === 'DOCUMENTARY' ? 'Documentaire' : topCategory(item.category);
}

function hashHue(name: string): number {
  let h = 0;
  for (const c of name) {
    h = (h * 31 + c.charCodeAt(0)) % 360;
  }
  return h;
}
