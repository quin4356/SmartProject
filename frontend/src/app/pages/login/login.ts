import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { RouterLink } from '@angular/router';
import { Auth } from '../../core/auth';

@Component({
  selector: 'app-login',
  imports: [MatButtonModule, MatCardModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private readonly auth = inject(Auth);

  readonly errorMessage = signal<string | null>(null);

  async signInWithGoogle(): Promise<void> {
    this.errorMessage.set(null);
    try {
      await this.auth.signInWithGoogle();
    } catch {
      this.errorMessage.set('Aanmelden is mislukt. Probeer het opnieuw.');
    }
  }
}