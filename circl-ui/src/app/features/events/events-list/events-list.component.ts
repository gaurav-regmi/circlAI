import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, Subscription } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { EventsService } from '../../../core/services/events.service';
import { ActivityService } from '../../../core/services/activity.service';
import { ActivityVM, EventFilters, EventVM } from '../../../core/models';

type Tab = 'discover' | 'my-events';

interface MyEventItem {
  id: string;
  title: string;
  type: string;
  status: string;
  location?: string | null;
  startDateTime?: string;
  role: 'Organizer' | 'Attendee';
  isPast: boolean;
  gradient: string;
  emoji: string;
}

const GRADIENTS = [
  'linear-gradient(135deg, #1E1B4B, #4C1D95)',
  'linear-gradient(135deg, #0C1445, #1E3A8A)',
  'linear-gradient(135deg, #1A0A2E, #4A1560)',
  'linear-gradient(135deg, #0A1F1A, #065F46)',
  'linear-gradient(135deg, #1A1A0A, #5F4F06)',
  'linear-gradient(135deg, #1A0A0A, #7F1D1D)',
];

const EMOJIS = ['🎯', '🚀', '💡', '🎨', '🌐', '⚡', '🏆', '🎭', '🔬', '🌟'];

function cardGradient(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length];
}

function cardEmoji(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 17 + id.charCodeAt(i)) | 0;
  return EMOJIS[Math.abs(hash) % EMOJIS.length];
}

