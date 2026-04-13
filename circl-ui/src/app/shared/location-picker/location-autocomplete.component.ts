import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

@Component({
  selector: 'app-location-autocomplete',
  standalone: false,
  template: `
    <div class="lac-root">
      <input
        #inputEl
        type="text"
        class="form-control"
        [placeholder]="placeholder"
        [value]="inputValue"
        autocomplete="off"
        (input)="onInput(inputEl.value)"
        (keydown)="onKeydown($event, inputEl)"
        (blur)="onBlur()"
      />

      @if (showDropdown && suggestions.length > 0) {
        <ul class="lac-dropdown">
          @for (s of suggestions; track s.place_id; let i = $index) {
            <li
              class="lac-item"
              [class.lac-item-active]="i === activeIndex"
              (mousedown)="select(s.display_name)">
              <span class="lac-icon">📍</span>
              <span class="lac-text">{{ s.display_name }}</span>
            </li>
          }
        </ul>
      }

      @if (loading) {
        <div class="lac-loading">Searching…</div>
      }
    </div>
  `,
  styles: [`
    .lac-root { position: relative; }

    .lac-dropdown {
      position: absolute;
      top: calc(100% + 4px);
      left: 0; right: 0;
      background: var(--card, #fff);
      border: 1px solid var(--border, #e2e8f0);
      border-radius: 8px;
      box-shadow: 0 4px 16px rgba(0,0,0,.12);
      list-style: none;
      margin: 0; padding: 4px 0;
      z-index: 1000;
      max-height: 260px;
      overflow-y: auto;
    }

    .lac-item {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      padding: 9px 14px;
      cursor: pointer;
      font-size: .85rem;
      line-height: 1.4;
      color: var(--text, #1a202c);
      transition: background .1s;
    }
    .lac-item:hover, .lac-item-active {
      background: var(--hover, rgba(108,99,255,.08));
    }
    .lac-icon { flex-shrink: 0; font-size: .9rem; margin-top: 1px; }
    .lac-text { flex: 1; }

    .lac-loading {
      position: absolute;
      right: 12px; top: 50%;
      transform: translateY(-50%);
      font-size: .75rem;
      color: var(--text-muted, #888);
      pointer-events: none;
    }
  `]
})
export class LocationAutocompleteComponent implements OnInit, OnChanges, OnDestroy {
  @Input() placeholder = 'Search location…';
  @Input() initialValue = '';
  /** Increment this from the parent to clear the input (e.g. on filter reset) */
  @Input() resetKey = 0;

  private lastResetKey = 0;

  /** Fires on every keystroke — keeps parent state in sync as the user types */
  @Output() inputChange = new EventEmitter<string>();
  /** Fires when the user picks a suggestion or presses Enter */
  @Output() selected = new EventEmitter<string>();

  @ViewChild('inputEl') private inputEl!: ElementRef<HTMLInputElement>;

  inputValue = '';
  suggestions: NominatimResult[] = [];
  activeIndex = -1;
  showDropdown = false;
  loading = false;

  private search$ = new Subject<string>();
  private sub = new Subscription();

  constructor(private http: HttpClient) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['initialValue'] && !this.inputValue) {
      this.inputValue = this.initialValue;
    }
    if (changes['resetKey'] && changes['resetKey'].currentValue !== this.lastResetKey) {
      this.lastResetKey = changes['resetKey'].currentValue;
      this.inputValue = '';
      this.suggestions = [];
      this.showDropdown = false;
      if (this.inputEl?.nativeElement) {
        this.inputEl.nativeElement.value = '';
      }
    }
  }

  ngOnInit() {
    this.sub.add(
      this.search$.pipe(
        debounceTime(350),
        distinctUntilChanged(),
        switchMap(q => {
          if (q.length < 2) { this.loading = false; return of([]); }
          this.loading = true;
          return this.http.get<NominatimResult[]>(
            'https://nominatim.openstreetmap.org/search',
            { params: { q, format: 'json', limit: '6', addressdetails: '0' } }
          ).pipe(catchError(() => of([])));
        })
      ).subscribe(results => {
        this.loading = false;
        this.suggestions = results;
        this.activeIndex = -1;
        this.showDropdown = results.length > 0;
      })
    );
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  onInput(val: string) {
    this.inputValue = val;
    this.inputChange.emit(val);
    if (!val.trim()) {
      this.suggestions = [];
      this.showDropdown = false;
      this.loading = false;
    }
    this.search$.next(val.trim());
  }

  onKeydown(event: KeyboardEvent, input: HTMLInputElement) {
    if (!this.showDropdown) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.activeIndex = Math.min(this.activeIndex + 1, this.suggestions.length - 1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.activeIndex = Math.max(this.activeIndex - 1, -1);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (this.activeIndex >= 0 && this.suggestions[this.activeIndex]) {
        this.select(this.suggestions[this.activeIndex].display_name);
      } else {
        this.commit(input.value);
      }
    } else if (event.key === 'Escape') {
      this.close();
    }
  }

  select(displayName: string) {
    this.inputValue = displayName;
    if (this.inputEl?.nativeElement) {
      this.inputEl.nativeElement.value = displayName;
    }
    this.inputChange.emit(displayName);
    this.selected.emit(displayName);
    this.close();
  }

  onBlur() {
    // Small delay so mousedown on a suggestion fires before blur closes the list
    setTimeout(() => {
      this.close();
      const val = this.inputEl?.nativeElement.value.trim() ?? '';
      if (val) this.commit(val);
    }, 150);
  }

  private commit(val: string) {
    if (val && val !== this.inputValue) {
      this.inputValue = val;
      this.inputChange.emit(val);
    }
    this.selected.emit(val);
  }

  private close() {
    this.showDropdown = false;
    this.activeIndex = -1;
  }
}
