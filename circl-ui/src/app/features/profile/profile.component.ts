import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { UsersService } from '../../core/services/users.service';
import { AuthService } from '../../core/services/auth.service';
import { LanguagesService } from '../../core/services/languages.service';
import { UserProfile } from '../../core/models';

const INTEREST_OPTIONS = [
  'Technology', 'Music', 'Art', 'Sports', 'Food & Drink',
  'Travel', 'Business', 'Health & Fitness', 'Gaming', 'Photography'
];

@Component({
  selector: 'app-profile',
  standalone: false,
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">My Profile</h1>
          <p class="page-subtitle">Personalise your event discovery experience</p>
        </div>
      </div>

      @if (loading) {
        <div class="spinner-wrap"><div class="spinner"></div></div>
      } @else {
        <div style="max-width:600px">
          @if (successMsg) { <div class="alert alert-success" style="margin-bottom:16px">{{ successMsg }}</div> }
          @if (errorMsg)   { <div class="alert alert-error"   style="margin-bottom:16px">{{ errorMsg }}</div> }

          <!-- Picture card -->
          <div class="card" style="padding:24px;margin-bottom:16px">
            <p class="card-section-label">Profile Picture</p>
            <div style="display:flex;align-items:center;gap:20px">
              <div class="profile-avatar-wrap" (click)="fileInput.click()" title="Click to change picture">
                @if (previewUrl) {
                  <img [src]="previewUrl" class="profile-avatar-img" alt="Profile picture" />
                } @else {
                  <div class="profile-avatar-initials">{{ initials }}</div>
                }
                <div class="profile-avatar-overlay">📷</div>
              </div>
              <div>
                <p style="font-size:.85rem;font-weight:500">{{ hasPicture ? 'Change picture' : 'Add a profile picture' }}</p>
                <p class="text-xs text-muted" style="margin-top:3px">JPG, PNG or WebP · Max 5 MB</p>
                @if (uploadLoading) {
                  <p class="text-xs" style="margin-top:6px;color:var(--primary)">Uploading…</p>
                }
                @if (uploadError) {
                  <p class="text-xs" style="margin-top:6px;color:var(--danger,#e53e3e)">{{ uploadError }}</p>
                }
              </div>
            </div>
            <input #fileInput type="file" accept="image/*" style="display:none"
              (change)="onFileSelected($event)" />
          </div>

          <!-- Preferences card -->
          <div class="card" style="padding:24px;display:flex;flex-direction:column;gap:24px">
            <p class="card-section-label" style="margin-bottom:-8px">Event Preferences</p>

            <div class="form-group">
              <label class="form-label">Bio</label>
              <textarea class="form-control" [(ngModel)]="bio" rows="3"
                placeholder="Tell us a little about yourself…"></textarea>
            </div>

            <div class="form-group">
              <label class="form-label">Preferred Location</label>
              <input type="text" class="form-control" [(ngModel)]="preferredLocation"
                placeholder="e.g. New York, London, Remote…" />
              <p class="text-xs text-muted" style="margin-top:4px">Used as the default location filter when browsing events.</p>
            </div>

            <div class="form-group">
              <label class="form-label">Preferred Event Type</label>
              <select class="form-control" [(ngModel)]="preferredEventType">
                <option value="">No preference</option>
                <option value="PUBLIC">Public</option>
                <option value="PRIVATE">Private</option>
                <option value="ANY">Any</option>
              </select>
            </div>

            <!-- Divider -->
            <hr style="border:none;border-top:1px solid var(--border);margin:0" />
            <p class="card-section-label" style="margin-bottom:-8px">About You</p>

            <!-- Languages -->
            <div class="form-group">
              <label class="form-label">Languages</label>
              <div class="tag-input-box" (click)="langInputEl.focus()">
                @for (tag of languageTags; track tag) {
                  <span class="tag">
                    {{ tag }}
                    <button class="tag-remove" (click)="removeLanguage(tag); $event.stopPropagation()">×</button>
                  </span>
                }
                <div style="position:relative;flex:1;min-width:140px">
                  <input #langInputEl type="text" class="tag-bare-input"
                    [(ngModel)]="langInput"
                    (keydown.enter)="addLanguage($event)"
                    (keydown.backspace)="onLangBackspace()"
                    (input)="onLangInput()"
                    (blur)="hideLangSuggestions()"
                    [placeholder]="languageTags.length === 0 ? 'Type a language and press Enter…' : ''" />
                  @if (langSuggestions.length > 0) {
                    <div class="suggestions-drop">
                      @for (s of langSuggestions; track s) {
                        <div class="suggestion-row" (mousedown)="selectLangSuggestion(s)">{{ s }}</div>
                      }
                    </div>
                  }
                </div>
              </div>
              <p class="text-xs text-muted" style="margin-top:6px">Press Enter to add. Click × to remove.</p>
            </div>

            <!-- Interests -->
            <div class="form-group">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
                <label class="form-label" style="margin-bottom:0">Interests</label>
                <span class="count-pill" [class.count-pill-low]="interestCount < 3">
                  {{ interestCount }} selected{{ interestCount < 3 ? ' (Select at least 3)' : '' }}
                </span>
              </div>

              @if (interestError) {
                <div class="field-error" style="margin-bottom:8px">Please select at least 3 interests.</div>
              }

              <div class="chips-grid">
                @for (opt of interestOptions; track opt) {
                  <button type="button" class="chip"
                    [class.chip-on]="isPredefinedSelected(opt)"
                    (click)="togglePredefined(opt)">
                    {{ opt }}
                  </button>
                }
              </div>

              <!-- Custom interest input -->
              <div style="margin-top:12px">
                <p class="text-xs text-muted" style="margin-bottom:6px">Or add a custom interest:</p>
                <div class="tag-input-box" (click)="customInterestEl.focus()">
                  @for (tag of customInterests; track tag) {
                    <span class="tag tag-accent">
                      {{ tag }}
                      <button class="tag-remove" (click)="removeCustomInterest(tag); $event.stopPropagation()">×</button>
                    </span>
                  }
                  <input #customInterestEl type="text" class="tag-bare-input"
                    [(ngModel)]="customInterestInput"
                    (keydown.enter)="addCustomInterest($event)"
                    placeholder="Type and press Enter…" />
                </div>
              </div>
            </div>

            <div style="display:flex;justify-content:flex-end">
              <button class="btn btn-primary" (click)="save()" [disabled]="saving">
                {{ saving ? 'Saving…' : 'Save Preferences' }}
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .card-section-label {
      font-size: .75rem; font-weight: 700; color: var(--text-muted);
      text-transform: uppercase; letter-spacing: .06em; margin-bottom: 0;
    }

    /* Avatar */
    .profile-avatar-wrap {
      position: relative; width: 80px; height: 80px;
      border-radius: 50%; cursor: pointer; flex-shrink: 0; overflow: hidden;
      border: 2px solid var(--border);
    }
    .profile-avatar-wrap:hover .profile-avatar-overlay { opacity: 1; }
    .profile-avatar-img { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; display: block; }
    .profile-avatar-initials {
      width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;
      background: var(--primary); color: #fff; font-weight: 700; font-size: 1.6rem; border-radius: 50%;
    }
    .profile-avatar-overlay {
      position: absolute; inset: 0; background: rgba(0,0,0,.45);
      display: flex; align-items: center; justify-content: center;
      font-size: 1.4rem; opacity: 0; transition: opacity .2s; border-radius: 50%;
    }

    /* Tag display (keyword-style) */
    .tag-list { display: flex; flex-wrap: wrap; gap: 6px; }
    .tag {
      display: inline-flex; align-items: center; gap: 4px;
      background: var(--surface-2); border: 1px solid var(--border);
      border-radius: 999px; padding: 3px 10px; font-size: .8rem; color: var(--text);
    }
    .tag-accent {
      background: rgba(108,99,255,.12); border-color: rgba(108,99,255,.3);
      color: var(--primary, #6C63FF);
    }
    .tag-remove {
      background: none; border: none; cursor: pointer; font-size: .9rem;
      color: var(--text-muted); padding: 0; line-height: 1; margin-left: 2px;
    }
    .tag-remove:hover { color: var(--danger, #e53e3e); }

    /* Tag input box (inline tag+input) */
    .tag-input-box {
      display: flex; flex-wrap: wrap; align-items: center; gap: 6px;
      min-height: 42px; padding: 6px 12px;
      border: 1px solid var(--border); border-radius: 8px;
      background: var(--surface); cursor: text;
      transition: border-color .15s;
    }
    .tag-input-box:focus-within { border-color: var(--primary, #6C63FF); box-shadow: 0 0 0 3px rgba(108,99,255,.08); }
    .tag-bare-input {
      border: none; outline: none; background: transparent;
      font-size: .875rem; flex: 1; min-width: 120px; color: var(--text);
      padding: 0;
    }
    .tag-bare-input::placeholder { color: var(--text-muted); }
    .tag-bare-input:disabled { cursor: not-allowed; }

    /* Suggestions */
    .suggestions-drop {
      position: absolute; top: calc(100% + 4px); left: 0; right: 0; min-width: 180px;
      background: var(--surface); border: 1px solid var(--border);
      border-radius: 8px; box-shadow: 0 6px 20px rgba(0,0,0,.12);
      z-index: 200; max-height: 180px; overflow-y: auto;
    }
    .suggestion-row {
      padding: 9px 14px; font-size: .875rem; cursor: pointer; color: var(--text);
    }
    .suggestion-row:hover { background: var(--surface-2); }

    /* Interests chips */
    .chips-grid { display: flex; flex-wrap: wrap; gap: 8px; }
    .chip {
      padding: 6px 16px; border-radius: 999px; font-size: .8rem; font-weight: 500;
      border: 1.5px solid var(--border); background: var(--surface); color: var(--text);
      cursor: pointer; transition: all .15s; white-space: nowrap;
    }
    .chip:hover:not(:disabled):not(.chip-on) {
      border-color: var(--primary, #6C63FF); color: var(--primary, #6C63FF);
      background: rgba(108,99,255,.06);
    }
    .chip-on {
      background: var(--primary, #6C63FF); color: #fff;
      border-color: var(--primary, #6C63FF);
    }

    /* Counter pill */
    .count-pill {
      font-size: .72rem; font-weight: 600; padding: 2px 9px; border-radius: 999px;
      background: rgba(108,99,255,.1); color: var(--primary, #6C63FF);
      border: 1px solid rgba(108,99,255,.2);
    }
    .count-pill-low {
      background: rgba(229,62,62,.1); color: var(--danger, #e53e3e);
      border-color: rgba(229,62,62,.25);
    }

    /* Error */
    .field-error { font-size: .75rem; color: var(--danger, #e53e3e); }
  `]
})
export class ProfileComponent implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('langInputEl') langInputEl!: ElementRef<HTMLInputElement>;
  @ViewChild('customInterestEl') customInterestEl!: ElementRef<HTMLInputElement>;

  readonly interestOptions = INTEREST_OPTIONS;

  loading = true;
  saving = false;
  uploadLoading = false;
  successMsg = '';
  errorMsg = '';
  uploadError = '';

  // Basic prefs
  bio = '';
  preferredLocation = '';
  preferredEventType = '';

  // Languages
  languageTags: string[] = [];
  langInput = '';
  langSuggestions: string[] = [];
  private allLanguages: string[] = [];

  // Interests (predefined + custom, max 3 total)
  predefinedSelected = new Set<string>();
  customInterests: string[] = [];
  customInterestInput = '';
  interestError = false;

  hasPicture = false;
  previewUrl: string | null = null;
  private userId: string | null = null;

  constructor(
    private usersService: UsersService,
    private authService: AuthService,
    private languagesService: LanguagesService
  ) {}

  ngOnInit() {
    this.userId = this.authService.getUserId();
    this.languagesService.getAll().subscribe(langs => { this.allLanguages = langs; });
    this.usersService.getProfile().subscribe({
      next: (p) => {
        this.bio = p.bio ?? '';
        this.preferredLocation = p.preferredLocation ?? '';
        this.preferredEventType = p.preferredEventType ?? '';
        this.languageTags = p.languages ?? [];

        // Split loaded interests into predefined vs custom
        const loaded = p.interests ?? [];
        this.predefinedSelected = new Set(loaded.filter(i => INTEREST_OPTIONS.includes(i)));
        this.customInterests = loaded.filter(i => !INTEREST_OPTIONS.includes(i));

        this.hasPicture = p.hasPicture;
        if (p.hasPicture && this.userId) {
          this.previewUrl = this.usersService.pictureUrl(this.userId) + '?t=' + Date.now();
        }
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  get initials(): string {
    const user = this.authService.getCurrentUser();
    if (!user) return '?';
    return `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase();
  }

  // ── Languages ───────────────────────────────────────────────────────────

  onLangInput() {
    const val = this.langInput.trim().toLowerCase();
    if (!val) { this.langSuggestions = []; return; }
    this.langSuggestions = this.allLanguages
      .filter(l => l.toLowerCase().startsWith(val) && !this.languageTags.includes(l))
      .slice(0, 6);
  }

  addLanguage(event: Event) {
    event.preventDefault();
    const val = this.langInput.trim();
    if (!val) return;
    const match = this.allLanguages.find(l => l.toLowerCase() === val.toLowerCase());
    const tag = match ?? this.capitalise(val);
    if (!this.languageTags.includes(tag)) {
      this.languageTags = [...this.languageTags, tag];
    }
    this.langInput = '';
    this.langSuggestions = [];
  }

  selectLangSuggestion(lang: string) {
    if (!this.languageTags.includes(lang)) {
      this.languageTags = [...this.languageTags, lang];
    }
    this.langInput = '';
    this.langSuggestions = [];
  }

  onLangBackspace() {
    if (!this.langInput && this.languageTags.length > 0) {
      this.languageTags = this.languageTags.slice(0, -1);
    }
  }

  hideLangSuggestions() {
    setTimeout(() => { this.langSuggestions = []; }, 150);
  }

  removeLanguage(tag: string) {
    this.languageTags = this.languageTags.filter(l => l !== tag);
  }

  // ── Interests ───────────────────────────────────────────────────────────

  get interestCount(): number {
    return this.predefinedSelected.size + this.customInterests.length;
  }

  isPredefinedSelected(opt: string): boolean {
    return this.predefinedSelected.has(opt);
  }

  togglePredefined(opt: string) {
    if (this.predefinedSelected.has(opt)) {
      this.predefinedSelected.delete(opt);
      this.predefinedSelected = new Set(this.predefinedSelected);
    } else {
      this.predefinedSelected = new Set([...this.predefinedSelected, opt]);
    }
    if (this.interestCount >= 3) this.interestError = false;
  }

  addCustomInterest(event: Event) {
    event.preventDefault();
    const val = this.capitalise(this.customInterestInput.trim());
    if (!val) return;
    if (!this.customInterests.includes(val) && !this.predefinedSelected.has(val)) {
      this.customInterests = [...this.customInterests, val];
    }
    this.customInterestInput = '';
    if (this.interestCount >= 3) this.interestError = false;
  }

  removeCustomInterest(tag: string) {
    this.customInterests = this.customInterests.filter(i => i !== tag);
    this.interestError = false;
  }

  // ── Picture ─────────────────────────────────────────────────────────────

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { this.uploadError = 'Only image files are allowed.'; return; }
    if (file.size > 5 * 1024 * 1024) { this.uploadError = 'Image must be smaller than 5 MB.'; return; }

    const reader = new FileReader();
    reader.onload = (e) => { this.previewUrl = e.target?.result as string; };
    reader.readAsDataURL(file);

    this.uploadError = '';
    this.uploadLoading = true;
    this.usersService.uploadPicture(file).subscribe({
      next: () => {
        this.hasPicture = true;
        this.uploadLoading = false;
        if (this.userId) this.previewUrl = this.usersService.pictureUrl(this.userId) + '?t=' + Date.now();
      },
      error: (err) => { this.uploadError = err?.error?.detail || 'Upload failed.'; this.uploadLoading = false; }
    });
    input.value = '';
  }

  // ── Save ────────────────────────────────────────────────────────────────

  save() {
    if (this.interestCount < 3) { this.interestError = true; return; }
    this.saving = true;
    this.successMsg = '';
    this.errorMsg = '';

    this.usersService.updateProfile({
      bio: this.bio || null,
      preferredLocation: this.preferredLocation || null,
      preferredEventType: (this.preferredEventType || null) as UserProfile['preferredEventType'],
      keywords: [],
      languages: this.languageTags,
      interests: [...this.predefinedSelected, ...this.customInterests]
    }).subscribe({
      next: () => {
        this.saving = false;
        this.successMsg = 'Preferences saved!';
        setTimeout(() => this.successMsg = '', 3000);
      },
      error: (err) => {
        this.saving = false;
        this.errorMsg = err?.error?.detail || 'Failed to save preferences.';
      }
    });
  }

  private capitalise(s: string): string {
    if (!s) return s;
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
}
