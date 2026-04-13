import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { UsersService } from '../../core/services/users.service';
import { ChatService } from '../../core/services/chat.service';
import { UserPublicProfileVM } from '../../core/models';

@Component({
  selector: 'app-user-profile',
  standalone: false,
  template: `
    <div class="page">
      <a (click)="goBack()" class="back-link" style="cursor:pointer">← Back</a>

      @if (loading) {
        <div class="spinner-wrap"><div class="spinner"></div></div>
      } @else if (!profile) {
        <div class="empty-state">
          <div class="empty-icon">👤</div>
          <h3>User not found</h3>
        </div>
      } @else {
        <div class="profile-view">
          <!-- Header -->
          <div class="profile-header">
            <div class="profile-avatar-lg">
              @if (profile.hasPicture && !imgFailed) {
                <img [src]="pictureUrl"
                     (error)="imgFailed = true"
                     style="width:100%;height:100%;object-fit:cover;border-radius:50%;display:block" />
              } @else {
                <span>{{ initials }}</span>
              }
            </div>
            <div class="profile-header-info">
              <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:4px">
                <h1 class="profile-name" style="margin:0">{{ profile.firstName }} {{ profile.lastName }}</h1>
                @if (!isSelf && alreadyConnected) {
                  <span class="friends-badge">✓ Friends</span>
                }
              </div>
              @if (profile.location) {
                <p class="profile-location">📍 {{ profile.location }}</p>
              }
              @if (profile.interests.length > 0) {
                <div class="profile-interests">
                  @for (interest of profile.interests; track interest) {
                    <span class="interest-chip">{{ interest }}</span>
                  }
                </div>
              }
            </div>
          </div>

          @if (profile.bio) {
            <div class="card card-p" style="margin-top:20px">
              <p class="section-label">About</p>
              <p class="text-sm" style="line-height:1.7;color:var(--text-muted)">{{ profile.bio }}</p>
            </div>
          }

          <!-- Chat Request Action -->
          @if (!isSelf) {
            <div class="card card-p" style="margin-top:16px">
              @if (alreadyConnected) {
                <div class="friends-card">
                  <div class="friends-card-left">
                    <div class="friends-icon">✓</div>
                    <div>
                      <div class="friends-card-title">You're friends</div>
                      <div class="friends-card-sub">You can chat privately with {{ profile.firstName }}</div>
                    </div>
                  </div>
                  <button class="btn btn-primary btn-sm" (click)="goToChat()">Open Chat</button>
                </div>
              } @else if (requestSent) {
                <div style="display:flex;align-items:center;justify-content:space-between;gap:12px">
                  <span class="text-sm" style="color:var(--text-muted)">Chat request pending…</span>
                  <button class="btn btn-ghost btn-sm" style="color:var(--danger,#e74c3c)"
                    (click)="cancelRequest()" [disabled]="cancelling">
                    {{ cancelling ? 'Cancelling…' : 'Cancel Request' }}
                  </button>
                </div>
              } @else if (requestError) {
                <div class="alert alert-error" style="margin-bottom:8px">{{ requestError }}</div>
                <button class="btn btn-primary" (click)="sendRequest()" [disabled]="sending">
                  {{ sending ? 'Sending…' : 'Send Chat Request' }}
                </button>
              } @else {
                <p class="text-sm" style="color:var(--text-muted);margin-bottom:12px">
                  Send a chat request to start a private conversation.
                </p>
                <button class="btn btn-primary" (click)="sendRequest()" [disabled]="sending">
                  {{ sending ? 'Sending…' : 'Send Chat Request' }}
                </button>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .profile-view { max-width: 560px; }
    .profile-header { display: flex; align-items: flex-start; gap: 20px; margin-top: 16px; }
    .profile-avatar-lg {
      width: 80px; height: 80px; flex-shrink: 0; border-radius: 50%;
      background: linear-gradient(135deg, var(--primary), var(--accent));
      display: flex; align-items: center; justify-content: center;
      font-size: 1.4rem; font-weight: 700; color: white; overflow: hidden;
    }
    .profile-header-info { min-width: 0; }
    .profile-name { font-size: 1.3rem; font-weight: 700; margin: 0 0 4px; }
    .profile-location { font-size: 0.82rem; color: var(--text-muted); margin: 0 0 8px; }
    .profile-interests { display: flex; flex-wrap: wrap; gap: 6px; }
    .interest-chip {
      font-size: 0.72rem; padding: 3px 9px; border-radius: 20px;
      background: var(--surface-2); border: 1px solid var(--border); color: var(--text-muted);
    }
    .section-label { font-size: 0.75rem; font-weight: 600; text-transform: uppercase;
      letter-spacing: .05em; color: var(--text-muted); margin: 0 0 8px; }

    .friends-badge {
      display: inline-flex; align-items: center;
      padding: 3px 10px; border-radius: 20px;
      background: rgba(34,197,94,.15); color: #16a34a;
      font-size: 0.72rem; font-weight: 700; letter-spacing: .02em;
    }

    .friends-card {
      display: flex; align-items: center; justify-content: space-between; gap: 12px;
    }
    .friends-card-left { display: flex; align-items: center; gap: 12px; }
    .friends-icon {
      width: 36px; height: 36px; flex-shrink: 0; border-radius: 50%;
      background: rgba(34,197,94,.15); color: #16a34a;
      display: flex; align-items: center; justify-content: center;
      font-size: 1rem; font-weight: 700;
    }
    .friends-card-title { font-size: .88rem; font-weight: 600; color: var(--text); }
    .friends-card-sub { font-size: .75rem; color: var(--text-muted); margin-top: 2px; }
  `]
})
export class UserProfileComponent implements OnInit {
  profile: UserPublicProfileVM | null = null;
  loading = true;
  imgFailed = false;
  isSelf = false;
  sending = false;
  requestSent = false;
  pendingRequestId: string | null = null;
  cancelling = false;
  requestError = '';
  alreadyConnected = false;
  connectedRoomId: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private usersService: UsersService,
    private chatService: ChatService
  ) {}

  ngOnInit() {
    const userId = this.route.snapshot.paramMap.get('userId')!;
    const currentUserId = this.authService.getUserId();
    this.isSelf = userId === currentUserId;

    this.usersService.getPublicProfile(userId).subscribe({
      next: (p) => {
        this.profile = p;
        this.loading = false;
        if (!this.isSelf) this.checkExistingConnection(userId);
      },
      error: () => { this.loading = false; }
    });
  }

  private checkExistingConnection(targetUserId: string) {
    // Check if already connected (either direction)
    this.chatService.getConnectionStatus(targetUserId).subscribe({
      next: (conn) => {
        if (conn) {
          this.alreadyConnected = true;
          this.connectedRoomId = conn.chatRoomId;
          return;
        }
        // Not connected — check for a pending outgoing request
        this.chatService.getOutgoingChatRequests().subscribe({
          next: (outgoing) => {
            const pending = outgoing.find(r => r.receiverId === targetUserId && r.status === 'PENDING');
            if (pending) {
              this.requestSent = true;
              this.pendingRequestId = pending.id;
            }
          }
        });
      }
    });
  }

  sendRequest() {
    if (!this.profile || this.sending) return;
    this.sending = true;
    this.requestError = '';
    this.chatService.sendDirectChatRequest(this.profile.userId).subscribe({
      next: (req) => {
        this.requestSent = true;
        this.pendingRequestId = req.id;
        this.sending = false;
      },
      error: (err) => {
        this.requestError = err?.error?.detail || 'Failed to send request.';
        this.sending = false;
      }
    });
  }

  cancelRequest() {
    if (!this.pendingRequestId || this.cancelling) return;
    this.cancelling = true;
    this.chatService.cancelDirectRequest(this.pendingRequestId).subscribe({
      next: () => {
        this.requestSent = false;
        this.pendingRequestId = null;
        this.cancelling = false;
      },
      error: (err) => {
        this.requestError = err?.error?.detail || 'Failed to cancel request.';
        this.cancelling = false;
      }
    });
  }

  goToChat() {
    if (this.connectedRoomId) {
      this.router.navigate(['/chat'], { queryParams: { roomId: this.connectedRoomId } });
    } else {
      this.router.navigate(['/chat']);
    }
  }

  goBack() {
    window.history.back();
  }

  get initials(): string {
    if (!this.profile) return '?';
    return `${this.profile.firstName[0] ?? ''}${this.profile.lastName[0] ?? ''}`.toUpperCase();
  }

  get pictureUrl(): string {
    return this.usersService.pictureUrl(this.profile!.userId);
  }
}
