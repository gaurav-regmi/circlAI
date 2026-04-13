import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { EventsService } from '../../../core/services/events.service';
import { UsersService } from '../../../core/services/users.service';
import { CouponVM, EventVM, PersonSuggestionVM, RegistrationVM } from '../../../core/models';

@Component({
  selector: 'app-event-detail',
  standalone: false,
  template: `
    <div class="page">
      <a routerLink="/events" class="back-link">← Back to Events</a>

      @if (loading) {
        <div class="spinner-wrap"><div class="spinner"></div></div>
      } @else if (!event) {
        <div class="empty-state">
          <div class="empty-icon">🔍</div>
          <h3>Event not found</h3>
          <p>This event may have been removed or doesn't exist.</p>
        </div>
      } @else {
        <!-- Hero -->
        <div style="margin-bottom:24px">
          <div class="event-detail-badges" style="margin-bottom:10px">
            <span class="badge badge-{{ event.status | lowercase }}">{{ event.status }}</span>
            <span class="badge badge-{{ event.type | lowercase }}">{{ event.type }}</span>
          </div>
          <h1 class="event-detail-title">{{ event.title }}</h1>
        </div>

        <!-- Meta + Actions layout -->
        <div style="display:flex;gap:20px;align-items:flex-start;flex-wrap:wrap">
          <!-- Left: meta -->
          <div style="flex:1;min-width:280px">
            <div class="event-meta-grid">
              <div class="meta-card">
                <div class="meta-card-label">📍 Location</div>
                @if (event.location) {
                  <div class="meta-card-value">{{ event.location }}</div>
                } @else {
                  <div class="meta-card-value location-hidden">
                    🔒 Register to reveal location
                  </div>
                }
              </div>
              <div class="meta-card">
                <div class="meta-card-label">📅 Starts</div>
                <div class="meta-card-value">{{ event.startDateTime | date:'MMM d, y · h:mm a' }}</div>
              </div>
              <div class="meta-card">
                <div class="meta-card-label">🔚 Ends</div>
                <div class="meta-card-value">{{ event.endDateTime | date:'MMM d, y · h:mm a' }}</div>
              </div>
              @if (event.maxCapacity) {
                <div class="meta-card">
                  <div class="meta-card-label">👥 Capacity</div>
                  <div class="meta-card-value">{{ event.maxCapacity }} spots</div>
                </div>
              }
              @if (event.parking) {
                <div class="meta-card">
                  <div class="meta-card-label">🅿️ Parking</div>
                  <div class="meta-card-value">{{ parkingLabel(event.parking) }}</div>
                </div>
              }
            </div>

            @if (event.description) {
              <div class="section">
                <p class="section-title">About this event</p>
                <p class="text-sm" style="line-height:1.7;color:var(--text-muted)">{{ event.description }}</p>
              </div>
            }
          </div>

          <!-- Right: action card -->
          <div style="width:280px;flex-shrink:0">
            @if (loggedIn && !isOrganizer && event.status === 'PUBLISHED' && !alreadyRegistered) {
              <div class="card card-p">
                <p class="font-semibold" style="margin-bottom:14px">Register for this event</p>
                @if (regError) { <div class="alert alert-error">{{ regError }}</div> }
                @if (regSuccess) { <div class="alert alert-success">You're registered! 🎉</div> }
                <form [formGroup]="regForm" (ngSubmit)="register()">
                  <div class="form-group">
                    <label class="form-label">Coupon code (optional)</label>
                    <input type="text" class="form-control" formControlName="couponCode"
                      placeholder="Enter code if you have one" />
                  </div>
                  <button type="submit" class="btn btn-primary w-full" [disabled]="regLoading">
                    {{ regLoading ? 'Registering…' : 'Register Now' }}
                  </button>
                </form>
              </div>
            }

            @if (alreadyRegistered) {
              <div class="card card-p">
                <div class="alert alert-success" style="margin-bottom:0">
                  ✓ You are registered for this event
                </div>
              </div>
            }

            @if (!loggedIn && event.status === 'PUBLISHED') {
              <div class="card card-p">
                <p class="text-sm text-muted" style="margin-bottom:12px">Sign in to register for this event</p>
                <a routerLink="/login" class="btn btn-primary w-full">Sign in to Register</a>
              </div>
            }

            @if (event.status === 'CANCELLED') {
              <div class="card card-p">
                <div class="alert alert-error" style="margin-bottom:0">This event has been cancelled.</div>
              </div>
            }
          </div>
        </div>

        <!-- Organiser Management Section -->
        @if (isOrganizer && isMyEvent) {
          <hr class="divider" />

          <div style="margin-bottom:20px">
            <p class="section-title">Manage Event</p>
            <div style="display:flex;gap:10px;flex-wrap:wrap">
              @if (event!.status !== 'CANCELLED' && event!.status !== 'COMPLETED') {
                <a [routerLink]="['/events', event!.id, 'edit']" class="btn btn-ghost">
                  ✎ Edit Event
                </a>
              }
              @if (event!.status === 'DRAFT') {
                <button class="btn btn-success" (click)="publishEvent()" [disabled]="actionLoading">
                  {{ actionLoading ? '…' : '▶ Publish Event' }}
                </button>
              }
              @if (event!.status === 'DRAFT' || event!.status === 'PUBLISHED') {
                <button class="btn btn-danger" (click)="cancelEvent()" [disabled]="actionLoading">
                  {{ actionLoading ? '…' : '✕ Cancel Event' }}
                </button>
              }
            </div>
            @if (actionError) { <div class="alert alert-error" style="margin-top:10px">{{ actionError }}</div> }
          </div>

          <!-- Registrations -->
          <div class="section">
            <div class="section-header">
              <p class="section-title" style="border:none;margin:0;padding:0">
                Registrations ({{ registrations.length }})
              </p>
            </div>
            @if (registrations.length === 0) {
              <p class="text-sm text-muted">No registrations yet.</p>
            } @else {
              <div class="table-wrap">
                <table>
                  <thead>
                    <tr><th>User ID</th><th>Status</th><th>Registered At</th></tr>
                  </thead>
                  <tbody>
                    @for (reg of registrations; track reg.id) {
                      <tr>
                        <td class="text-sm">{{ reg.userId }}</td>
                        <td><span class="badge badge-{{ reg.status | lowercase }}">{{ reg.status }}</span></td>
                        <td class="text-sm text-muted">{{ reg.registeredAt | date:'MMM d, y · h:mm a' }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          </div>

          <!-- Coupons -->
          <div class="section">
            <div class="section-header">
              <p class="section-title" style="border:none;margin:0;padding:0">
                Coupons ({{ coupons.length }})
              </p>
              <button class="btn btn-ghost btn-sm" (click)="showCouponModal = true">＋ Add Coupon</button>
            </div>
            @if (coupons.length === 0) {
              <p class="text-sm text-muted">No coupons created yet.</p>
            } @else {
              <div class="table-wrap">
                <table>
                  <thead>
                    <tr><th>Code</th><th>Uses</th><th>Expires</th><th>Active</th></tr>
                  </thead>
                  <tbody>
                    @for (c of coupons; track c.id) {
                      <tr>
                        <td><code style="background:var(--surface-2);padding:3px 7px;border-radius:5px;font-size:.8rem">{{ c.code }}</code></td>
                        <td class="text-sm">{{ c.usedCount }}{{ c.maxUses ? ' / ' + c.maxUses : ' / ∞' }}</td>
                        <td class="text-sm text-muted">{{ c.expiresAt ? (c.expiresAt | date:'MMM d, y') : '—' }}</td>
                        <td>
                          @if (c.active) {
                            <span class="badge badge-published">Active</span>
                          } @else {
                            <span class="badge badge-cancelled">Inactive</span>
                          }
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          </div>
        }
      }

      <!-- People at this event -->
      @if (loggedIn && (alreadyRegistered || (isOrganizer && isMyEvent))) {
        <hr class="divider" />
        <div class="section">
          <p class="section-title">People at this event ({{ attendees.length }})</p>
          @if (attendeesLoading) {
            <div class="spinner-wrap" style="min-height:60px"><div class="spinner"></div></div>
          } @else if (attendees.length === 0) {
            <p class="text-sm text-muted">No other attendees yet.</p>
          } @else {
            <div class="attendees-grid">
              @for (person of attendees; track person.userId) {
                <div class="attendee-card">
                  <div class="attendee-avatar">
                    @if (person.hasPicture) {
                      <img [src]="attendeePictureUrl(person.userId)"
                           (error)="onAttendeeImgError($event)"
                           style="width:100%;height:100%;object-fit:cover;border-radius:50%;display:block" />
                    } @else {
                      <span>{{ attendeeInitials(person) }}</span>
                    }
                  </div>
                  <div class="attendee-info">
                    <div class="attendee-name">{{ person.firstName }} {{ person.lastName }}</div>
                    @if (person.location) {
                      <div class="attendee-location">📍 {{ person.location }}</div>
                    }
                    @if (person.interests.length > 0) {
                      <div class="attendee-interests">
                        @for (interest of person.interests.slice(0, 3); track interest) {
                          <span class="attendee-chip">{{ interest }}</span>
                        }
                      </div>
                    }
                  </div>
                </div>
              }
            </div>
          }
        </div>
      }

      <!-- AI Event Assistant -->
      <app-event-chatbot [eventId]="event!.id" [eventTitle]="event!.title"></app-event-chatbot>

      <!-- Create Coupon Modal -->
      @if (showCouponModal) {
        <div class="modal-overlay" (click)="closeCouponModal($event)">
          <div class="modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <p class="modal-title">Create Coupon</p>
              <button class="modal-close" (click)="showCouponModal = false">×</button>
            </div>
            @if (couponError) { <div class="alert alert-error">{{ couponError }}</div> }
            <form [formGroup]="couponForm" (ngSubmit)="createCoupon()">
              <div class="form-group">
                <label class="form-label">Coupon code *</label>
                <input type="text" class="form-control" formControlName="code"
                  placeholder="e.g. EARLYBIRD20" style="text-transform:uppercase" />
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Max uses (optional)</label>
                  <input type="number" class="form-control" formControlName="maxUses"
                    placeholder="Unlimited" min="1" />
                </div>
                <div class="form-group">
                  <label class="form-label">Expires at (optional)</label>
                  <input type="datetime-local" class="form-control" formControlName="expiresAt" />
                </div>
              </div>
              <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:4px">
                <button type="button" class="btn btn-ghost" (click)="showCouponModal = false">Cancel</button>
                <button type="submit" class="btn btn-primary" [disabled]="couponForm.invalid || couponLoading">
                  {{ couponLoading ? 'Creating…' : 'Create' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .location-hidden { font-size: .8rem; color: var(--text-muted); font-style: italic; }
    .attendees-grid { display: flex; flex-direction: column; gap: 10px; }
    .attendee-card {
      display: flex; align-items: flex-start; gap: 12px;
      padding: 10px 12px; border-radius: 10px;
      background: var(--surface-2); border: 1px solid var(--border);
    }
    .attendee-avatar {
      width: 40px; height: 40px; flex-shrink: 0; border-radius: 50%;
      background: linear-gradient(135deg, var(--primary), var(--accent));
      display: flex; align-items: center; justify-content: center;
      font-size: 0.75rem; font-weight: 700; color: white; overflow: hidden;
    }
    .attendee-info { min-width: 0; }
    .attendee-name { font-size: 0.85rem; font-weight: 600; }
    .attendee-location { font-size: 0.72rem; color: var(--text-muted); margin-top: 2px; }
    .attendee-interests { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 5px; }
    .attendee-chip {
      font-size: 0.68rem; padding: 2px 7px; border-radius: 20px;
      background: var(--surface); color: var(--text-muted); border: 1px solid var(--border);
    }
  `]
})
export class EventDetailComponent implements OnInit {
  event: EventVM | null = null;
  loading = true;
  loggedIn = false;
  isOrganizer = false;
  isMyEvent = false;
  alreadyRegistered = false;

