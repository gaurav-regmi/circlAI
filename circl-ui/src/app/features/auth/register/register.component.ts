import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: false,
  template: `
    <div class="auth-page">
      <div class="auth-card" style="max-width:480px">
        <div class="auth-brand">
          <div class="auth-brand-mark">✦</div>
          <div class="auth-brand-name">CIRCLAI</div>
          <h1>Create account</h1>
          <p>Join Circl and start exploring events</p>
        </div>

        @if (error) {
          <div class="alert alert-error">{{ error }}</div>
        }
        @if (success) {
          <div class="alert alert-success">Account created! Redirecting…</div>
        }

        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <!-- Account details -->
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">First name</label>
              <input type="text" class="form-control" formControlName="firstName"
                placeholder="John" autocomplete="given-name" />
            </div>
            <div class="form-group">
              <label class="form-label">Last name</label>
              <input type="text" class="form-control" formControlName="lastName"
                placeholder="Doe" autocomplete="family-name" />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Email address</label>
            <input type="email" class="form-control" formControlName="email"
              placeholder="you@example.com" autocomplete="email" />
          </div>

          <div class="form-group">
            <label class="form-label">Password</label>
            <input type="password" class="form-control" formControlName="password"
              placeholder="Min. 8 characters" autocomplete="new-password" />
            @if (form.get('password')?.touched && form.get('password')?.hasError('minlength')) {
              <div class="form-error">Password must be at least 8 characters.</div>
            }
          </div>

          <div class="form-group">
            <label class="form-label">I am a…</label>
            <select class="form-control" formControlName="role">
              <option value="USER">Attendee (User)</option>
              <option value="EVENT_ORGANIZER">Event Organizer</option>
            </select>
          </div>

          <!-- Profile details section -->
          <div class="section-divider">
            <span>Profile details <span style="color:var(--text-dim);font-weight:400">(optional)</span></span>
          </div>

          <div class="form-group">
            <label class="form-label">Location</label>
            <input type="text" class="form-control" formControlName="location"
              placeholder="e.g. New York, NY" autocomplete="off" />
          </div>

          <button type="submit" class="btn btn-primary btn-lg w-full"
            [disabled]="form.invalid || loading" style="margin-top:4px">
            {{ loading ? 'Creating account…' : 'Create account' }}
          </button>
        </form>

        <p class="auth-switch">
          Already have an account? <a routerLink="/login">Sign in</a>
        </p>
      </div>
    </div>
  `,
  styles: [`
    .section-divider {
      display: flex; align-items: center; gap: 12px;
      margin: 20px 0 16px;
    }
    .section-divider::before, .section-divider::after {
      content: ''; flex: 1; height: 1px; background: var(--border);
    }
    .section-divider span {
      font-size: .75rem; font-weight: 600; text-transform: uppercase;
      letter-spacing: .06em; color: var(--text-muted); white-space: nowrap;
    }

  `]
})
export class RegisterComponent {
  form: FormGroup;
  loading = false;
  error = '';
  success = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.form = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      role: ['USER', Validators.required],
      location: ['']
    });
  }

  onSubmit(): void {
    if (this.form.invalid || this.loading) return;
    this.loading = true;
    this.error = '';

    const { firstName, lastName, email, password, role, location } = this.form.value;
    this.authService.register({
      firstName, lastName, email, password, role,
      location: location || undefined
    }).subscribe({
      next: () => {
        this.success = true;
        setTimeout(() => this.router.navigate(['/events']), 800);
      },
      error: (err) => {
        const errs: string[] = err?.error?.errors ?? [];
        this.error = errs.length ? errs.join(' · ') : (err?.error?.detail || 'Registration failed. Please try again.');
        this.loading = false;
      }
    });
  }
}
