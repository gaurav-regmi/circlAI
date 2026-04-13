import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PersonSuggestionVM, UserProfile, UserPublicProfileVM } from '../models';

export interface UserLookup {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

@Injectable({ providedIn: 'root' })
export class UsersService {
  constructor(private http: HttpClient) {}

  lookupByEmail(email: string): Observable<UserLookup> {
    return this.http.get<UserLookup>('/api/users/lookup', { params: { email } });
  }

  getProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>('/api/users/profile');
  }

  updateProfile(data: Omit<UserProfile, 'userId' | 'hasPicture'>): Observable<UserProfile> {
    return this.http.put<UserProfile>('/api/users/profile', data);
  }

  uploadPicture(file: File): Observable<void> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<void>('/api/users/profile/picture', form);
  }

  pictureUrl(userId: string): string {
    return `/api/users/profile/picture/${userId}`;
  }

  getPublicProfile(userId: string): Observable<UserPublicProfileVM> {
    return this.http.get<UserPublicProfileVM>(`/api/users/${userId}/public-profile`);
  }

  getSuggestions(page = 0, size = 20): Observable<PersonSuggestionVM[]> {
    return this.http.get<PersonSuggestionVM[]>('/api/people/suggestions', { params: { page, size } });
  }

  getEventAttendees(eventId: string): Observable<PersonSuggestionVM[]> {
    return this.http.get<PersonSuggestionVM[]>(`/api/people/events/${eventId}`);
  }
}
