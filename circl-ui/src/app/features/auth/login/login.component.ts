import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: false,
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-brand">
          <div class="auth-brand-mark">✦</div>
          <div class="auth-brand-name">CIRCLAI</div>
          <h1>Welcome back</h1>
          <p>Sign in to your Circl account</p>
        </div>

        @if (error) {
          <div class="alert alert-error">{{ error }}</div>
        }

        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label class="form-label">Email address</label>
            <input type="email" class="form-control" formControlName="email"
              placeholder="you@example.com" autocomplete="email" />
          </div>

          <div class="form-group">
            <label class="form-label">Password</label>
            <input type="password" class="form-control" formControlName="password"
              placeholder="••••••••" autocomplete="current-password" />
          </div>

          <button type="submit" class="btn btn-primary btn-lg w-full"
            [disabled]="form.invalid || loading">
            {{ loading ? 'Signing in…' : 'Sign in' }}
          </button>
        </form>

        <p class="auth-switch">
          Don't have an account? <a routerLink="/register">Create one</a>
        </p>
      </div>
    </div>
  `,
  styles: []
})
export class LoginComponent {
  form: FormGroup;
  loading = false;
  error = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  onSubmit(): void {
    if (this.form.invalid || this.loading) return;
    this.loading = true;
    this.error = '';

    const { email, password } = this.form.value;
    this.authService.login(email, password).subscribe({
      next: () => this.router.navigate(['/events']),
      error: (err) => {
        this.error = err?.error?.detail || 'Invalid email or password.';
        this.loading = false;
      }
    });
  }
}
