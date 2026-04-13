import {
  Component,
  HostListener,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { Router } from '@angular/router';
import { Subscription, interval } from 'rxjs';
import { NotificationsService } from '../../core/services/notifications.service';
import { NotificationVM } from '../../core/models';

@Component({
  selector: 'app-notification-bell',
  standalone: false,
  template: `
    <div class="nb-root">
      <!-- Bell button -->
      <button class="nb-btn" (click)="toggle($event)" [class.nb-btn-active]="open">
        <svg class="nb-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        @if (unseenCount > 0) {
          <span class="nb-badge">{{ unseenCount > 99 ? '99+' : unseenCount }}</span>
        }
      </button>

      <!-- Dropdown panel -->
      @if (open) {
        <div class="nb-panel" (click)="$event.stopPropagation()">
          <div class="nb-panel-header">
            <span class="nb-panel-title">Notifications</span>
            @if (unseenCount > 0) {
              <button class="nb-mark-all" (click)="markAllSeen()">Mark all read</button>
            }
          </div>

          @if (loading) {
            <div class="nb-state">
              <div class="nb-spinner"></div>
            </div>
          } @else if (notifications.length === 0) {
            <div class="nb-state">
              <div class="nb-empty-icon">🔔</div>
              <p class="nb-empty-text">No notifications yet</p>
            </div>
          } @else {
            <ul class="nb-list">
              @for (n of top5; track n.id) {
                <li class="nb-item" [class.nb-unseen]="!n.seen" (click)="onItemClick(n)">
                  <span class="nb-type-icon">{{ typeIcon(n.type) }}</span>
                  <div class="nb-item-body">
                    <div class="nb-item-title">{{ n.title }}</div>
                    <div class="nb-item-msg">{{ n.message }}</div>
                    <div class="nb-item-time">{{ timeAgo(n.createdAt) }}</div>
                  </div>
                  @if (!n.seen) {
                    <div class="nb-dot"></div>
                  }
                </li>
              }
            </ul>
            <button class="nb-footer" (click)="viewAll()">
              @if (remainingUnseen > 0) {
                <span class="nb-footer-badge">{{ remainingUnseen }} unread remaining</span>
              }
              <span class="nb-footer-link">View all notifications →</span>
            </button>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .nb-root { position: relative; }

    /* Bell button */
    .nb-btn {
      position: relative;
      width: 38px; height: 38px;
      border-radius: 10px;
      background: var(--surface, #0F0F1C);
      border: 1px solid var(--border, #1C1C30);
      color: var(--text-muted, #6868A0);
      cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: all .15s;
    }
    .nb-btn:hover, .nb-btn-active {
      background: var(--surface-2, #161628);
      border-color: var(--border-light, #242440);
      color: var(--text, #E4E4F0);
    }

    .nb-icon { width: 17px; height: 17px; }

    .nb-badge {
      position: absolute;
      top: -5px; right: -5px;
      background: #ef4444;
      color: #fff;
      font-size: .6rem;
      font-weight: 700;
      border-radius: 999px;
      padding: 1px 4px;
      min-width: 16px;
      text-align: center;
      line-height: 1.5;
      border: 2px solid var(--bg, #08080F);
    }

    /* Dropdown panel */
    .nb-panel {
      position: absolute;
      top: calc(100% + 10px);
      right: 0;
      width: 340px;
      max-height: 460px;
      background: var(--surface, #0F0F1C);
      border: 1px solid var(--border, #1C1C30);
      border-radius: 12px;
      box-shadow: 0 12px 40px rgba(0,0,0,.5);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      z-index: 300;
    }

    .nb-panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 13px 16px 11px;
      border-bottom: 1px solid var(--border, #1C1C30);
      flex-shrink: 0;
    }
    .nb-panel-title {
      font-size: .88rem;
      font-weight: 600;
      color: var(--text, #E4E4F0);
    }
    .nb-mark-all {
      font-size: .73rem;
      color: var(--primary, #6C63FF);
      background: none; border: none;
      cursor: pointer; padding: 0;
    }
    .nb-mark-all:hover { text-decoration: underline; }

    /* States */
    .nb-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 36px 20px;
      gap: 10px;
    }
    .nb-spinner {
      width: 22px; height: 22px;
      border: 2px solid var(--border-light, #242440);
      border-top-color: var(--primary, #6C63FF);
      border-radius: 50%;
      animation: nb-spin .65s linear infinite;
    }
    @keyframes nb-spin { to { transform: rotate(360deg); } }
    .nb-empty-icon { font-size: 1.8rem; opacity: .5; }
    .nb-empty-text { font-size: .82rem; color: var(--text-muted, #6868A0); }

    /* List */
    .nb-list {
      list-style: none;
      margin: 0; padding: 4px 0;
      overflow-y: auto;
      flex: 1;
    }

    .nb-item {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 10px 16px;
      cursor: pointer;
      border-bottom: 1px solid var(--border, #1C1C30);
      transition: background .1s;
    }
    .nb-item:last-child { border-bottom: none; }
    .nb-item:hover { background: var(--surface-2, #161628); }
    .nb-item.nb-unseen { background: rgba(108,99,255,.06); }
    .nb-item.nb-unseen:hover { background: rgba(108,99,255,.1); }

    .nb-type-icon { font-size: 1rem; flex-shrink: 0; margin-top: 1px; }

    .nb-item-body { flex: 1; min-width: 0; }
    .nb-item-title {
      font-size: .8rem;
      font-weight: 600;
      color: var(--text, #E4E4F0);
      margin-bottom: 2px;
    }
    .nb-item-msg {
      font-size: .76rem;
      color: var(--text-muted, #6868A0);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .nb-item-time {
      font-size: .68rem;
      color: var(--text-dim, #38384A);
      margin-top: 3px;
    }

    .nb-dot {
      width: 7px; height: 7px;
      border-radius: 50%;
      background: var(--primary, #6C63FF);
      flex-shrink: 0;
      margin-top: 6px;
    }

    .nb-footer {
      display: flex; align-items: center; justify-content: space-between;
      width: 100%; padding: 10px 16px;
      border-top: 1px solid var(--border, #1C1C30);
      background: none; border-left: none; border-right: none; border-bottom: none;
      cursor: pointer; transition: background .1s;
      flex-shrink: 0;
    }
    .nb-footer:hover { background: var(--surface-2, #161628); }

    .nb-footer-badge {
      font-size: .7rem; font-weight: 600;
      color: var(--primary, #6C63FF);
      background: rgba(108,99,255,.15);
      border-radius: 999px; padding: 2px 8px;
    }

    .nb-footer-link {
      font-size: .75rem; color: var(--text-muted, #6868A0);
      margin-left: auto;
    }
    .nb-footer:hover .nb-footer-link { color: var(--text, #E4E4F0); }
  `]
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  open = false;
  loading = false;
  notifications: NotificationVM[] = [];
  unseenCount = 0;

  private sub = new Subscription();

  constructor(
    private notificationsService: NotificationsService,
    private router: Router
  ) {}

  ngOnInit() {
    this.refreshCount();
    this.sub.add(interval(30_000).subscribe(() => this.refreshCount()));
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  @HostListener('document:click')
  onDocumentClick() {
    this.open = false;
  }

  toggle(event: MouseEvent) {
    event.stopPropagation();
    this.open = !this.open;
    if (this.open) this.loadAll();
  }

  private refreshCount() {
    this.notificationsService.countUnseen().subscribe({
      next: ({ count }) => { this.unseenCount = count; },
      error: () => {}
    });
  }

  private loadAll() {
    this.loading = true;
    this.notificationsService.getAll().subscribe({
      next: (list) => {
        this.notifications = list;
        this.unseenCount = list.filter(n => !n.seen).length;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
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
    this.open = false;
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
        this.notifications.forEach(n => n.seen = true);
        this.unseenCount = 0;
      },
      error: () => {}
    });
  }

  get top5(): NotificationVM[] {
    return this.notifications.slice(0, 5);
  }

  get remainingUnseen(): number {
    // unseen notifications that are NOT shown in the top 5
    const shownIds = new Set(this.top5.map(n => n.id));
    return this.notifications.filter(n => !n.seen && !shownIds.has(n.id)).length;
  }

  viewAll() {
    this.open = false;
    this.router.navigate(['/notifications']);
  }

  typeIcon(type: string): string {
    switch (type) {
      case 'EVENT_CREATED': return '🎉';
      case 'EVENT_REGISTRATION': return '✅';
      case 'EVENT_CANCELLED': return '❌';
      case 'CHAT_MESSAGE': return '💬';
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
    return `${Math.floor(hrs / 24)}d ago`;
  }
}
