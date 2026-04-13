import { Component, ElementRef, OnDestroy, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ChatService } from '../../core/services/chat.service';
import { UsersService, UserLookup } from '../../core/services/users.service';
import { ChatInvitationVM, ChatMemberVM, ChatRoomVM, MessageVM } from '../../core/models';

// Track which user picture URLs have already 404'd so we don't retry them
const FAILED_PICTURES = new Set<string>();

interface RoomGroup {
  room: ChatRoomVM;
  subGroups: ChatRoomVM[];
}

@Component({
  selector: 'app-chat',
  standalone: false,
  template: `
    <div class="chat-wrap">
      <!-- Rooms panel -->
      <div class="chat-rooms-panel">
        <div class="chat-rooms-header">
          <p style="font-size:.95rem;font-weight:600">Chat</p>
        </div>

        <div class="chat-rooms-list">
          <!-- Pending invitations -->
          @if (pendingInvitations.length > 0) {
            <p class="nav-section-label" style="padding:0 8px;margin:6px 0 4px">
              Invitations ({{ pendingInvitations.length }})
            </p>
            @for (inv of pendingInvitations; track inv.id) {
              <div class="inv-item">
                <div class="inv-room-name">{{ inv.chatRoomName }}</div>
                <div class="inv-actions">
                  <button class="btn btn-success btn-sm" (click)="acceptInv(inv)" [disabled]="invLoading">Accept</button>
                  <button class="btn btn-ghost btn-sm" (click)="declineInv(inv)" [disabled]="invLoading">Decline</button>
                </div>
              </div>
            }
            <div class="divider" style="margin:8px 0"></div>
          }

          <!-- Rooms grouped by parent -->
          <p class="nav-section-label" style="padding:0 8px;margin:6px 0 4px">Rooms</p>
          @if (roomsLoading) {
            <div style="padding:20px;display:flex;justify-content:center"><div class="spinner"></div></div>
          } @else if (roomGroups.length === 0) {
            <div style="padding:16px;text-align:center">
              <p class="text-xs text-muted">No chat rooms yet.</p>
              <p class="text-xs text-muted" style="margin-top:4px">Join an event to get access.</p>
            </div>
          } @else {
            @for (group of roomGroups; track group.room.id) {
              <!-- Parent event room -->
              <div class="room-item"
                [class.selected]="selectedRoom?.id === group.room.id"
                (click)="selectRoom(group.room)">
                <div class="room-avatar">{{ roomInitials(group.room.name) }}</div>
                <div class="room-info min-w-0">
                  <div class="room-name">{{ group.room.name }}</div>
                  <div class="room-sub">{{ group.room.type === 'DIRECT' ? 'Direct Message' : 'Event Group' }}</div>
                </div>
              </div>

              <!-- Sub-groups indented -->
              @for (sub of group.subGroups; track sub.id) {
                <div class="room-item sub-room-item"
                  [class.selected]="selectedRoom?.id === sub.id"
                  (click)="selectRoom(sub)">
                  <div class="sub-room-connector">└</div>
                  <div class="room-avatar" style="width:26px;height:26px;font-size:.65rem">
                    {{ roomInitials(sub.name) }}
                  </div>
                  <div class="room-info min-w-0">
                    <div class="room-name" style="font-size:.8rem">{{ sub.name }}</div>
                    <div class="room-sub">Sub-group</div>
                  </div>
                </div>
              }
            }
          }
        </div>
      </div>

      <!-- Messages panel -->
      <div class="chat-main">
        @if (!selectedRoom) {
          <div style="flex:1;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:12px;color:var(--text-muted)">
            <div style="font-size:2.5rem;opacity:.3">◎</div>
            <p style="font-size:.9rem;font-weight:500">Select a room to start chatting</p>
          </div>
        } @else {
          <!-- Room header with actions -->
          <div class="chat-main-header">
            <div class="room-avatar"
              [style.cursor]="selectedRoom.type === 'DIRECT' && otherMember ? 'pointer' : 'default'"
              (click)="selectedRoom.type === 'DIRECT' && otherMember ? viewProfile(otherMember.userId) : null">
              {{ roomInitials(selectedRoom.name) }}
            </div>
            <div style="flex:1;min-width:0">
              <p style="font-size:.9rem;font-weight:600"
                [style.cursor]="selectedRoom.type === 'DIRECT' && otherMember ? 'pointer' : 'default'"
                (click)="selectedRoom.type === 'DIRECT' && otherMember ? viewProfile(otherMember.userId) : null">
                {{ selectedRoom.name }}
              </p>
              <p class="text-xs text-muted">
                {{ selectedRoom.type === 'EVENT_GROUP' ? 'Event Group' : selectedRoom.type === 'DIRECT' ? 'Direct Message' : 'Sub-group' }} ·
                {{ members.length }} member{{ members.length !== 1 ? 's' : '' }}
              </p>
            </div>
            <div style="display:flex;gap:6px;margin-right:52px">
              @if (selectedRoom.type === 'DIRECT' && otherMember) {
                <button class="btn btn-ghost btn-sm" (click)="viewProfile(otherMember.userId)">
                  View Profile
                </button>
              }
              <button class="btn btn-ghost btn-sm"
                [style.background]="showMembersPanel ? 'var(--primary-glow)' : ''"
                (click)="showMembersPanel = !showMembersPanel">
                Members
              </button>
              <button class="btn btn-ghost btn-sm" (click)="openInviteModal()">+ Invite</button>
              @if (selectedRoom.type === 'EVENT_GROUP') {
                <button class="btn btn-ghost btn-sm" (click)="openSubGroupModal()">⊕ Sub-group</button>
              }
              <button class="btn btn-ghost btn-sm" style="color:var(--danger,#e74c3c)"
                (click)="leaveRoom()" [disabled]="leaveLoading">
                {{ leaveLoading ? 'Leaving…' : 'Leave' }}
              </button>
            </div>
          </div>

          <!-- Messages -->
          <div class="chat-messages" #messagesContainer>
            @if (messagesLoading) {
              <div class="spinner-wrap"><div class="spinner"></div></div>
            } @else if (messages.length === 0) {
              <div style="text-align:center;padding:40px;color:var(--text-muted)">
                <p class="text-sm">No messages yet. Say hello! 👋</p>
              </div>
            } @else {
              @for (msg of messages; track msg.id) {
                <div class="msg-row" [class.msg-row-mine]="isMine(msg)">
                  <!-- Avatar -->
                  <div class="msg-avatar-wrap"
                    [style.cursor]="!isMine(msg) ? 'pointer' : 'default'"
                    (click)="!isMine(msg) ? viewProfile(msg.senderId) : null">
                    @if (!pictureFailedFor(msg.senderId)) {
                      <img [src]="senderPictureUrl(msg.senderId)"
                           (error)="markPictureFailed(msg.senderId)"
                           class="msg-avatar-img" [alt]="msg.senderName" />
                    } @else {
                      <div class="msg-avatar-initials">{{ nameInitials(msg.senderName) }}</div>
                    }
                  </div>
                  <!-- Bubble -->
                  <div class="msg-bubble" [class.mine]="isMine(msg)" [class.theirs]="!isMine(msg)">
                    <div class="msg-sender" [class.msg-sender-mine]="isMine(msg)"
                      [style.cursor]="!isMine(msg) ? 'pointer' : 'default'"
                      (click)="!isMine(msg) ? viewProfile(msg.senderId) : null">
                      {{ isMine(msg) ? 'You' : msg.senderName }}
                    </div>
                    @if (msg.content) {
                      <div class="msg-content">{{ msg.content }}</div>
                    }
                    @if (msg.fileName) {
                      <div class="msg-file-attachment">
                        <div class="msg-file-icon">{{ isImage(msg) ? '🖼' : '📎' }}</div>
                        <div class="msg-file-info">
                          <div class="msg-file-name" [title]="msg.fileName">{{ msg.fileName }}</div>
                          @if (msg.fileSize) {
                            <div class="msg-file-size">{{ formatFileSize(msg.fileSize) }}</div>
                          }
                        </div>
                        <button class="btn btn-ghost btn-sm msg-file-dl"
                          (click)="downloadFile(msg)"
                          [disabled]="downloadingMsgId === msg.id">
                          {{ downloadingMsgId === msg.id ? '…' : '↓' }}
                        </button>
                      </div>
                    }
                    <div class="msg-meta">{{ msg.sentAt | date:'h:mm a' }}</div>
                  </div>
                </div>
              }
            }
          </div>

          <!-- Input bar -->
          <div class="chat-input-bar">
            <input type="file" #fileInput style="display:none"
              (change)="onFileSelected($event)" />
            <button class="btn btn-ghost btn-sm" style="padding:6px 10px;flex-shrink:0"
              (click)="fileInput.click()"
              [disabled]="uploadLoading || !selectedRoom"
              title="Attach file">
              📎
            </button>
            <input
              type="text"
              class="form-control"
              [(ngModel)]="newMessage"
              placeholder="Type a message…"
              (keydown.enter)="sendMessage()"
              [disabled]="sendLoading || uploadLoading"
              style="flex:1" />
            <button class="btn btn-primary" (click)="sendMessage()"
              [disabled]="!newMessage.trim() || sendLoading || uploadLoading">
              {{ sendLoading ? '…' : 'Send' }}
            </button>
          </div>
        }
      </div>

      <!-- Members panel -->
      @if (selectedRoom && showMembersPanel) {
        <div class="chat-members-panel">
          <!-- Header: close button on left so it doesn't clash with the top-right notification bell -->
          <div class="chat-members-header">
            <button class="btn btn-ghost btn-sm" style="padding:2px 8px;margin-right:6px" (click)="showMembersPanel = false">←</button>
            <p style="font-size:.85rem;font-weight:600">Members ({{ members.length }})</p>
          </div>

          <!-- Search -->
          <div style="padding:8px 12px;border-bottom:1px solid var(--border)">
            <input type="text" class="form-control" [(ngModel)]="memberSearch"
              placeholder="Search members…"
              style="font-size:.8rem;padding:5px 10px" />
          </div>

          <div class="chat-members-list">
            <!-- Current members -->
            @for (member of filteredMembers; track member.userId) {
              <div class="chat-member-item">
                <div class="chat-member-avatar">
                  @if (!pictureFailedFor(member.userId)) {
                    <img [src]="senderPictureUrl(member.userId)"
                         (error)="markPictureFailed(member.userId)"
                         [alt]="member.userName" />
                  } @else {
                    {{ nameInitials(member.userName) }}
                  }
                </div>
                <span class="chat-member-name" [title]="member.userName">{{ member.userName }}</span>
                @if (member.role === 'ADMIN') {
                  <span class="badge-admin">Admin</span>
                }
              </div>
            }
            @if (memberSearch && filteredMembers.length === 0) {
              <p class="text-xs text-muted" style="padding:12px 14px">No members match "{{ memberSearch }}"</p>
            }

            <!-- Add from event group (sub-group admins only) -->
            @if (isCurrentUserAdmin && selectedRoom.type === 'SUB_GROUP' && addableMembers.length > 0) {
              <div style="padding:8px 14px 4px;margin-top:6px;border-top:1px solid var(--border)">
                <p class="text-xs text-muted" style="margin-bottom:6px;font-weight:600;text-transform:uppercase;letter-spacing:.04em">
                  Add from event
                </p>
              </div>
              @for (member of addableMembers; track member.userId) {
                <div class="chat-member-item">
                  <div class="chat-member-avatar">
                    @if (!pictureFailedFor(member.userId)) {
                      <img [src]="senderPictureUrl(member.userId)"
                           (error)="markPictureFailed(member.userId)"
                           [alt]="member.userName" />
                    } @else {
                      {{ nameInitials(member.userName) }}
                    }
                  </div>
                  <span class="chat-member-name" [title]="member.userName">{{ member.userName }}</span>
                  <button class="btn btn-primary btn-sm"
                    style="padding:2px 8px;font-size:.72rem;flex-shrink:0"
                    [disabled]="addingMemberId === member.userId"
                    (click)="addMemberFromList(member)">
                    {{ addingMemberId === member.userId ? '…' : '+' }}
                  </button>
                </div>
              }
            }
          </div>
        </div>
      }
    </div>

    <!-- Invite User Modal -->
    @if (showInviteModal) {
      <div class="modal-overlay" (click)="closeOnOverlay($event, 'invite')">
        <div class="modal">
          <div class="modal-header">
            <p class="modal-title">Invite User to {{ selectedRoom?.name }}</p>
            <button class="modal-close" (click)="showInviteModal = false">×</button>
          </div>

          @if (inviteError) { <div class="alert alert-error">{{ inviteError }}</div> }
          @if (inviteSuccess) { <div class="alert alert-success">{{ inviteSuccess }}</div> }

          <!-- Step 1: email lookup -->
          @if (!foundUser) {
            <div class="form-group">
              <label class="form-label">Search by email address</label>
              <div style="display:flex;gap:8px">
                <input type="email" class="form-control" [(ngModel)]="inviteEmail"
                  placeholder="user@example.com"
                  (keydown.enter)="lookupUser()"
                  style="flex:1" />
                <button class="btn btn-primary" (click)="lookupUser()"
                  [disabled]="!inviteEmail.trim() || lookupLoading">
                  {{ lookupLoading ? '…' : 'Search' }}
                </button>
              </div>
            </div>
          }

          <!-- Step 2: confirm and invite -->
          @if (foundUser) {
            <div style="background:var(--surface-2);border:1px solid var(--border);border-radius:var(--radius);padding:14px;margin-bottom:16px">
              <div style="display:flex;align-items:center;gap:10px">
                <div class="user-avatar">{{ userInitials(foundUser) }}</div>
                <div>
                  <p style="font-size:.88rem;font-weight:600">{{ foundUser.firstName }} {{ foundUser.lastName }}</p>
                  <p class="text-xs text-muted">{{ foundUser.email }}</p>
                </div>
              </div>
            </div>
            <div style="display:flex;gap:8px;justify-content:flex-end">
              <button class="btn btn-ghost" (click)="resetInvite()">Search again</button>
              <button class="btn btn-primary" (click)="inviteFoundUser()" [disabled]="inviteLoading">
                {{ inviteLoading ? 'Inviting…' : 'Send Invitation' }}
              </button>
            </div>
          }
        </div>
      </div>
    }

    <!-- Create Sub-group Modal -->
    @if (showSubGroupModal) {
      <div class="modal-overlay" (click)="closeOnOverlay($event, 'subgroup')">
        <div class="modal">
          <div class="modal-header">
            <p class="modal-title">Create Sub-group</p>
            <button class="modal-close" (click)="showSubGroupModal = false">×</button>
          </div>

          @if (subGroupError) { <div class="alert alert-error">{{ subGroupError }}</div> }

          <div class="form-group">
            <label class="form-label">Sub-group name *</label>
            <input type="text" class="form-control" [(ngModel)]="subGroupName"
              placeholder="e.g. Volunteers, VIP Guests…"
              (keydown.enter)="createSubGroup()" />
          </div>
          <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:4px">
            <button class="btn btn-ghost" (click)="showSubGroupModal = false">Cancel</button>
            <button class="btn btn-primary" (click)="createSubGroup()"
              [disabled]="!subGroupName.trim() || subGroupLoading">
              {{ subGroupLoading ? 'Creating…' : 'Create Sub-group' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .sub-room-item { padding-left: 22px; }
    .sub-room-connector { color: var(--text-dim); font-size: .75rem; margin-right: 4px; flex-shrink: 0; }
    .msg-sender { font-size: .7rem; font-weight: 600; color: var(--primary); margin-bottom: 3px; padding: 0 2px; }
    .msg-sender-mine { color: var(--text-muted); }
    /* message row layout */
    .msg-row { display: flex; align-items: flex-end; gap: 8px; margin-bottom: 2px; }
    .msg-row-mine { flex-direction: row-reverse; }
    .msg-avatar-wrap { width: 30px; height: 30px; border-radius: 50%; flex-shrink: 0; overflow: hidden; }
    .msg-avatar-img { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; display: block; }
    .msg-avatar-initials {
      width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;
      background: var(--primary); color: #fff; font-size: .65rem; font-weight: 700;
      border-radius: 50%;
    }
    /* file attachment */
    .msg-file-attachment {
      display: flex; align-items: center; gap: 8px;
      background: rgba(0,0,0,.06); border-radius: 8px;
      padding: 8px 10px; margin-top: 4px; max-width: 260px;
    }
    .mine .msg-file-attachment { background: rgba(255,255,255,.15); }
    .msg-file-icon { font-size: 1.2rem; flex-shrink: 0; }
    .msg-file-info { flex: 1; min-width: 0; }
    .msg-file-name { font-size: .78rem; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .msg-file-size { font-size: .68rem; color: var(--text-muted); margin-top: 1px; }
    .msg-file-dl { padding: 3px 8px !important; font-size: .8rem !important; flex-shrink: 0; }
  `]
})
export class ChatComponent implements OnInit, OnDestroy {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  rooms: ChatRoomVM[] = [];
  selectedRoom: ChatRoomVM | null = null;
  messages: MessageVM[] = [];
  members: ChatMemberVM[] = [];
  eventGroupMembers: ChatMemberVM[] = [];
  pendingInvitations: ChatInvitationVM[] = [];
  addingMemberId: string | null = null;
  memberSearch = '';