  registrations: RegistrationVM[] = [];
  coupons: CouponVM[] = [];

  attendees: PersonSuggestionVM[] = [];
  attendeesLoading = false;

  regForm: FormGroup;
  regLoading = false;
  regError = '';
  regSuccess = false;

  actionLoading = false;
  actionError = '';

  showCouponModal = false;
  couponForm: FormGroup;
  couponLoading = false;
  couponError = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private eventsService: EventsService,
    private authService: AuthService,
    private usersService: UsersService
  ) {
    this.regForm = this.fb.group({ couponCode: [''] });
    this.couponForm = this.fb.group({
      code: ['', [Validators.required]], maxUses: [null], expiresAt: [null]
    });
  }

  ngOnInit() {
    this.loggedIn = this.authService.isLoggedIn();
    this.isOrganizer = this.authService.isOrganizer();

    const id = this.route.snapshot.paramMap.get('id')!;
    this.eventsService.getEvent(id).subscribe({
      next: (event) => {
        this.event = event;
        this.loading = false;
        const currentUserId = this.authService.getUserId();
        this.isMyEvent = event.organizerId === currentUserId;

        if (this.isOrganizer && this.isMyEvent) {
          this.loadRegistrations(id);
          this.loadCoupons(id);
          this.loadAttendees(id);
        }
        if (this.loggedIn && !this.isOrganizer) {
          this.checkRegistration();
        }
      },
      error: () => { this.loading = false; }
    });
  }

  private checkRegistration() {
    this.eventsService.getMyRegistrations().subscribe({
      next: (regs) => {
        this.alreadyRegistered = regs.some(r => r.eventId === this.event?.id && r.status === 'REGISTERED');
        if (this.alreadyRegistered && this.event) {
          this.loadAttendees(this.event.id);
        }
      }
    });
  }

  private loadAttendees(id: string) {
    this.attendeesLoading = true;
    this.usersService.getEventAttendees(id).subscribe({
      next: (people) => { this.attendees = people; this.attendeesLoading = false; },
      error: () => { this.attendeesLoading = false; }
    });
  }

  private loadRegistrations(id: string) {
    this.eventsService.getRegistrations(id).subscribe({
      next: (regs) => this.registrations = regs
    });
  }

  private loadCoupons(id: string) {
    this.eventsService.getCoupons(id).subscribe({
      next: (coupons) => this.coupons = coupons
    });
  }

  register() {
    if (this.regLoading || !this.event) return;
    this.regLoading = true;
    this.regError = '';
    const couponCode = this.regForm.value.couponCode?.trim() || undefined;
    this.eventsService.registerForEvent(this.event.id, couponCode).subscribe({
      next: () => { this.regSuccess = true; this.alreadyRegistered = true; this.regLoading = false; },
      error: (err) => { this.regError = err?.error?.detail || 'Registration failed.'; this.regLoading = false; }
    });
  }

  publishEvent() {
    if (!this.event || this.actionLoading) return;
    this.actionLoading = true;
    this.eventsService.publishEvent(this.event.id).subscribe({
      next: (e) => { this.event = e; this.actionLoading = false; },
      error: (err) => { this.actionError = err?.error?.detail || 'Failed to publish.'; this.actionLoading = false; }
    });
  }

  cancelEvent() {
    if (!this.event || this.actionLoading) return;
    this.actionLoading = true;
    this.eventsService.cancelEvent(this.event.id).subscribe({
      next: (e) => { this.event = e; this.actionLoading = false; },
      error: (err) => { this.actionError = err?.error?.detail || 'Failed to cancel.'; this.actionLoading = false; }
    });
  }

  createCoupon() {
    if (!this.event || this.couponForm.invalid || this.couponLoading) return;
    this.couponLoading = true;
    this.couponError = '';
    const v = this.couponForm.value;
    const payload = {
      code: v.code.toUpperCase(),
      maxUses: v.maxUses ? Number(v.maxUses) : null,
      expiresAt: v.expiresAt ? new Date(v.expiresAt).toISOString() : null
    };
    this.eventsService.createCoupon(this.event.id, payload).subscribe({
      next: (c) => {
        this.coupons = [...this.coupons, c];
        this.showCouponModal = false;
        this.couponForm.reset();
        this.couponLoading = false;
      },
      error: (err) => { this.couponError = err?.error?.detail || 'Failed to create coupon.'; this.couponLoading = false; }
    });
  }

  closeCouponModal(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.showCouponModal = false;
    }
  }

  parkingLabel(parking: string): string {
    switch (parking) {
      case 'FREE': return 'Free parking available';
      case 'PAID': return 'Paid parking';
      case 'NOT_AVAILABLE': return 'No parking available';
      default: return parking;
    }
  }

  attendeeInitials(person: PersonSuggestionVM): string {
    return `${person.firstName[0] ?? ''}${person.lastName[0] ?? ''}`.toUpperCase();
  }

  attendeePictureUrl(userId: string): string {
    return this.usersService.pictureUrl(userId);
  }

  onAttendeeImgError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
  }
}
