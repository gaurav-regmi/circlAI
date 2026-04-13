import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { UsersService } from '../../core/services/users.service';
import { AuthResponse } from '../../core/models';

@Component({
  selector: 'app-navbar',
  standalone: false,
  template: `
    <nav class="sidebar">
      <div class="sidebar-brand">
        <div class="brand-mark">✦</div>
        <span class="brand-name">CIRCLAI</span>
      </div>

      <div class="nav-section">
        <a routerLink="/events" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }" class="nav-link" title="Discover">
          <span class="nav-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
            </svg>
          </span>
          <span class="nav-label">Discover</span>
          <span class="nav-dot"></span>
        </a>

        <a routerLink="/my-events" routerLinkActive="active" class="nav-link" title="My Events">
          <span class="nav-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </span>
          <span class="nav-label">My Events</span>
          <span class="nav-dot"></span>
        </a>

        @if (isOrganizer) {
          <a routerLink="/events/create" routerLinkActive="active" class="nav-link" title="Create Event">
            <span class="nav-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="16"/>
                <line x1="8" y1="12" x2="16" y2="12"/>
              </svg>
            </span>
            <span class="nav-label">Create Event</span>
            <span class="nav-dot"></span>
          </a>
        }

        <a routerLink="/chat" routerLinkActive="active" class="nav-link" title="Chat">
          <span class="nav-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </span>
          <span class="nav-label">Chat</span>
          <span class="nav-dot"></span>
        </a>

        <a routerLink="/activity" routerLinkActive="active" class="nav-link" title="Activity">
          <span class="nav-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
          </span>
          <span class="nav-label">Activity</span>
          <span class="nav-dot"></span>
        </a>

        <a routerLink="/people" routerLinkActive="active" class="nav-link" title="People">
          <span class="nav-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </span>
          <span class="nav-label">People</span>
          <span class="nav-dot"></span>
        </a>

        <a routerLink="/profile" routerLinkActive="active" class="nav-link" title="Profile">
          <span class="nav-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </span>
          <span class="nav-label">Profile</span>
          <span class="nav-dot"></span>
        </a>

        <a routerLink="/notifications" routerLinkActive="active" class="nav-link" title="Notifications">
          <span class="nav-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
          </span>
          <span class="nav-label">Notifications</span>
          <span class="nav-dot"></span>
        </a>
      </div>

      <div class="sidebar-footer">
        <div class="user-card">
          <div class="user-avatar" style="overflow:hidden;padding:0">
            @if (userId && !ownPictureFailed) {
              <img [src]="ownPictureUrl"
                   (error)="ownPictureFailed = true"
                   style="width:100%;height:100%;object-fit:cover;border-radius:50%;display:block" />
            } @else {
              <span style="display:flex;align-items:center;justify-content:center;width:100%;height:100%">{{ initials }}</span>
            }
          </div>
          <div class="user-meta">
            <div class="user-name">{{ user?.firstName }} {{ user?.lastName }}</div>
            <div class="user-email">{{ user?.email }}</div>
          </div>
        </div>
        <button class="logout-btn" (click)="logout()">Sign out</button>
        <button class="collapse-btn" (click)="toggleCollapse()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            @if (collapsed) {
              <polyline points="9 18 15 12 9 6"/>
            } @else {
              <polyline points="15 18 9 12 15 6"/>
            }
          </svg>
          <span class="collapse-label">{{ collapsed ? 'Expand' : 'Collapse' }}</span>
        </button>
      </div>
    </nav>
  `,
  styles: []
})
export class NavbarComponent implements OnInit {
  user: AuthResponse | null = null;
  isOrganizer = false;
  userId: string | null = null;
  ownPictureUrl = '';
  ownPictureFailed = false;
  collapsed = false;

  constructor(
    private authService: AuthService,
    private usersService: UsersService,
    private router: Router
  ) {}

  ngOnInit() {
    this.user = this.authService.getCurrentUser();
    this.isOrganizer = this.authService.isOrganizer();
    this.userId = this.authService.getUserId();
    if (this.userId) {
      this.ownPictureUrl = this.usersService.pictureUrl(this.userId);
    }
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved === 'true') {
      this.collapsed = true;
      document.body.classList.add('sidebar-collapsed');
    }
  }

  get initials(): string {
    if (!this.user) return '?';
    return `${this.user.firstName[0] ?? ''}${this.user.lastName[0] ?? ''}`.toUpperCase();
  }

  toggleCollapse(): void {
    this.collapsed = !this.collapsed;
    document.body.classList.toggle('sidebar-collapsed', this.collapsed);
    localStorage.setItem('sidebar-collapsed', String(this.collapsed));
  }

  logout(): void {
    this.authService.logout();
    document.body.classList.remove('sidebar-collapsed');
    this.router.navigate(['/login']);
  }
}