  roomsLoading = false;
  messagesLoading = false;
  sendLoading = false;
  uploadLoading = false;
  invLoading = false;
  leaveLoading = false;
  downloadingMsgId: string | null = null;

  newMessage = '';
  private _showMembersPanel = false;
  get showMembersPanel(): boolean { return this._showMembersPanel; }
  set showMembersPanel(value: boolean) {
    this._showMembersPanel = value;
    document.body.classList.toggle('chat-members-open', value);
  }
  private currentUserId: string | null = null;
  private pollInterval: ReturnType<typeof setInterval> | null = null;
  private pendingRoomId: string | null = null;

  // Invite modal
  showInviteModal = false;
  inviteEmail = '';
  foundUser: any = null;
  lookupLoading = false;
  inviteLoading = false;
  inviteError = '';
  inviteSuccess = '';


  // Sub-group modal
  showSubGroupModal = false;
  subGroupName = '';
  subGroupLoading = false;
  subGroupError = '';

  constructor(
    private chatService: ChatService,
    private usersService: UsersService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.currentUserId = this.authService.getUserId();
    this.pendingRoomId = this.route.snapshot.queryParamMap.get('roomId');
    this.loadRooms();
    this.loadInvitations();
    this.pollInterval = setInterval(() => {
      if (this.selectedRoom) this.loadMessages(this.selectedRoom.id, false);
    }, 5000);
  }

