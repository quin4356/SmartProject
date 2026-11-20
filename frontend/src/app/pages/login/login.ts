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

  /** Decoratieve boekruggen in de hero: bandkleur, hoogte en breedte (px). */
  protected readonly spines = [
    { title: 'Sapiens', color: 'var(--cat-geschiedenis)', ink: 'var(--on-dark)', h: 192, w: 46 },
    { title: 'Thinking, Fast and Slow', color: 'var(--cat-psychologie)', ink: 'var(--ink)', h: 206, w: 54 },
    { title: 'Middlemarch', color: 'var(--cat-literatuur)', ink: 'var(--on-dark)', h: 220, w: 62 },
    { title: 'Cosmos', color: 'var(--cat-wetenschap)', ink: 'var(--on-dark)', h: 178, w: 42 },
    { title: 'Clean Code', color: 'var(--cat-informatica)', ink: 'var(--on-dark)', h: 164, w: 40 },
    { title: 'De Republiek', color: 'var(--cat-overig)', ink: 'var(--on-dark)', h: 198, w: 50 },
  ];

  async signInWithGoogle(): Promise<void> {
    this.errorMessage.set(null);
    try {
      await this.auth.signInWithGoogle();
    } catch {
      this.errorMessage.set('Aanmelden is mislukt. Probeer het opnieuw.');
    }
  }
}
