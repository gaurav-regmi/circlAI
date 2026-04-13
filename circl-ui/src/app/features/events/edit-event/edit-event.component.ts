import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { EventsService } from '../../../core/services/events.service';
import { AuthService } from '../../../core/services/auth.service';
import { AiChatbotService } from '../../../core/services/ai-chatbot.service';
import { EventVM } from '../../../core/models';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-edit-event',
  standalone: false,
  template: `
    <div class="page">
      <a [routerLink]="['/events', eventId]" class="back-link">← Back to Event</a>

      <div class="page-header">
        <div>
          <h1 class="page-title">Edit Event</h1>
          <p class="page-subtitle">Update the details for this event</p>
        </div>
      </div>

      @if (loadError) {
        <div class="empty-state">
          <div class="empty-icon">⚠️</div>
          <h3>Could not load event</h3>
          <p>{{ loadError }}</p>
        </div>
      } @else if (!event) {
        <div class="spinner-wrap"><div class="spinner"></div></div>
      } @else {
        <div style="max-width:640px">
          @if (error) { <div class="alert alert-error">{{ error }}</div> }

          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <div class="card card-p" style="margin-bottom:14px">
              <p class="section-label">Basic Info</p>

              <div class="form-group">
                <label class="form-label">Event title *</label>
                <input type="text" class="form-control" formControlName="title" />
              </div>

              <div class="form-group">
                <label class="form-label">Location *</label>
                <app-location-autocomplete
                  placeholder="Search for a location…"
                  [initialValue]="event!.location || ''"
                  [resetKey]="locationResetKey"
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
              @if (coverPreviewUrl) {
                <div class="cover-preview">
                  <img [src]="coverPreviewUrl" alt="Cover preview" />
                  <button type="button" class="cover-remove-btn" (click)="removeCover()">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
              } @else if (existingCoverLoaded) {
                <div class="cover-preview">
                  <img [src]="existingCoverUrl" alt="Current cover" (error)="existingCoverLoaded=false" />
                  <button type="button" class="cover-remove-btn" (click)="existingCoverLoaded=false">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
              } @else {
                <div class="cover-upload-area" (click)="coverInputEl.click()">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                  </svg>
                  <span style="font-size:.85rem;color:var(--text-muted)">Click to upload a cover image</span>
                  <span style="font-size:.75rem;color:var(--text-dim)">PNG, JPG, WEBP · max 10 MB</span>
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
                  placeholder="Describe your event…"></textarea>
                @if (descriptionGenerated) {
                  <p class="desc-hint">AI-generated · feel free to edit</p>
                }
              </div>
            </div>

            @if (event!.status === 'CANCELLED' || event!.status === 'COMPLETED') {
              <div class="alert alert-error" style="margin-bottom:14px">
                This event is {{ event!.status | lowercase }} and cannot be edited.
              </div>
            }

            <div class="flex" style="gap:10px;justify-content:flex-end">
              <a [routerLink]="['/events', eventId]" class="btn btn-ghost">Cancel</a>
              <button type="submit" class="btn btn-primary"
                [disabled]="form.invalid || loading || event!.status === 'CANCELLED' || event!.status === 'COMPLETED'">
                {{ loading ? 'Saving…' : 'Save Changes' }}
              </button>
            </div>
          </form>
        </div>
      }
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
export class EditEventComponent implements OnInit {
  @ViewChild('tagInputEl') tagInputEl!: ElementRef<HTMLInputElement>;

  eventId = '';
  event: EventVM | null = null;
  form!: FormGroup;
  loading = false;
  error = '';
  loadError = '';
  locationResetKey = 0;
  generatingDesc = false;
  descriptionGenerated = false;
  tags: string[] = [];
  tagInput = '';
  coverFile: File | null = null;
  coverPreviewUrl: SafeUrl | null = null;
  existingCoverUrl = '';
  existingCoverLoaded = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private eventsService: EventsService,
    private authService: AuthService,
    private aiService: AiChatbotService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit() {
    this.eventId = this.route.snapshot.paramMap.get('id')!;

    this.form = this.fb.group({
      title: ['', Validators.required],
      location: ['', Validators.required],
      type: ['PUBLIC', Validators.required],
      startDateTime: ['', Validators.required],
      endDateTime: ['', Validators.required],
      maxCapacity: [null],
      parking: [null],
      description: ['']
    });

    this.eventsService.getEvent(this.eventId).subscribe({
      next: (event) => {
        const currentUserId = this.authService.getUserId();
        const isOrganizer = this.authService.isOrganizer();
        const isAdmin = this.authService.getCurrentUser()?.role === 'ADMIN';

        if (!isAdmin && (!isOrganizer || event.organizerId !== currentUserId)) {
          this.router.navigate(['/events', this.eventId]);
          return;
        }

        this.event = event;
        this.existingCoverUrl = this.eventsService.coverUrl(event.id);
        this.existingCoverLoaded = true;
        this.tags = event.interests ? [...event.interests] : [];
        this.form.patchValue({
          title: event.title,
          location: event.location,
          type: event.type,
          startDateTime: this.toDatetimeLocal(event.startDateTime),
          endDateTime: this.toDatetimeLocal(event.endDateTime),
          maxCapacity: event.maxCapacity ?? null,
          parking: event.parking ?? null,
          description: event.description ?? ''
        });
      },
      error: () => { this.loadError = 'Event not found.'; }
    });
  }

  onLocationSelected(address: string) {
    this.form.patchValue({ location: address });
  }

  get canGenerate(): boolean {
    const v = this.form.value;
    return !!(v.title?.trim() && v.location?.trim() && v.type && v.startDateTime && v.endDateTime);
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
    this.existingCoverLoaded = false;
    this.coverPreviewUrl = this.sanitizer.bypassSecurityTrustUrl(URL.createObjectURL(file));
  }

  removeCover(): void {
    this.coverFile = null;
    this.coverPreviewUrl = null;
  }

  onSubmit() {
    if (this.form.invalid || this.loading) return;
    this.loading = true;
    this.error = '';
    this.addTag(); // commit any partial input

    const v = this.form.value;
    const payload = {
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

    const coverFile = this.coverFile;
    this.eventsService.updateEvent(this.eventId, payload).pipe(
      switchMap(() => {
        if (!coverFile) return of(null);
        return this.eventsService.uploadCover(this.eventId, coverFile);
      })
    ).subscribe({
      next: () => this.router.navigate(['/events', this.eventId]),
      error: (err) => {
        this.error = err?.error?.detail || 'Failed to save changes. Please try again.';
        this.loading = false;
      }
    });
  }

  private toDatetimeLocal(iso: string): string {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
}