  ngOnDestroy() {
    if (this.pollInterval) clearInterval(this.pollInterval);
    document.body.classList.remove('chat-members-open');
  }

  // ── Rooms ──────────────────────────────────────────────────────────────────

  get roomGroups(): RoomGroup[] {
    const eventGroupIds = new Set(
      this.rooms.filter(r => r.type === 'EVENT_GROUP').map(r => r.id)
    );

    // Sub-groups whose parent is not in the visible list (edge case for organizers)
    const orphanSubGroups = this.rooms.filter(
      r => r.type === 'SUB_GROUP' && r.parentChatRoomId != null && !eventGroupIds.has(r.parentChatRoomId)
    );

    const groups: RoomGroup[] = this.rooms
      .filter(r => r.type === 'EVENT_GROUP')
      .map(room => ({
        room,
        subGroups: this.rooms.filter(r => r.parentChatRoomId === room.id)
      }));

    orphanSubGroups.forEach(sub => groups.push({ room: sub, subGroups: [] }));

    // Direct message rooms appear as top-level entries with no sub-groups
    this.rooms
      .filter(r => r.type === 'DIRECT')
      .forEach(room => groups.push({ room, subGroups: [] }));

    return groups;
  }

  get isCurrentUserAdmin(): boolean {
    if (!this.selectedRoom || !this.currentUserId) return false;
    const me = this.members.find(m => m.userId === this.currentUserId);
    return me?.role === 'ADMIN';
  }

