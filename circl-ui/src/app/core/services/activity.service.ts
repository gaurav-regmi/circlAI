import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ActivityVM, PageResult } from '../models';

@Injectable({ providedIn: 'root' })
export class ActivityService {
  constructor(private http: HttpClient) {}

  getActivities(page = 0, size = 20): Observable<PageResult<ActivityVM>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<PageResult<ActivityVM>>('/api/activities', { params });
  }

  getEventActivities(eventId: string): Observable<ActivityVM[]> {
    return this.http.get<ActivityVM[]>(`/api/activities/event/${eventId}`);
  }

  checkIn(activityId: string): Observable<ActivityVM> {
    return this.http.post<ActivityVM>(`/api/activities/${activityId}/check-in`, null);
  }

  updateAttendance(activityId: string, status: string): Observable<ActivityVM> {
    return this.http.patch<ActivityVM>(`/api/activities/${activityId}/status`, { status });
  }
}
