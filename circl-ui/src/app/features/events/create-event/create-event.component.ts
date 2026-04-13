import { Component, ElementRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { EventsService } from '../../../core/services/events.service';
import { AiChatbotService } from '../../../core/services/ai-chatbot.service';
import { EventVM } from '../../../core/models';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-create-event',
  standalone: false,
  template: `
    <div class="page">
      <a routerLink="/my-events" class="back-link">← Back to My Events</a>

      <div class="page-header">
        <div>
          <h1 class="page-title">Create Event</h1>
          <p class="page-subtitle">Fill in the details to create a new event</p>
        </div>
      </div>

      <div style="max-width:640px">
        @if (error) { <div class="alert alert-error">{{ error }}</div> }
        @if (success) { <div class="alert alert-success">{{ successMessage }}</div> }

        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <div class="card card-p" style="margin-bottom:14px">
            <p class="section-label">Basic Info</p>

            <div class="form-group">
              <label class="form-label">Event title *</label>
              <input type="text" class="form-control" formControlName="title"
                placeholder="e.g. Tech Summit 2025" />
            </div>

            <div class="form-group">
              <label class="form-label">Location *</label>
              <app-location-autocomplete
                placeholder="Search for a location…"
                [initialValue]="form.get('location')?.value"
                (selected)="onLocationSelected($event)">
              </app-location-autocomplete>
            </div>

            <div class="form-group">
              <label class="form-label">Event type *</label>
              <select class="form-control" formControlName="type">
                <option value="PUBLIC">Public</option>
                <option value="PRIVATE">Private</option>
              </select>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Start date & time *</label>
                <input type="datetime-local" class="form-control" formControlName="startDateTime" />
              </div>
              <div class="form-group">
                <label class="form-label">End date & time *</label>
                <input type="datetime-local" class="form-control" formControlName="endDateTime" />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Max capacity (optional)</label>
              <input type="number" class="form-control" formControlName="maxCapacity"
                placeholder="Leave blank for unlimited" min="1" />
            </div>

            <div class="form-group" style="margin-bottom:0">
              <label class="form-label">Parking</label>
              <select class="form-control" formControlName="parking">
                <option [value]="null">Not specified</option>
                <option value="FREE">Free parking available</option>
                <option value="PAID">Paid parking</option>
                <option value="NOT_AVAILABLE">No parking available</option>
              </select>
            </div>
          </div>

          <!-- Cover Image -->
          <div class="card card-p" style="margin-bottom:14px">
            <p class="section-label">Cover Image <span style="font-weight:400;color:var(--text-muted)">(optional)</span></p>
            <input #coverInputEl type="file" accept="image/*" style="display:none"
              (change)="onCoverFileSelected($event)" />
            @if (!coverPreviewUrl) {
              <div class="cover-upload-area" (click)="coverInputEl.click()">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
                <span style="font-size:.85rem;color:var(--text-muted)">Click to upload a cover image</span>
                <span style="font-size:.75rem;color:var(--text-dim)">PNG, JPG, WEBP · max 10 MB</span>
              </div>
            } @else {
              <div class="cover-preview">
                <img [src]="coverPreviewUrl" alt="Cover preview" />
                <button type="button" class="cover-remove-btn" (click)="removeCover()">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            }
          </div>

          <!-- Tags -->
          <div class="card card-p" style="margin-bottom:14px">
            <p class="section-label">Tags <span style="font-weight:400;color:var(--text-muted)">(optional)</span></p>
            <p class="text-xs text-muted" style="margin-bottom:12px">Add tags to help people discover your event. Press Enter or comma to add.</p>
            <div class="tag-input-wrap" (click)="focusTagInput()">
              @for (tag of tags; track tag) {
                <span class="tag-chip">
                  {{ tag }}
                  <button type="button" class="tag-remove" (click)="removeTag(tag)">×</button>
                </span>
              }
              <input #tagInputEl type="text" class="tag-text-input"
                [(ngModel)]="tagInput"
                [ngModelOptions]="{standalone: true}"
                [placeholder]="tags.length === 0 ? 'e.g. Networking, Tech, Music…' : ''"
                (keydown)="onTagKeydown($event)"
                (blur)="addTag()" />
            </div>
          </div>

          <!-- Description — always last, with AI generate -->
          <div class="card card-p" style="margin-bottom:14px">
            <div class="desc-header">
              <p class="section-label" style="margin-bottom:0">Description</p>
              @if (canGenerate) {
                <button type="button" class="btn-gen" (click)="generateDescription()" [disabled]="generatingDesc">
                  @if (generatingDesc) {
                    <span class="gen-spinner"></span> Generating…
                  } @else if (descriptionGenerated) {
                    ↻ Regenerate
                  } @else {
                    ✨ Generate with AI
                  }
                </button>
              }
            </div>
            <div class="form-group" style="margin-bottom:0;margin-top:14px">
              <textarea class="form-control" formControlName="description" rows="6"
                placeholder="Describe your event… or fill in the fields above and let AI write it for you.">
              </textarea>
              @if (descriptionGenerated) {
                <p class="desc-hint">AI-generated · feel free to edit</p>
              }
            </div>
          </div>

          <!-- Coupon section — private events only -->
          @if (isPrivate) {
            <div class="card card-p" style="margin-bottom:14px;border-color:rgba(108,99,255,.35)">
              <p class="section-label">Access Coupon</p>
              <p class="text-xs text-muted" style="margin-bottom:16px">
                Private events require a coupon code to register. A unique code will be
                auto-generated when you create the event.
              </p>
              <div class="form-row">
                <div class="form-group" style="margin-bottom:0">
                  <label class="form-label">Max uses (optional)</label>
                  <input type="number" class="form-control" formControlName="couponMaxUses"
                    placeholder="Unlimited" min="1" />
                </div>
                <div class="form-group" style="margin-bottom:0">
                  <label class="form-label">Expires at (optional)</label>
                  <input type="datetime-local" class="form-control" formControlName="couponExpiresAt" />
                </div>
              </div>
            </div>
          }

          <div class="flex" style="gap:10px;margin-top:4px;justify-content:flex-end">
            <a routerLink="/my-events" class="btn btn-ghost">Cancel</a>
            <button type="submit" class="btn btn-primary" [disabled]="form.invalid || loading">
              {{ submitLabel }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .section-label { font-size: .8rem; font-weight: 600; color: var(--text); margin-bottom: 16px; }

    .desc-header {
      display: flex; align-items: center; justify-content: space-between;
    }

    .btn-gen {
      display: inline-flex; align-items: center; gap: 6px;
      font-size: .75rem; font-weight: 600;
      color: var(--primary, #6C63FF);
      background: rgba(108,99,255,.1);
      border: 1px solid rgba(108,99,255,.25);
      border-radius: 8px; padding: 5px 12px;
      cursor: pointer; transition: background .12s;
      white-space: nowrap;
    }
    .btn-gen:hover:not(:disabled) { background: rgba(108,99,255,.18); }
    .btn-gen:disabled { opacity: .55; cursor: default; }

    .gen-spinner {
      width: 11px; height: 11px;
      border: 2px solid rgba(108,99,255,.3);
      border-top-color: var(--primary, #6C63FF);
      border-radius: 50%;
      animation: gen-spin .65s linear infinite;
      display: inline-block;
    }
    @keyframes gen-spin { to { transform: rotate(360deg); } }

    .desc-hint {
      font-size: .7rem; color: var(--primary, #6C63FF);
      margin-top: 6px; margin-bottom: 0;
    }

    .tag-input-wrap {
      display: flex; flex-wrap: wrap; gap: 6px; align-items: center;
      min-height: 42px; padding: 6px 10px;
      border: 1px solid var(--border); border-radius: var(--radius);
      background: var(--surface); cursor: text;
      transition: border-color .15s;
    }
    .tag-input-wrap:focus-within { border-color: var(--primary); }
    .tag-chip {
      display: inline-flex; align-items: center; gap: 4px;
      background: rgba(108,99,255,.12); color: var(--primary);
      border: 1px solid rgba(108,99,255,.3);
      border-radius: 20px; padding: 2px 10px 2px 10px;
      font-size: .78rem; font-weight: 500;
    }
    .tag-remove {
      background: none; border: none; cursor: pointer;
      color: var(--primary); font-size: .85rem; line-height: 1;
      padding: 0 0 0 2px; opacity: .7;
    }
    .tag-remove:hover { opacity: 1; }
    .tag-text-input {
      border: none; outline: none; background: transparent;
      font-size: .88rem; color: var(--text); min-width: 140px; flex: 1;
      padding: 2px 0;
    }
    .cover-remove-btn {
      position: absolute; top: 8px; right: 8px;
      width: 28px; height: 28px;
      background: rgba(0,0,0,0.55); color: #fff;
      border: none; border-radius: 50%; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: background .12s;
    }
    .cover-remove-btn:hover { background: rgba(0,0,0,0.75); }
  `]
})
export class CreateEventComponent {
  @ViewChild('tagInputEl') tagInputEl!: ElementRef<HTMLInputElement>;