  get otherMember(): ChatMemberVM | null {
    if (this.selectedRoom?.type !== 'DIRECT') return null;
    return this.members.find(m => m.userId !== this.currentUserId) ?? null;
  }

  viewProfile(userId: string) {
    this.router.navigate(['/people', userId]);
  }

  get addableMembers(): ChatMemberVM[] {
    const currentIds = new Set(this.members.map(m => m.userId));
    return this.eventGroupMembers.filter(m => !currentIds.has(m.userId));
  }

  get filteredMembers(): ChatMemberVM[] {
    const q = this.memberSearch.trim().toLowerCase();
    if (!q) return this.members;
    return this.members.filter(m => m.userName.toLowerCase().includes(q));
  }

  loadRooms() {
    this.roomsLoading = true;
    this.chatService.getRooms().subscribe({
      next: (rooms) => {
        this.rooms = rooms;
        this.roomsLoading = false;
        if (this.pendingRoomId) {
          const room = this.rooms.find(r => r.id === this.pendingRoomId);
          if (room) this.selectRoom(room);
          this.pendingRoomId = null;
        }
      },
      error: () => { this.roomsLoading = false; }
    });
  }

  loadInvitations() {
    this.chatService.getInvitations().subscribe({
      next: (invs) => { this.pendingInvitations = invs.filter(i => i.status === 'PENDING'); }
    });
  }

