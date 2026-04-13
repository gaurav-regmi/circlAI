import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ActivityService } from '../../core/services/activity.service';
import { AuthService } from '../../core/services/auth.service';
import { ActivityVM } from '../../core/models';

@Component({
  selector: 'app-activity-feed',
  standalone: false,
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Activity</h1>
          <p class="page-subtitle">Your event engagement overview</p>
        </div>
      </div>

      <!-- Stats row -->
      @if (!loading && activities.length > 0) {
        <div class="stat-row">
          <div class="stat-card">
            <div class="stat-card-icon" style="background:rgba(124,58,237,.15)">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </div>
            <div class="stat-label">Total Events</div>
            <div class="stat-value">{{ activities.length }}</div>
          </div>
          @if (!isOrganizer) {
            <div class="stat-card">
              <div class="stat-card-icon" style="background:rgba(16,185,129,.12)">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--success)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                </svg>
              </div>
              <div class="stat-label">Events Joined</div>
              <div class="stat-value" style="color:var(--success)">{{ countByEventStatus('PUBLISHED') }}</div>
            </div>
            <div class="stat-card">
              <div class="stat-card-icon" style="background:rgba(245,158,11,.12)">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--warning)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>
              <div class="stat-label">Completed</div>
              <div class="stat-value" style="color:var(--warning)">{{ countByEventStatus('COMPLETED') }}</div>
            </div>
            <div class="stat-card">
              <div class="stat-card-icon" style="background:rgba(239,68,68,.1)">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--error)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
              </div>
              <div class="stat-label">Cancelled</div>
              <div class="stat-value" style="color:var(--error)">{{ countByEventStatus('CANCELLED') }}</div>
            </div>
          } @else {
            <div class="stat-card">
              <div class="stat-card-icon" style="background:rgba(245,158,11,.12)">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--warning)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>
              <div class="stat-label">Active</div>
              <div class="stat-value" style="color:var(--success)">{{ countByEventStatus('PUBLISHED') }}</div>
            </div>
            <div class="stat-card">
              <div class="stat-card-icon" style="background:rgba(239,68,68,.1)">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--error)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
              </div>
              <div class="stat-label">Cancelled</div>
              <div class="stat-value" style="color:var(--error)">{{ countByEventStatus('CANCELLED') }}</div>
            </div>
          }
        </div>
      }

      @if (loading) {
        <div class="spinner-wrap"><div class="spinner"></div></div>
      } @else if (activities.length === 0) {
        <div class="empty-state">
          <div class="empty-icon">◆</div>
          <h3>No activity yet</h3>
          <p>Register for events to see your activity here</p>
          <a routerLink="/events" class="btn btn-primary" style="margin-top:16px">Browse Events</a>
        </div>
      } @else {
        <div class="section">
          <div class="section-title">Recent Activity</div>
          <div class="card" style="overflow:hidden">
            @for (activity of pagedActivities; track activity.id) {
              <div class="activity-row activity-row-clickable" (click)="viewEvent(activity.eventId)">
                <div class="activity-dot {{ activityDotClass(activity) }}"></div>
                <div class="activity-content">
                  <span style="font-weight:500">{{ activityLabel(activity) }}</span>
                  <span style="color:var(--text-muted)"> {{ activity.eventTitle }}</span>
                </div>
                <div style="display:flex;align-items:center;gap:8px;flex-shrink:0">
                  <span class="badge badge-{{ activity.eventType | lowercase }}">{{ activity.eventType }}</span>
                  <span class="activity-time">{{ timeAgo(activity.registeredAt) }}</span>
                </div>
              </div>
            }
          </div>
        </div>

        @if (totalPages > 1) {
          <div class="pagination">
            <button class="page-btn" [disabled]="currentPage === 0" (click)="prevPage()">‹</button>
            @for (p of pageArray; track p) {
              <button class="page-btn" [class.active]="p === currentPage" (click)="goPage(p)">{{ p + 1 }}</button>
            }
            <button class="page-btn" [disabled]="currentPage >= totalPages - 1" (click)="nextPage()">›</button>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .activity-row-clickable { cursor: pointer; transition: background 0.12s; }
    .activity-row-clickable:hover { background: var(--surface-2); }
  `]
})
export class ActivityFeedComponent implements OnInit {
  activities: ActivityVM[] = [];
  loading = false;
  isOrganizer = false;

  currentPage = 0;
  pageSize = 15;
  totalPages = 0;

  constructor(
    private activityService: ActivityService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.isOrganizer = this.authService.isOrganizer();
    this.load();
  }

  load() {
    this.loading = true;
    this.activityService.getActivities(this.currentPage, this.pageSize).subscribe({
      next: (page) => {
        this.activities = page.content;
        this.totalPages = page.totalPages;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  viewEvent(eventId: string) {
    this.router.navigate(['/events', eventId]);
  }

  checkIn(activity: ActivityVM) {
    this.activityService.checkIn(activity.id).subscribe({
      next: (updated) => {
        const idx = this.activities.findIndex(a => a.id === activity.id);
        if (idx >= 0) this.activities[idx] = updated;
      }
    });
  }

  countByEventStatus(status: string): number {
    return this.activities.filter(a => a.eventStatus === status).length;
  }

  activityLabel(activity: ActivityVM): string {
    if (this.isOrganizer) return 'Created';
    switch (activity.attendanceStatus) {
      case 'ATTENDED': return 'Attended';
      case 'REGISTERED': return activity.eventStatus === 'PUBLISHED' ? 'Joined' : 'Registered for';
      default: return 'Registered for';
    }
  }

  activityDotClass(activity: ActivityVM): string {
    if (activity.eventStatus === 'CANCELLED') return 'activity-dot-left';
    if (activity.eventStatus === 'COMPLETED') return 'activity-dot-created';
    return 'activity-dot-joined';
  }

  timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 60) return `${Math.max(1, mins)}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 14) return '1 week ago';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  eventStatusClass(status: string): string {
    switch (status) {
      case 'PUBLISHED': return 'success';
      case 'CANCELLED': return 'error';
      case 'COMPLETED': return 'primary';
      default: return 'muted';
    }
  }

  eventStatusLabel(status: string): string {
    switch (status) {
      case 'PUBLISHED': return 'Active';
      case 'CANCELLED': return 'Cancelled';
      case 'COMPLETED': return 'Completed';
      case 'DRAFT': return 'Draft';
      default: return status;
    }
  }

  get pagedActivities(): ActivityVM[] {
    const start = this.currentPage * this.pageSize;
    return this.activities.slice(start, start + this.pageSize);
  }

  get pageArray(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i);
  }

  goPage(p: number) { this.currentPage = p; this.load(); }
  prevPage() { if (this.currentPage > 0) { this.currentPage--; this.load(); } }
  nextPage() { if (this.currentPage < this.totalPages - 1) { this.currentPage++; this.load(); } }
}
