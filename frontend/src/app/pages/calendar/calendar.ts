import { Component, computed, inject, resource, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LibraryItems } from '../../core/library-items';
import { LibraryItem, todayIso } from '../../core/models';
import { categoryColor, categoryLabel } from '../../core/category-colors';

const WINDOW_DAYS = 90;
const SHIFT_DAYS = 30;
const DAY_MS = 86_400_000;
/** Minimale ruimte voor de titel bij het stapelen, zodat labels elkaar niet overlappen. */
const LABEL_DAYS = 16;

interface Bar {
  item: LibraryItem;
  start: string;
  end: string;
  days: number;
  slot: number;
}

interface PlacedBar extends Bar {
  left: number;
  width: number;
}

const toIso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const dayNumber = (iso: string) => Date.parse(iso) / DAY_MS;

@Component({
  selector: 'app-calendar',
  imports: [RouterLink, MatProgressSpinnerModule],
  templateUrl: './calendar.html',
  styleUrl: './calendar.scss',
})
export class Calendar {
  private readonly libraryItems = inject(LibraryItems);

  protected readonly items = resource({ loader: () => this.libraryItems.list() });
  protected readonly today = todayIso();
  protected readonly windowStart = signal(this.defaultStart());

  private defaultStart(): string {
    const d = new Date();
    d.setDate(d.getDate() - 60);
    return toIso(d);
  }

  protected readonly rangeLabel = computed(() => {
    const fmt = (iso: string) =>
      new Date(iso).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' });
    return `${fmt(this.windowStart())} – ${fmt(this.windowEnd())}`;
  });

  private windowEnd(): string {
    return toIso(new Date(Date.parse(this.windowStart()) + (WINDOW_DAYS - 1) * DAY_MS));
  }

  private pct(iso: string): number {
    return ((dayNumber(iso) - dayNumber(this.windowStart())) / WINDOW_DAYS) * 100;
  }

  /** Alle balken met een vaste rij (slot), zodat gelijktijdige items stapelen. */
  private readonly bars = computed<Bar[]>(() => {
    const bars = (this.items.value() ?? [])
      .filter((i) => i.status !== 'TO_DO')
      .map((item) => {
        const start = item.start_date ?? item.end_date;
        const end = item.status === 'IN_PROGRESS' ? this.today : (item.end_date ?? start);
        if (!start || !end) {
          return null;
        }
        const last = end < start ? start : end;
        return { item, start, end: last, days: dayNumber(last) - dayNumber(start) + 1, slot: 0 };
      })
      .filter((b): b is Bar => b !== null)
      .sort((a, b) => a.start.localeCompare(b.start));
    const slotEnds: number[] = [];
    for (const bar of bars) {
      const startDay = dayNumber(bar.start);
      let slot = slotEnds.findIndex((end) => end < startDay);
      if (slot === -1) {
        slot = slotEnds.length;
      }
      slotEnds[slot] = Math.max(dayNumber(bar.end), startDay + LABEL_DAYS);
      bar.slot = slot;
    }
    return bars;
  });

  /** Balken in beeld, met positie in procenten; rijen zonder balken in beeld vallen weg. */
  protected readonly rows = computed<PlacedBar[][]>(() => {
    const start = this.windowStart();
    const end = this.windowEnd();
    const visible = this.bars()
      .filter((b) => b.end >= start && b.start <= end)
      .map((b) => {
        const left = Math.max(0, this.pct(b.start));
        const right = Math.min(100, this.pct(b.end) + 100 / WINDOW_DAYS);
        return { ...b, left, width: Math.max(right - left, 0.8) };
      });
    const slots = [...new Set(visible.map((b) => b.slot))].sort((a, b) => a - b);
    return slots.map((s) => visible.filter((b) => b.slot === s));
  });

  protected readonly ticks = computed(() => {
    const ticks: { left: number; label: string }[] = [];
    const d = new Date(this.windowStart());
    d.setDate(d.getDate() + ((8 - d.getDay()) % 7)); // eerste maandag
    for (; toIso(d) <= this.windowEnd(); d.setDate(d.getDate() + 7)) {
      ticks.push({
        left: this.pct(toIso(d)),
        label: d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' }),
      });
    }
    return ticks;
  });

  protected readonly nowLeft = computed(() => {
    const left = this.pct(this.today) + 50 / WINDOW_DAYS;
    return left >= 0 && left <= 100 ? left : null;
  });

  protected readonly legend = computed(() => {
    const seen = new Map<string, string>();
    for (const row of this.rows()) {
      for (const bar of row) {
        seen.set(categoryLabel(bar.item), categoryColor(bar.item));
      }
    }
    return [...seen.entries()].map(([label, color]) => ({ label, color }));
  });

  protected readonly color = categoryColor;

  protected shift(days: number): void {
    this.windowStart.set(
      toIso(new Date(Date.parse(this.windowStart()) + days * DAY_MS)),
    );
  }

  protected shiftBack(): void {
    this.shift(-SHIFT_DAYS);
  }

  protected shiftForward(): void {
    this.shift(SHIFT_DAYS);
  }

  protected reset(): void {
    this.windowStart.set(this.defaultStart());
  }
}