  form: FormGroup;
  loading = false;
  error = '';
  success = false;
  successMessage = '';
  generatingDesc = false;
  descriptionGenerated = false;
  tags: string[] = [];
  tagInput = '';
  coverFile: File | null = null;
  coverPreviewUrl: SafeUrl | null = null;

  constructor(
    private fb: FormBuilder,
    private eventsService: EventsService,
    private aiService: AiChatbotService,
    private router: Router,
    private sanitizer: DomSanitizer
  ) {
    this.form = this.fb.group({
      title: ['', Validators.required],
      location: ['', Validators.required],
      type: ['PUBLIC', Validators.required],
      startDateTime: ['', Validators.required],
      endDateTime: ['', Validators.required],
      maxCapacity: [null],
      parking: [null],
      description: [''],
      couponMaxUses: [null],
      couponExpiresAt: [null]
    });
  }

  onLocationSelected(address: string): void {
    this.form.patchValue({ location: address });
  }

  get isPrivate(): boolean {
    return this.form.get('type')?.value === 'PRIVATE';
  }

  get canGenerate(): boolean {
    const v = this.form.value;
    return !!(v.title?.trim() && v.location?.trim() && v.type && v.startDateTime && v.endDateTime);
  }

  get submitLabel(): string {
    if (!this.loading) return 'Create Event';
    return this.isPrivate ? 'Creating event & coupon…' : 'Creating…';
  }

