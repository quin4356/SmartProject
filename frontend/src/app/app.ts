import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { AccountMenu } from './shared/account-menu';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, AccountMenu],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}