@Component({
  selector: 'app-events-list',
  standalone: false,
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">
            @switch (activeTab) {
              @case ('discover') { Discover Events }
              @case ('my-events') { My Events }
            }
          </h1>
          <p class="page-subtitle">
            @switch (activeTab) {
              @case ('discover') { Find and join events that match your interests }
              @case ('my-events') { Events you're attending or organising }
            }
          </p>
        </div>
        @if (isOrganizer && activeTab === 'my-events') {
          <a routerLink="/events/create" class="btn btn-primary">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Create Event
          </a>
        }
      </div>

      <!-- Tab bar -->
      <div class="tabs">
        <button class="tab-btn" [class.active]="activeTab === 'discover'"
          (click)="goTab('discover')">
          Discover
        </button>
        <button class="tab-btn" [class.active]="activeTab === 'my-events'"
          (click)="goTab('my-events')">
          My Events
        </button>
      </div>

      <!-- ══════════════════════════════ DISCOVER TAB ══════════════════════════════ -->
      @if (activeTab === 'discover') {

        <!-- Search bar -->
        <div class="search-bar-wrap">
          <span class="search-bar-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </span>
          <input type="text" class="search-bar-input" [(ngModel)]="filters.search"
            placeholder="Search events, topics, locations…" (keydown.enter)="applyFilters()" />
        </div>

        <!-- Extra filters (compact row) -->
        <div class="filter-row">
          <select class="form-control filter-select" [(ngModel)]="filters.type" style="background:var(--surface)">
            <option value="">All Types</option>
            <option value="PUBLIC">Public</option>
            <option value="PRIVATE">Private</option>
          </select>
          <div class="filter-loc">
            <app-location-autocomplete
              [resetKey]="filterKey"
              placeholder="Location…"
              [initialValue]="filters.location ?? ''"
              (inputChange)="filters.location = $event"
              (selected)="filters.location = $event">
            </app-location-autocomplete>
          </div>
          <input type="date" class="form-control filter-date" [(ngModel)]="filterStartFrom" title="From date" />
          <input type="date" class="form-control filter-date" [(ngModel)]="filterStartTo" title="To date" />
          <button class="btn btn-primary btn-sm" (click)="applyFilters()">Search</button>
          <button class="btn btn-ghost btn-sm" (click)="resetFilters()">Reset</button>
        </div>

        @if (loading) {
          <div class="spinner-wrap"><div class="spinner"></div></div>
        } @else if (events.length === 0) {
          <div class="empty-state">
            <div class="empty-icon">📅</div>
            <h3>No events found</h3>
            <p>Try adjusting your filters or check back later</p>
          </div>
        } @else {

          <!-- Featured Event -->
          @if (featuredEvent) {
            <div class="featured-card">
              <div style="flex:1;min-width:0">
                <div class="featured-badge">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z"/>
                  </svg>
                  Featured Event
                </div>
                <div class="featured-title">{{ featuredEvent.title }}</div>
                @if (featuredEvent.description) {
                  <div class="featured-desc">{{ featuredEvent.description | slice:0:160 }}{{ featuredEvent.description.length > 160 ? '…' : '' }}</div>
                }
                <div class="featured-meta">
                  <div class="featured-meta-item">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    <span>{{ featuredEvent.startDateTime | date:'MMM d, y' }}</span>
                  </div>
                  @if (featuredEvent.location) {
                    <div class="featured-meta-item">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                      </svg>
                      <span>{{ featuredEvent.location }}</span>
                    </div>
                  }
                </div>
              </div>
              <div class="featured-actions">
                <button class="btn-join" (click)="viewEvent(featuredEvent.id)">
                  Join Now
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                  </svg>
                </button>
              </div>
            </div>
          }

          <!-- Event Grid -->
          <div class="events-grid">
            @for (event of nonFeaturedEvents; track event.id; let i = $index) {
              <div class="card event-card" (click)="viewEvent(event.id)">
                <div class="event-thumb" [style.background]="eventGradient(event.id)" style="position:relative;overflow:hidden">
                  @if (!coverFailed[event.id]) {
                    <img [src]="coverUrl(event.id)" (error)="coverFailed[event.id]=true"
                         style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover" />
                  } @else {
                    <div class="event-thumb-fallback">
                      <span class="event-thumb-name">{{ event.title }}</span>
                    </div>
                  }
                  <div class="event-thumb-badge">
                    <span class="badge badge-{{ event.type | lowercase }}">{{ event.type | lowercase }}</span>
                  </div>
                </div>
                <div class="event-card-body">
                  <div class="event-card-badges">
                    <span class="badge badge-{{ event.status | lowercase }}">{{ event.status }}</span>
                  </div>
                  <div class="event-card-title">{{ event.title }}</div>
                  <div class="event-card-meta">
                    <div class="event-card-meta-row">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                      <span>{{ event.startDateTime | date:'MMM d, y' }}</span>
                    </div>
                    @if (event.location) {
                      <div class="event-card-meta-row">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                        </svg>
                        <span>{{ event.location }}</span>
                      </div>
                    } @else {
                      <div class="event-card-meta-row" style="font-style:italic">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                        </svg>
                        <span>Register to reveal location</span>
                      </div>
                    }
                  </div>
                  <div class="event-card-footer">
                    <button class="btn btn-ghost btn-sm" (click)="viewEvent(event.id); $event.stopPropagation()">
                      View Details →
                    </button>
                    @if (event.maxCapacity) {
                      <span class="event-capacity">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;margin-right:3px">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                        </svg>
                        {{ event.maxCapacity }}
                      </span>
                    }
                  </div>
                </div>
              </div>
            }
          </div>

          @if (totalPages > 1) {
            <div class="pagination">
              <button class="page-btn" [disabled]="currentPage === 0" (click)="prevPage()">‹</button>
              @for (p of pageArray; track p) {
                <button class="page-btn" [class.active]="p === currentPage" (click)="goPage(p)">
                  {{ p + 1 }}
                </button>
              }
              <button class="page-btn" [disabled]="currentPage >= totalPages - 1" (click)="nextPage()">›</button>
            </div>
          }
        }
      }

      <!-- ══════════════════════════════ MY EVENTS TAB ══════════════════════════════ -->
      @if (activeTab === 'my-events') {
        @if (loading) {
          <div class="spinner-wrap"><div class="spinner"></div></div>
        } @else if (myEventItems.length === 0) {
          <div class="empty-state">
            <div class="empty-icon">📅</div>
            <h3>No events yet</h3>
            <p>Register for events or create one to see them here</p>
            <a routerLink="/events" class="btn btn-primary" style="margin-top:16px">Browse Events</a>
          </div>
        } @else {
          <div class="my-events-list">
            @for (item of myEventItems; track item.id) {
              <div class="my-event-row" (click)="viewEvent(item.id)">
                <div class="my-event-thumb" [style.background]="item.gradient" style="position:relative;overflow:hidden">
                  @if (!myEventCoverFailed[item.id]) {
                    <img [src]="coverUrl(item.id)" (error)="myEventCoverFailed[item.id]=true"
                         style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover" />
                  } @else {
                    <div style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;padding:6px;text-align:center">
                      <span class="my-event-thumb-name">{{ item.title }}</span>
                    </div>
                  }
                </div>
                <div class="my-event-body">
                  <div class="my-event-title">{{ item.title }}</div>
                  <div class="my-event-meta">
                    @if (item.startDateTime) {
                      <div class="my-event-meta-item">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                        </svg>
                        <span>{{ item.startDateTime | date:'MMM d, y' }}</span>
                      </div>
                    }
                    @if (item.location) {
                      <div class="my-event-meta-item">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                        </svg>
                        <span>{{ item.location }}</span>
                      </div>
                    }
                  </div>
                  <div class="my-event-badges">
                    <span class="badge badge-{{ item.role | lowercase }}">{{ item.role }}</span>
                    <span class="badge {{ item.isPast ? 'badge-past' : 'badge-upcoming' }}">
                      {{ item.isPast ? 'past' : 'upcoming' }}
                    </span>
                  </div>
                </div>
                <button class="my-event-menu-btn" (click)="$event.stopPropagation()" title="Options">⋯</button>
              </div>
            }
          </div>
        }
      }

    </div>
  `,
  styles: [`
    .location-private { font-size: .8rem; color: var(--text-muted); font-style: italic; }
    .filter-row .form-control { font-size: 0.85rem; padding: 7px 11px; }
  `]
})
export class EventsListComponent implements OnInit, OnDestroy {
  activeTab: Tab = 'discover';
  loading = false;
  isOrganizer = false;

  events: EventVM[] = [];
  myEventItems: MyEventItem[] = [];
  coverFailed: Record<string, boolean> = {};
  myEventCoverFailed: Record<string, boolean> = {};

  currentPage = 0;
  totalPages = 0;
  pageSize = 12;

  filters: EventFilters = {};
  filterStartFrom = '';
  filterStartTo = '';
  filterKey = 0;

  private sub = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private eventsService: EventsService,
    private activityService: ActivityService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.isOrganizer = this.authService.isOrganizer();
    this.sub.add(
      this.route.data.subscribe(data => {
        this.activeTab = (data['tab'] as Tab) || 'discover';
        this.loadData();
      })
    );
  }

  ngOnDestroy() { this.sub.unsubscribe(); }

  loadData() {
    this.loading = true;
    if (this.activeTab === 'discover') {
      this.loadDiscover();
    } else if (this.activeTab === 'my-events') {
      this.loadMyEvents();
    }
  }

  private loadDiscover() {
    const f: EventFilters = { ...this.filters };
    if (this.filterStartFrom) f.startFrom = new Date(this.filterStartFrom).toISOString();
    if (this.filterStartTo) {
      const d = new Date(this.filterStartTo);
      d.setHours(23, 59, 59, 999);
      f.startTo = d.toISOString();
    }
    this.eventsService.getEvents(this.currentPage, this.pageSize, f).subscribe({
      next: (page) => {
        this.events = page.content;
        this.totalPages = page.totalPages;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  private loadMyEvents() {
    forkJoin({
      organized: this.eventsService.getMyEvents(),
      activities: this.activityService.getActivities(0, 50)
    }).subscribe({
      next: ({ organized, activities }) => {
        const organizedIds = new Set(organized.map(e => e.id));

        const organizedItems: MyEventItem[] = organized.map(e => ({
          id: e.id,
          title: e.title,
          type: e.type,
          status: e.status,
          location: e.location,
          startDateTime: e.startDateTime,
          role: 'Organizer' as const,
          isPast: e.status === 'COMPLETED' || e.status === 'CANCELLED',
          gradient: cardGradient(e.id),
          emoji: cardEmoji(e.id),
        }));

        const attendedItems: MyEventItem[] = activities.content
          .filter((a: ActivityVM) => !organizedIds.has(a.eventId))
          .map((a: ActivityVM) => ({
            id: a.eventId,
            title: a.eventTitle,
            type: a.eventType,
            status: a.eventStatus,
            role: 'Attendee' as const,
            isPast: a.eventStatus === 'COMPLETED' || a.eventStatus === 'CANCELLED',
            gradient: cardGradient(a.eventId),
            emoji: cardEmoji(a.eventId),
          }));

        this.myEventItems = [...organizedItems, ...attendedItems];
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  applyFilters() {
    this.currentPage = 0;
    this.loading = true;
    this.loadDiscover();
  }

  resetFilters() {
    this.filters = {};
    this.filterStartFrom = '';
    this.filterStartTo = '';
    this.filterKey++;
    this.currentPage = 0;
    this.loading = true;
    this.loadDiscover();
  }

  goTab(tab: Tab) {
    const routes: Record<Tab, string> = { 'discover': '/events', 'my-events': '/my-events' };
    this.router.navigate([routes[tab]]);
  }

  viewEvent(id: string) {
    this.router.navigate(['/events', id]);
  }

  get featuredEvent(): EventVM | null {
    return this.events.find(e => e.status === 'PUBLISHED') || this.events[0] || null;
  }

  get nonFeaturedEvents(): EventVM[] {
    if (!this.featuredEvent) return this.events;
    return this.events.filter(e => e.id !== this.featuredEvent!.id);
  }

  eventGradient(id: string): string { return cardGradient(id); }
  eventEmoji(id: string): string { return cardEmoji(id); }
  coverUrl(id: string): string { return this.eventsService.coverUrl(id); }

  get pageArray(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i);
  }

  goPage(p: number) { this.currentPage = p; this.loadDiscover(); }
  prevPage() { if (this.currentPage > 0) { this.currentPage--; this.loadDiscover(); } }
  nextPage() { if (this.currentPage < this.totalPages - 1) { this.currentPage++; this.loadDiscover(); } }
}