  selectRoom(room: ChatRoomVM) {
    this.selectedRoom = room;
    this.messages = [];
    this.eventGroupMembers = [];
    this.memberSearch = '';
    this.loadMessages(room.id, true);
    this.chatService.getMembers(room.id).subscribe({
      next: (m) => this.members = m
    });
    if (room.type === 'SUB_GROUP' && room.parentChatRoomId) {
      this.chatService.getMembers(room.parentChatRoomId).subscribe({
        next: (m) => this.eventGroupMembers = m
      });
    }
  }

  loadMessages(roomId: string, showLoading: boolean) {
    if (showLoading) this.messagesLoading = true;
    this.chatService.getMessages(roomId).subscribe({
      next: (page) => {
        const incoming = page.content;
        const changed = incoming.length !== this.messages.length ||
          incoming.some((m, i) => m.id !== this.messages[i]?.id);
        if (changed) {
          this.messages = incoming;
          if (showLoading) setTimeout(() => this.scrollToBottom(), 50);
        }
        this.messagesLoading = false;
      },
      error: () => { this.messagesLoading = false; }
    });
  }

  sendMessage() {
    const content = this.newMessage.trim();
    if (!content || !this.selectedRoom || this.sendLoading) return;
    this.sendLoading = true;
    this.chatService.sendMessage(this.selectedRoom.id, content).subscribe({
      next: (msg) => {
        this.messages = [...this.messages, msg];
        this.newMessage = '';
        this.sendLoading = false;
        setTimeout(() => this.scrollToBottom(), 50);
      },
      error: () => { this.sendLoading = false; }
    });
  }

