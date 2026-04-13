import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { NotificationVM } from '../models';

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private base = '/api/notifications';

  constructor(private http: HttpClient) {}

  getAll(): Observable<NotificationVM[]> {
    return this.http.get<NotificationVM[]>(this.base);
  }

  getUnseen(): Observable<NotificationVM[]> {
    return this.http.get<NotificationVM[]>(`${this.base}/unseen`);
  }

  countUnseen(): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${this.base}/unseen/count`);
  }

  markSeen(id: string): Observable<void> {
    return this.http.put<void>(`${this.base}/${id}/seen`, null);
  }

  markAllSeen(): Observable<void> {
    return this.http.put<void>(`${this.base}/seen`, null);
  }
}
