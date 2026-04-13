import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NotificationsService } from '../../core/services/notifications.service';
import { NotificationVM } from '../../core/models';

type FilterTab = 'all' | 'unread';

interface NotifGroup {
  label: string;
  items: NotificationVM[];
}

@Component({
  selector: 'app-notifications',
  standalone: false,
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Notifications</h1>
          <p class="page-subtitle">Stay updated with your events and connections</p>
        </div>
        @if (unseenCount > 0) {
          <button class="btn btn-ghost btn-sm" (click)="markAllSeen()" style="font-size:0.8rem;color:var(--primary);border-color:transparent;padding:4px 8px">
            Mark all read
          </button>
        }
      </div>

      <!-- Tabs -->
      <div class="tabs" style="margin-bottom:20px">
        <button class="tab-btn" [class.active]="tab === 'all'" (click)="setTab('all')">
          All
          @if (total > 0) {
            <span class="tab-count">{{ total }}</span>
          }
        </button>
        <button class="tab-btn" [class.active]="tab === 'unread'" (click)="setTab('unread')">
          Unread
          @if (unseenCount > 0) {
            <span class="tab-count tab-count-accent">{{ unseenCount }}</span>
          }
        </button>
      </div>

      @if (loading) {
        <div class="spinner-wrap"><div class="spinner"></div></div>
      } @else if (groups.length === 0) {
        <div class="empty-state">
          <div class="empty-icon">🔔</div>
          <h3>{{ tab === 'unread' ? 'No unread notifications' : 'No notifications yet' }}</h3>
        </div>
      } @else {
        @for (group of groups; track group.label) {
          <div class="notif-group">
            <div class="notif-group-label">{{ group.label }}</div>
            <div class="notif-group-items">
              @for (n of group.items; track n.id) {
                <div class="notif-row" [class.notif-row-unseen]="!n.seen" (click)="onItemClick(n)">
                  <div class="notif-row-icon">{{ typeIcon(n.type) }}</div>
                  <div class="notif-row-body">
                    <div class="notif-row-header">
                      <span class="notif-row-title">{{ n.title }}</span>
                      <span class="notif-row-time">{{ timeAgo(n.createdAt) }}</span>
                    </div>
                    <div class="notif-row-msg">{{ n.message }}</div>
                  </div>
                  @if (!n.seen) {
                    <div class="notif-row-dot"></div>
                  }
                </div>
              }
            </div>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .tab-count {
      display: inline-flex; align-items: center; justify-content: center;
      background: var(--surface-3); color: var(--text-muted);
      font-size: .68rem; font-weight: 600;
      border-radius: 999px; padding: 0 6px; min-width: 18px; height: 16px;
      margin-left: 5px;
    }
    .tab-count-accent { background: rgba(108,99,255,.2); color: var(--primary); }

    .notif-group { margin-bottom: 24px; }
    .notif-group-label {
      font-size: .7rem; font-weight: 600; text-transform: uppercase;
      letter-spacing: .07em; color: var(--text-dim);
      padding: 0 2px; margin-bottom: 8px;
    }
    .notif-group-items {
      border: 1px solid var(--border);
      border-radius: var(--radius);
      overflow: hidden;
    }

    .notif-row {
      display: flex; align-items: flex-start; gap: 12px;
      padding: 14px 16px;
      border-bottom: 1px solid var(--border);
      cursor: pointer; transition: background .12s;
    }
    .notif-row:last-child { border-bottom: none; }
    .notif-row:hover { background: var(--surface-2); }
    .notif-row.notif-row-unseen { background: rgba(108,99,255,.05); }
    .notif-row.notif-row-unseen:hover { background: rgba(108,99,255,.09); }

    .notif-row-icon { font-size: 1.15rem; flex-shrink: 0; margin-top: 1px; }

    .notif-row-body { flex: 1; min-width: 0; }
    .notif-row-header {
      display: flex; align-items: baseline; justify-content: space-between;
      gap: 8px; margin-bottom: 3px;
    }
    .notif-row-title {
      font-size: .85rem; font-weight: 600; color: var(--text);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .notif-row-time {
      font-size: .72rem; color: var(--text-dim); flex-shrink: 0;
    }
    .notif-row-msg {
      font-size: .8rem; color: var(--text-muted); line-height: 1.4;
    }

    .notif-row-dot {
      width: 8px; height: 8px; border-radius: 50%;
      background: var(--primary); flex-shrink: 0; margin-top: 6px;
    }
  `]
})
export class NotificationsComponent implements OnInit {
  tab: FilterTab = 'all';
  loading = false;
  all: NotificationVM[] = [];
  unseenCount = 0;

  constructor(
    private notificationsService: NotificationsService,
    private router: Router
  ) {}

  ngOnInit() {
    this.load();
  }

  setTab(t: FilterTab) {
    this.tab = t;
  }

  private load() {
    this.loading = true;
    this.notificationsService.getAll().subscribe({
      next: (list) => {
        this.all = list;
        this.unseenCount = list.filter(n => !n.seen).length;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  get visible(): NotificationVM[] {
    return this.tab === 'unread' ? this.all.filter(n => !n.seen) : this.all;
  }

  get total(): number { return this.all.length; }

  get groups(): NotifGroup[] {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterdayStart = todayStart - 86_400_000;
    const weekStart = todayStart - 6 * 86_400_000;

    const buckets: Record<string, NotificationVM[]> = {
      Today: [], Yesterday: [], 'This week': [], Older: []
    };

    for (const n of this.visible) {
      const t = new Date(n.createdAt).getTime();
      if (t >= todayStart) buckets['Today'].push(n);
      else if (t >= yesterdayStart) buckets['Yesterday'].push(n);
      else if (t >= weekStart) buckets['This week'].push(n);
      else buckets['Older'].push(n);
    }

    return Object.entries(buckets)
      .filter(([, items]) => items.length > 0)
      .map(([label, items]) => ({ label, items }));
  }

  onItemClick(n: NotificationVM) {
    if (!n.seen) {
      this.notificationsService.markSeen(n.id).subscribe({
        next: () => {
          n.seen = true;
          this.unseenCount = Math.max(0, this.unseenCount - 1);
        },
        error: () => {}
      });
    }
    if (n.referenceId) {
      if (n.type === 'CHAT_MESSAGE' || n.type === 'CHAT_REQUEST_ACCEPTED') {
        this.router.navigate(['/chat'], { queryParams: { roomId: n.referenceId } });
      } else if (n.type === 'CHAT_REQUEST') {
        this.router.navigate(['/people'], { queryParams: { tab: 'requests' } });
      } else {
        this.router.navigate(['/events', n.referenceId]);
      }
    }
  }

  markAllSeen() {
    this.notificationsService.markAllSeen().subscribe({
      next: () => {
        this.all.forEach(n => n.seen = true);
        this.unseenCount = 0;
      },
      error: () => {}
    });
  }

  typeIcon(type: string): string {
    switch (type) {
      case 'CHAT_MESSAGE': return '💬';
      case 'EVENT_REGISTRATION': return '✅';
      case 'EVENT_CANCELLED': return '❌';
      case 'EVENT_CREATED': return '🎉';
      case 'CHAT_REQUEST': return '👋';
      case 'CHAT_REQUEST_ACCEPTED': return '🤝';
      default: return '🔔';
    }
  }

  timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}