  leaveRoom() {
    if (!this.selectedRoom || !confirm(`Leave "${this.selectedRoom.name}"?`)) return;
    this.leaveLoading = true;
    const roomId = this.selectedRoom.id;
    this.chatService.leaveRoom(roomId).subscribe({
      next: () => {
        this.rooms = this.rooms.filter(r => r.id !== roomId);
        this.selectedRoom = null;
        this.messages = [];
        this.members = [];
        this.showMembersPanel = false;
        this.leaveLoading = false;
      },
      error: () => { this.leaveLoading = false; }
    });
  }

  addMemberFromList(member: ChatMemberVM) {
    if (!this.selectedRoom || this.addingMemberId) return;
    this.addingMemberId = member.userId;
    this.chatService.addMember(this.selectedRoom.id, member.userId).subscribe({
      next: (newMember) => {
        this.members = [...this.members, newMember];
        this.addingMemberId = null;
      },
      error: () => { this.addingMemberId = null; }
    });
  }

  acceptInv(inv: ChatInvitationVM) {
    this.invLoading = true;
    this.chatService.acceptInvitation(inv.id).subscribe({
      next: () => {
        this.pendingInvitations = this.pendingInvitations.filter(i => i.id !== inv.id);
        this.loadRooms();
        this.invLoading = false;
      },
      error: () => { this.invLoading = false; }
    });
  }

  declineInv(inv: ChatInvitationVM) {
    this.invLoading = true;
    this.chatService.declineInvitation(inv.id).subscribe({
      next: () => {
        this.pendingInvitations = this.pendingInvitations.filter(i => i.id !== inv.id);
        this.invLoading = false;
      },
      error: () => { this.invLoading = false; }
    });
  }

  // ── Invite modal ───────────────────────────────────────────────────────────

  openInviteModal() {
    this.resetInvite();
    this.showInviteModal = true;
  }

