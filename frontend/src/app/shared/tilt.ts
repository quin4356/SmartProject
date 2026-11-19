import { Directive } from '@angular/core';

/** Lichte 3D-kanteling die de muis volgt. Doet niets bij touch of reduced motion. */
@Directive({
  selector: '[appTilt]',
  host: {
    '(pointermove)': 'move($event)',
    '(pointerleave)': 'reset($event)',
  },
})
export class Tilt {
  private readonly still = matchMedia('(prefers-reduced-motion: reduce)').matches;

  protected move(event: PointerEvent): void {
    if (event.pointerType !== 'mouse' || this.still) {
      return;
    }
    const el = event.currentTarget as HTMLElement;
    const r = el.getBoundingClientRect();
    const x = (event.clientX - r.left) / r.width - 0.5;
    const y = (event.clientY - r.top) / r.height - 0.5;
    el.style.setProperty('--ry', `${x * 10}deg`);
    el.style.setProperty('--rx', `${y * -10}deg`);
    el.style.setProperty('--gx', `${(x + 0.5) * 100}%`);
    el.style.setProperty('--gy', `${(y + 0.5) * 100}%`);
  }

  protected reset(event: PointerEvent): void {
    const el = event.currentTarget as HTMLElement;
    el.style.removeProperty('--rx');
    el.style.removeProperty('--ry');
  }
}
