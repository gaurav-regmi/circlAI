import { Component } from '@angular/core';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: false,
  template: `
    @if (isLoggedIn()) {
      <app-navbar></app-navbar>
      <div class="topbar-actions">
        <app-notification-bell></app-notification-bell>
      </div>
    }
    <div class="main-area" [class.with-sidebar]="isLoggedIn()">
      <router-outlet></router-outlet>
    </div>
  `,
  styles: []
})
export class App {
  constructor(private authService: AuthService) {}

  isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }
}
