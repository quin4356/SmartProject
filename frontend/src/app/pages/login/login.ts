import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { Auth } from '../../core/auth';

@Component({
  selector: 'app-login',
  imports: [MatButtonModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private readonly auth = inject(Auth);

  readonly errorMessage = signal<string | null>(null);

  protected readonly headline = ['Alles', 'wat', 'je', 'leest,', 'blijft', 'bij', 'je.'];

  /** Decoratieve boekruggen in de hero: kleur (hue), hoogte en breedte. */
  protected readonly spines = [
    { title: 'Sapiens', hue: 30, h: 86, w: 46 },
    { title: 'Thinking, Fast and Slow', hue: 270, h: 94, w: 54 },
    { title: 'Atomic Habits', hue: 15, h: 78, w: 40 },
    { title: 'Cosmos', hue: 195, h: 90, w: 50 },
    { title: 'Meditaties', hue: 245, h: 82, w: 38 },
    { title: 'De Republiek', hue: 215, h: 96, w: 58 },
    { title: 'Factfulness', hue: 145, h: 84, w: 44 },
  ];

  protected readonly months = [2, 3, 1, 4, 3, 5, 4, 6, 5, 7, 6, 8];

  async signInWithGoogle(): Promise<void> {
    this.errorMessage.set(null);
    try {
      await this.auth.signInWithGoogle();
    } catch {
      this.errorMessage.set('Aanmelden is mislukt. Probeer het opnieuw.');
    }
  }
}
