import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UsersService } from '../../core/services/users.service';
import { ChatService } from '../../core/services/chat.service';
import { DirectChatRequestVM, PersonSuggestionVM } from '../../core/models';

type Tab = 'suggestions' | 'requests';

@Component({
  selector: 'app-people',
  standalone: false,
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">People You May Know</h1>
          <p class="page-subtitle">Connect with attendees who share your interests</p>
        </div>
      </div>

      <!-- Tabs -->
      <div class="people-tabs">
        <button class="people-tab" [class.active]="tab === 'suggestions'" (click)="setTab('suggestions')">
          Suggestions
        </button>
        <button class="people-tab" [class.active]="tab === 'requests'" (click)="setTab('requests')">
          Chat Requests
          @if (incomingCount > 0) {
            <span class="tab-badge">{{ incomingCount }}</span>
          }
        </button>
      </div>

      <!-- ── Suggestions tab ── -->
      @if (tab === 'suggestions') {
        @if (loading) {
          <div class="spinner-wrap"><div class="spinner"></div></div>
        } @else if (visiblePeople.length === 0) {
          <div class="empty-state">
            <div class="empty-icon">👥</div>
            <h3>No suggestions yet</h3>
            <p>Register for events and fill in your profile interests and location to find like-minded people.</p>
          </div>
        } @else {
          <div class="people-grid">
            @for (person of visiblePeople; track person.userId) {
              <div class="person-card" (click)="viewProfile(person.userId)">
                <div class="person-header">
                  <div class="person-avatar">
                    @if (person.hasPicture) {
                      <img [src]="pictureUrl(person.userId)"
                           (error)="onImgError($event)"
                           style="width:100%;height:100%;object-fit:cover;border-radius:50%;display:block" />
                    } @else {
                      <span>{{ initials(person) }}</span>
                    }
                  </div>
                  <div class="person-info">
                    <div class="person-name">{{ person.firstName }} {{ person.lastName }}</div>
                    @if (person.location) {
                      <div class="person-location">📍 {{ person.location }}</div>
                    }
                  </div>
                </div>

                @if (person.bio) {
                  <p class="person-bio">{{ person.bio }}</p>
                }

                @if (person.interests.length > 0) {
                  <div class="person-interests">
                    @for (interest of person.interests; track interest) {
                      <span class="interest-chip">{{ interest }}</span>
                    }
                  </div>
                }

                <div class="person-footer">
                  <div class="person-stats">
                    @if (person.sharedEventsCount > 0) {
                      <span class="stat-badge stat-events">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;margin-right:3px">
                          <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                        </svg>
                        {{ person.sharedEventsCount }} mutual event{{ person.sharedEventsCount !== 1 ? 's' : '' }}
                      </span>
                    }
                  </div>
                  <button class="person-connect-btn {{ connectStatus[person.userId] === 'sent' ? 'sent' : '' }}"
                    (click)="connectPerson($event, person)"
                    [disabled]="connectStatus[person.userId] === 'sending' || connectStatus[person.userId] === 'sent'">
                    @if (connectStatus[person.userId] === 'sent') {
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      Sent
                    } @else if (connectStatus[person.userId] === 'sending') {
                      …
                    } @else {
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/>
                        <line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/>
                      </svg>
                      Connect
                    }
                  </button>
                </div>
              </div>
            }
          </div>

          @if (hasMore) {
            <div style="text-align:center;margin-top:24px">
              <button class="btn btn-ghost" (click)="loadMore()" [disabled]="loadingMore">
                {{ loadingMore ? 'Loading…' : 'Load more' }}
              </button>
            </div>
          }
        }
      }

      <!-- ── Chat Requests tab ── -->
      @if (tab === 'requests') {
        @if (reqLoading) {
          <div class="spinner-wrap"><div class="spinner"></div></div>
        } @else {
          <!-- Incoming -->
          <div class="req-section">
            <p class="req-section-title">
              Incoming
              @if (incoming.length > 0) { <span class="tab-badge" style="position:static;transform:none;background:var(--primary)">{{ incoming.length }}</span> }
            </p>
            @if (incoming.length === 0) {
              <p class="text-sm text-muted">No pending requests.</p>
            } @else {
              <div class="req-list">
                @for (req of incoming; track req.id) {
                  <div class="req-card">
                    <div class="req-user" (click)="viewProfile(req.senderId)" style="cursor:pointer">
                      <div class="req-avatar">
                        @if (req.senderHasPicture) {
                          <img [src]="pictureUrl(req.senderId)"
                               (error)="onImgError($event)"
                               style="width:100%;height:100%;object-fit:cover;border-radius:50%;display:block" />
                        } @else {
                          {{ reqSenderInitials(req) }}
                        }
                      </div>
                      <div>
                        <div class="req-name">{{ req.senderFirstName }} {{ req.senderLastName }}</div>
                        <div class="text-xs text-muted">wants to chat with you</div>
                      </div>
                    </div>
                    <div class="req-actions">
                      <button class="btn btn-success btn-sm" (click)="accept(req)" [disabled]="actionLoading === req.id">
                        {{ actionLoading === req.id ? '…' : 'Accept' }}
                      </button>
                      <button class="btn btn-ghost btn-sm" (click)="decline(req)" [disabled]="actionLoading === req.id">
                        Decline
                      </button>
                    </div>
                  </div>
                }
              </div>
            }
          </div>

          <!-- Outgoing -->
          <div class="req-section" style="margin-top:24px">
            <p class="req-section-title">Sent</p>
            @if (outgoing.length === 0) {
              <p class="text-sm text-muted">No requests sent.</p>
            } @else {
              <div class="req-list">
                @for (req of outgoing; track req.id) {
                  <div class="req-card">
                    <div class="req-user" (click)="viewProfile(req.receiverId)" style="cursor:pointer">
                      <div class="req-avatar">
                        @if (req.receiverHasPicture) {
                          <img [src]="pictureUrl(req.receiverId)"
                               (error)="onImgError($event)"
                               style="width:100%;height:100%;object-fit:cover;border-radius:50%;display:block" />
                        } @else {
                          {{ reqReceiverInitials(req) }}
                        }
                      </div>
                      <div>
                        <div class="req-name">{{ req.receiverFirstName }} {{ req.receiverLastName }}</div>
                      </div>
                    </div>
                    <div style="display:flex;align-items:center;gap:8px">
                      <span class="req-status-badge req-status-{{ req.status | lowercase }}">
                        {{ req.status | lowercase }}
                      </span>
                      @if (req.status === 'PENDING') {
                        <button class="btn btn-ghost btn-sm" style="color:var(--danger,#e74c3c);font-size:.72rem"
                          (click)="cancelOutgoing(req)" [disabled]="actionLoading === req.id">
                          {{ actionLoading === req.id ? '…' : 'Cancel' }}
                        </button>
                      }
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .page-title { font-size: 1.4rem; font-weight: 700; color: var(--text); margin: 0; }

    /* Tabs */
    .people-tabs { display: flex; gap: 4px; margin-bottom: 20px; border-bottom: 1px solid var(--border); }
    .people-tab {
      padding: 8px 16px; font-size: 0.88rem; font-weight: 500; background: none; border: none;
      color: var(--text-muted); cursor: pointer; border-bottom: 2px solid transparent;
      margin-bottom: -1px; display: flex; align-items: center; gap: 6px;
      transition: color 0.15s, border-color 0.15s;
    }
    .people-tab.active { color: var(--primary); border-bottom-color: var(--primary); }
    .tab-badge {
      display: inline-flex; align-items: center; justify-content: center;
      min-width: 18px; height: 18px; padding: 0 5px;
      border-radius: 9px; background: var(--primary); color: #fff;
      font-size: 0.65rem; font-weight: 700;
    }

    /* Suggestions grid */
    .people-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 16px;
    }
    .person-card {
      background: var(--surface); border: 1px solid var(--border); border-radius: 12px;
      padding: 16px; display: flex; flex-direction: column; gap: 10px;
      transition: border-color 0.15s; cursor: pointer;
    }
    .person-card:hover { border-color: rgba(124,58,237,.4); }
    .person-footer {
      display: flex; align-items: center; justify-content: space-between;
      gap: 10px; margin-top: 4px;
    }
    .person-header { display: flex; align-items: center; gap: 12px; }
    .person-avatar {
      width: 48px; height: 48px; flex-shrink: 0; border-radius: 50%;
      background: linear-gradient(135deg, var(--primary), var(--accent));
      display: flex; align-items: center; justify-content: center;
      font-size: 0.85rem; font-weight: 700; color: white; overflow: hidden;
    }
    .person-info { min-width: 0; }
    .person-name { font-size: 0.9rem; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .person-location { font-size: 0.75rem; color: var(--text-muted); margin-top: 2px; }
    .person-bio {
      font-size: 0.78rem; color: var(--text-muted); line-height: 1.5; margin: 0;
      display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
    }
    .person-interests { display: flex; flex-wrap: wrap; gap: 5px; }
    .interest-chip {
      font-size: 0.7rem; padding: 3px 8px; border-radius: 20px;
      background: var(--surface-2); color: var(--text-muted); border: 1px solid var(--border);
    }
    .person-stats { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 2px; }
    .stat-badge { font-size: 0.7rem; padding: 3px 8px; border-radius: 20px; font-weight: 500; }
    .stat-events { background: rgba(99,102,241,.12); color: var(--primary); }
    .stat-interests { background: rgba(139,92,246,.12); color: var(--accent); }

    /* Requests */
    .req-section-title {
      font-size: 0.8rem; font-weight: 700; text-transform: uppercase; letter-spacing: .05em;
      color: var(--text-muted); margin: 0 0 12px; display: flex; align-items: center; gap: 8px;
    }
    .req-list { display: flex; flex-direction: column; gap: 10px; max-width: 560px; }
    .req-card {
      display: flex; align-items: center; justify-content: space-between; gap: 12px;
      padding: 12px 14px; border-radius: 10px;
      background: var(--surface); border: 1px solid var(--border);
    }
    .req-user { display: flex; align-items: center; gap: 10px; min-width: 0; }
    .req-avatar {
      width: 40px; height: 40px; flex-shrink: 0; border-radius: 50%;
      background: linear-gradient(135deg, var(--primary), var(--accent));
      display: flex; align-items: center; justify-content: center;
      font-size: 0.72rem; font-weight: 700; color: white; overflow: hidden;
    }
    .req-name { font-size: 0.88rem; font-weight: 600; }
    .req-actions { display: flex; gap: 6px; flex-shrink: 0; }
    .req-status-badge {
      font-size: 0.72rem; padding: 3px 10px; border-radius: 20px; font-weight: 600;
      text-transform: capitalize; flex-shrink: 0;
    }
    .req-status-pending { background: rgba(234,179,8,.15); color: #ca8a04; }
    .req-status-accepted { background: rgba(34,197,94,.15); color: #16a34a; }
    .req-status-declined { background: rgba(239,68,68,.12); color: #dc2626; }
  `]
})
export class PeopleComponent implements OnInit {
  tab: Tab = 'suggestions';

  // Suggestions
  people: PersonSuggestionVM[] = [];
  loading = true;
  loadingMore = false;
  hasMore = false;
  page = 0;
  readonly pageSize = 20;
  connectStatus: Record<string, 'idle' | 'sending' | 'sent'> = {};

  // Chat requests
  incoming: DirectChatRequestVM[] = [];
  outgoing: DirectChatRequestVM[] = [];
  reqLoading = false;
  actionLoading: string | null = null;

  // Tracks accepted friendships (accepted incoming requests) so they stay
  // excluded from suggestions even after being removed from the incoming list.
  private friendIds = new Set<string>();

  constructor(
    private usersService: UsersService,
    private chatService: ChatService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    const tabParam = this.route.snapshot.queryParamMap.get('tab') as Tab | null;
    if (tabParam === 'requests') this.tab = 'requests';
    this.loadSuggestions();
    this.loadRequests();
  }

  setTab(t: Tab) {
    this.tab = t;
    if (t === 'requests') this.loadRequests();
  }

  get incomingCount(): number { return this.incoming.length; }

  get visiblePeople(): PersonSuggestionVM[] {
    const excluded = new Set([
      ...this.outgoing.map(r => r.receiverId),   // anyone you've sent a request to
      ...this.incoming.map(r => r.senderId),      // anyone with a pending request to you
      ...this.friendIds,                          // anyone whose incoming request you accepted
    ]);
    return this.people.filter(p => !excluded.has(p.userId));
  }

  // ── Suggestions ───────────────────────────────────────────────────────────

  private loadSuggestions() {
    this.loading = true;
    this.usersService.getSuggestions(0, this.pageSize).subscribe({
      next: (results) => {
        this.people = results;
        this.hasMore = results.length === this.pageSize;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  loadMore() {
    this.loadingMore = true;
    this.page++;
    this.usersService.getSuggestions(this.page, this.pageSize).subscribe({
      next: (results) => {
        this.people = [...this.people, ...results];
        this.hasMore = results.length === this.pageSize;
        this.loadingMore = false;
      },
      error: () => { this.loadingMore = false; }
    });
  }

  // ── Requests ──────────────────────────────────────────────────────────────

  private loadRequests() {
    this.reqLoading = true;
    this.chatService.getIncomingChatRequests().subscribe({
      next: (reqs) => {
        // Keep only pending ones in the list; accepted ones go into friendIds
        this.incoming = reqs.filter(r => r.status === 'PENDING');
        reqs.filter(r => r.status === 'ACCEPTED').forEach(r => this.friendIds.add(r.senderId));
        this.reqLoading = false;
      },
      error: () => { this.reqLoading = false; }
    });
    this.chatService.getOutgoingChatRequests().subscribe({
      next: (reqs) => {
        this.outgoing = reqs;
        // Seed friendIds from accepted outgoing requests so they're excluded too
        reqs.filter(r => r.status === 'ACCEPTED').forEach(r => this.friendIds.add(r.receiverId));
      }
    });
  }

  accept(req: DirectChatRequestVM) {
    this.actionLoading = req.id;
    this.chatService.acceptDirectRequest(req.id).subscribe({
      next: (updated) => {
        this.incoming = this.incoming.filter(r => r.id !== req.id);
        // Track as friend so they don't reappear in suggestions
        this.friendIds.add(req.senderId);
        this.actionLoading = null;
        if (updated.chatRoomId) {
          this.router.navigate(['/chat'], { queryParams: { roomId: updated.chatRoomId } });
        }
      },
      error: () => { this.actionLoading = null; }
    });
  }

  decline(req: DirectChatRequestVM) {
    this.actionLoading = req.id;
    this.chatService.declineDirectRequest(req.id).subscribe({
      next: () => {
        this.incoming = this.incoming.filter(r => r.id !== req.id);
        this.actionLoading = null;
      },
      error: () => { this.actionLoading = null; }
    });
  }

  cancelOutgoing(req: DirectChatRequestVM) {
    this.actionLoading = req.id;
    this.chatService.cancelDirectRequest(req.id).subscribe({
      next: () => {
        this.outgoing = this.outgoing.filter(r => r.id !== req.id);
        this.actionLoading = null;
      },
      error: () => { this.actionLoading = null; }
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  viewProfile(userId: string) {
    this.router.navigate(['/people', userId]);
  }

  connectPerson(event: Event, person: PersonSuggestionVM) {
    event.stopPropagation();
    if (this.connectStatus[person.userId]) return;
    this.connectStatus[person.userId] = 'sending';
    this.chatService.sendDirectChatRequest(person.userId).subscribe({
      next: (req) => {
        this.connectStatus[person.userId] = 'sent';
        // Add to outgoing so visiblePeople immediately excludes this person
        this.outgoing = [...this.outgoing, req];
      },
      error: () => { delete this.connectStatus[person.userId]; }
    });
  }

  initials(person: PersonSuggestionVM): string {
    return `${person.firstName[0] ?? ''}${person.lastName[0] ?? ''}`.toUpperCase();
  }

  reqSenderInitials(req: DirectChatRequestVM): string {
    return `${req.senderFirstName[0] ?? ''}${req.senderLastName[0] ?? ''}`.toUpperCase();
  }

  reqReceiverInitials(req: DirectChatRequestVM): string {
    return `${req.receiverFirstName[0] ?? ''}${req.receiverLastName[0] ?? ''}`.toUpperCase();
  }

  pictureUrl(userId: string): string {
    return this.usersService.pictureUrl(userId);
  }

  onImgError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
  }
}
