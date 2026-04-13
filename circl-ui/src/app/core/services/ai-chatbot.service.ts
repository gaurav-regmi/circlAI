import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

@Injectable({ providedIn: 'root' })
export class AiChatbotService {
  constructor(private http: HttpClient) {}

  chat(eventId: string, message: string, history: ChatTurn[]): Observable<{ reply: string }> {
    return this.http.post<{ reply: string }>('/api/ai/chat', { eventId, message, history });
  }

  generateDescription(data: {
    title: string;
    location: string;
    type: string;
    startDateTime: string;
    endDateTime: string;
    maxCapacity?: number | null;
  }): Observable<{ description: string }> {
    return this.http.post<{ description: string }>('/api/ai/description', data);
  }
}