  generateDescription(): void {
    if (!this.canGenerate || this.generatingDesc) return;
    this.generatingDesc = true;
    const v = this.form.value;
    this.aiService.generateDescription({
      title: v.title,
      location: v.location,
      type: v.type,
      startDateTime: new Date(v.startDateTime).toISOString(),
      endDateTime: new Date(v.endDateTime).toISOString(),
      maxCapacity: v.maxCapacity ? Number(v.maxCapacity) : null
    }).subscribe({
      next: (res) => {
        this.form.patchValue({ description: res.description });
        this.descriptionGenerated = true;
        this.generatingDesc = false;
      },
      error: () => { this.generatingDesc = false; }
    });
  }

  addTag() {
    const val = this.tagInput.trim().replace(/,+$/, '');
    if (val && !this.tags.includes(val)) this.tags = [...this.tags, val];
    this.tagInput = '';
  }

  removeTag(tag: string) {
    this.tags = this.tags.filter(t => t !== tag);
  }

  onTagKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      this.addTag();
    } else if (event.key === 'Backspace' && !this.tagInput && this.tags.length > 0) {
      this.tags = this.tags.slice(0, -1);
    }
  }

  focusTagInput() {
    this.tagInputEl?.nativeElement.focus();
  }

  onCoverFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.coverFile = file;
    this.coverPreviewUrl = this.sanitizer.bypassSecurityTrustUrl(URL.createObjectURL(file));
  }

  removeCover(): void {
    this.coverFile = null;
    this.coverPreviewUrl = null;
  }

  onSubmit(): void {
    if (this.form.invalid || this.loading) return;
    this.loading = true;
    this.error = '';
    this.addTag(); // commit any partial input

    const v = this.form.value;
    const eventPayload = {
      title: v.title,
      description: v.description || undefined,
      location: v.location,
      type: v.type,
      startDateTime: new Date(v.startDateTime).toISOString(),
      endDateTime: new Date(v.endDateTime).toISOString(),
      maxCapacity: v.maxCapacity ? Number(v.maxCapacity) : null,
      parking: v.parking || null,
      interests: this.tags.length > 0 ? this.tags : undefined
    };

    this.eventsService.createEvent(eventPayload).pipe(
      switchMap((event: EventVM) => {
        if (!this.isPrivate) return of({ event, code: null as string | null });
        return this.eventsService.generateCouponCode(event.id).pipe(
          switchMap(({ code }) =>
            this.eventsService.createCoupon(event.id, {
              code,
              maxUses: v.couponMaxUses ? Number(v.couponMaxUses) : null,
              expiresAt: v.couponExpiresAt ? new Date(v.couponExpiresAt).toISOString() : null
            })
          ),
          switchMap(coupon => of({ event, code: coupon.code }))
        );
      }),
      switchMap(({ event, code }) => {
        if (!this.coverFile) return of({ event, code });
        return this.eventsService.uploadCover(event.id, this.coverFile).pipe(
          switchMap(() => of({ event, code }))
        );
      })
    ).subscribe({
      next: ({ event, code }) => {
        this.success = true;
        this.successMessage = code
          ? `Event created! Access coupon: ${code}. Redirecting…`
          : 'Event created! Redirecting…';
        setTimeout(() => this.router.navigate(['/events', event.id]), 1200);
      },
      error: (err) => {
        this.error = err?.error?.detail || 'Failed to create event. Please try again.';
        this.loading = false;
      }
    });
  }
}
