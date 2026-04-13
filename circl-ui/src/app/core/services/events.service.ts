import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CouponVM, EventFilters, EventVM, PageResult, RegistrationVM } from '../models';

@Injectable({ providedIn: 'root' })
export class EventsService {
  constructor(private http: HttpClient) {}

  getEvents(page = 0, size = 12, filters?: EventFilters): Observable<PageResult<EventVM>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (filters?.search?.trim()) params = params.set('search', filters.search.trim());
    if (filters?.type) params = params.set('type', filters.type);
    if (filters?.startFrom) params = params.set('startFrom', filters.startFrom);
    if (filters?.startTo) params = params.set('startTo', filters.startTo);
    if (filters?.location?.trim()) params = params.set('location', filters.location.trim());
    return this.http.get<PageResult<EventVM>>('/api/events', { params });
  }

  getEvent(id: string): Observable<EventVM> {
    return this.http.get<EventVM>(`/api/events/${id}`);
  }

  createEvent(data: {
    title: string;
    description?: string;
    location: string;
    type: string;
    startDateTime: string;
    endDateTime: string;
    maxCapacity?: number | null;
  }): Observable<EventVM> {
    return this.http.post<EventVM>('/api/events', data);
  }

  updateEvent(id: string, data: {
    title: string;
    description?: string;
    location: string;
    type: string;
    startDateTime: string;
    endDateTime: string;
    maxCapacity?: number | null;
  }): Observable<EventVM> {
    return this.http.patch<EventVM>(`/api/events/${id}`, data);
  }

  publishEvent(id: string): Observable<EventVM> {
    return this.http.post<EventVM>(`/api/events/${id}/publish`, null);
  }

  cancelEvent(id: string): Observable<EventVM> {
    return this.http.post<EventVM>(`/api/events/${id}/cancel`, null);
  }

  getMyEvents(): Observable<EventVM[]> {
    return this.http.get<EventVM[]>('/api/events/my-events');
  }

  registerForEvent(eventId: string, couponCode?: string): Observable<RegistrationVM> {
    const body = couponCode ? { couponCode } : {};
    return this.http.post<RegistrationVM>(`/api/events/${eventId}/register`, body);
  }

  getMyRegistrations(): Observable<RegistrationVM[]> {
    return this.http.get<RegistrationVM[]>('/api/events/my-registrations');
  }

  getRegistrations(eventId: string): Observable<RegistrationVM[]> {
    return this.http.get<RegistrationVM[]>(`/api/events/${eventId}/registrations`);
  }

  generateCouponCode(eventId: string): Observable<{ code: string }> {
    return this.http.get<{ code: string }>(`/api/events/${eventId}/coupons/generate`);
  }

  createCoupon(
    eventId: string,
    data: { code: string; maxUses?: number | null; expiresAt?: string | null }
  ): Observable<CouponVM> {
    return this.http.post<CouponVM>(`/api/events/${eventId}/coupons`, data);
  }

  getCoupons(eventId: string): Observable<CouponVM[]> {
    return this.http.get<CouponVM[]>(`/api/events/${eventId}/coupons`);
  }

  coverUrl(eventId: string): string {
    return `/api/events/${eventId}/cover`;
  }

  uploadCover(eventId: string, file: File): Observable<void> {
    const fd = new FormData();
    fd.append('file', file);
    return this.http.post<void>(`/api/events/${eventId}/cover`, fd);
  }
}
