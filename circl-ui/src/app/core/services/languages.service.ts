import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, shareReplay } from 'rxjs/operators';

interface LanguageVM {
  id: number;
  name: string;
}

@Injectable({ providedIn: 'root' })
export class LanguagesService {
  private cache$: Observable<string[]> | null = null;

  constructor(private http: HttpClient) {}

  getAll(): Observable<string[]> {
    if (!this.cache$) {
      this.cache$ = this.http
        .get<LanguageVM[]>('/api/languages')
        .pipe(
          map(langs => langs.map(l => l.name)),
          catchError(() => of([])),
          shareReplay(1)
        );
    }
    return this.cache$;
  }
}