  lookupUser() {
    const email = this.inviteEmail.trim();
    if (!email) return;
    this.lookupLoading = true;
    this.inviteError = '';
    this.usersService.lookupByEmail(email).subscribe({
      next: (user) => { this.foundUser = user; this.lookupLoading = false; },
      error: (err) => {
        this.inviteError = err?.error?.detail || 'No user found with that email.';
        this.lookupLoading = false;
      }
    });
  }

  inviteFoundUser() {
    if (!this.foundUser || !this.selectedRoom) return;
    this.inviteLoading = true;
    this.inviteError = '';
    this.chatService.inviteUser(this.selectedRoom.id, this.foundUser.id).subscribe({
      next: () => {
        this.inviteSuccess = `Invitation sent to ${this.foundUser.firstName} ${this.foundUser.lastName}!`;
        this.inviteLoading = false;
        this.foundUser = null;
        this.inviteEmail = '';
        setTimeout(() => {
          this.inviteSuccess = '';
          this.showInviteModal = false;
        }, 2000);
      },
      error: (err) => {
        this.inviteError = err?.error?.detail || 'Failed to send invitation.';
        this.inviteLoading = false;
      }
    });
  }

  resetInvite() {
    this.inviteEmail = '';
    this.foundUser = null;
    this.inviteError = '';
    this.inviteSuccess = '';
    this.lookupLoading = false;
    this.inviteLoading = false;
  }

  // ── Sub-group modal ────────────────────────────────────────────────────────

  openSubGroupModal() {
    this.subGroupName = '';
    this.subGroupError = '';
    this.showSubGroupModal = true;
  }

  createSubGroup() {
    const name = this.subGroupName.trim();
    if (!name || !this.selectedRoom) return;
    this.subGroupLoading = true;
    this.subGroupError = '';
    this.chatService.createSubGroup(this.selectedRoom.id, name).subscribe({
      next: (subGroup) => {
        this.rooms = [...this.rooms, subGroup];
        this.subGroupName = '';
        this.subGroupLoading = false;
        this.showSubGroupModal = false;
        this.selectRoom(subGroup);
      },
      error: (err) => {
        this.subGroupError = err?.error?.detail || 'Failed to create sub-group.';
        this.subGroupLoading = false;
      }
    });
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  isMine(msg: MessageVM): boolean {
    return msg.senderId === this.currentUserId;
  }

  roomInitials(name: string): string {
    return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';
  }

  nameInitials(name: string): string {
    return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';
  }

  userInitials(user: UserLookup): string {
    return `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase();
  }

  senderPictureUrl(senderId: string): string {
    return this.usersService.pictureUrl(senderId);
  }

  pictureFailedFor(senderId: string): boolean {
    return FAILED_PICTURES.has(senderId);
  }

  markPictureFailed(senderId: string): void {
    FAILED_PICTURES.add(senderId);
  }

  closeOnOverlay(event: MouseEvent, modal: 'invite' | 'subgroup') {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      if (modal === 'invite') this.showInviteModal = false;
      else this.showSubGroupModal = false;
    }
  }

  // ── File upload ────────────────────────────────────────────────────────────

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || !this.selectedRoom) return;
    input.value = '';
    this.uploadLoading = true;
    this.chatService.uploadFile(this.selectedRoom.id, file).subscribe({
      next: (msg) => {
        this.messages = [...this.messages, msg];
        this.uploadLoading = false;
        this.cdr.detectChanges();
        setTimeout(() => this.scrollToBottom(), 50);
      },
      error: () => { this.uploadLoading = false; }
    });
  }

  downloadFile(msg: MessageVM) {
    if (!this.selectedRoom || this.downloadingMsgId) return;
    this.downloadingMsgId = msg.id;
    this.chatService.getFileUrl(this.selectedRoom.id, msg.id).subscribe({
      next: ({ url }) => {
        this.downloadingMsgId = null;
        window.open(url, '_blank');
      },
      error: () => { this.downloadingMsgId = null; }
    });
  }

  isImage(msg: MessageVM): boolean {
    return !!(msg.fileContentType && msg.fileContentType.startsWith('image/'));
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  private scrollToBottom() {
    try {
      const el = this.messagesContainer?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    } catch { /* ignore */ }
  }
}
