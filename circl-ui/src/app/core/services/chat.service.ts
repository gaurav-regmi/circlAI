import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ChatInvitationVM, ChatMemberVM, ChatRoomVM, DirectChatRequestVM, MessageVM, PageResult } from '../models';

@Injectable({ providedIn: 'root' })
export class ChatService {
  constructor(private http: HttpClient) {}

  getRooms(): Observable<ChatRoomVM[]> {
    return this.http.get<ChatRoomVM[]>('/api/chat/rooms');
  }

  getRoom(id: string): Observable<ChatRoomVM> {
    return this.http.get<ChatRoomVM>(`/api/chat/rooms/${id}`);
  }

  getMessages(roomId: string, page = 0, size = 50): Observable<PageResult<MessageVM>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<PageResult<MessageVM>>(`/api/chat/rooms/${roomId}/messages`, { params });
  }

  sendMessage(roomId: string, content: string): Observable<MessageVM> {
    return this.http.post<MessageVM>(`/api/chat/rooms/${roomId}/messages`, { content });
  }

  getMembers(roomId: string): Observable<ChatMemberVM[]> {
    return this.http.get<ChatMemberVM[]>(`/api/chat/rooms/${roomId}/members`);
  }

  getInvitations(): Observable<ChatInvitationVM[]> {
    return this.http.get<ChatInvitationVM[]>('/api/chat/invitations');
  }

  acceptInvitation(id: string): Observable<ChatInvitationVM> {
    return this.http.post<ChatInvitationVM>(`/api/chat/invitations/${id}/accept`, null);
  }

  declineInvitation(id: string): Observable<ChatInvitationVM> {
    return this.http.post<ChatInvitationVM>(`/api/chat/invitations/${id}/decline`, null);
  }

  inviteUser(roomId: string, userId: string): Observable<ChatInvitationVM> {
    return this.http.post<ChatInvitationVM>(`/api/chat/rooms/${roomId}/invitations`, { userId });
  }

  addMember(roomId: string, userId: string): Observable<ChatMemberVM> {
    return this.http.post<ChatMemberVM>(`/api/chat/rooms/${roomId}/members`, { userId });
  }

  leaveRoom(roomId: string): Observable<void> {
    return this.http.delete<void>(`/api/chat/rooms/${roomId}/members/me`);
  }

  createSubGroup(roomId: string, name: string): Observable<ChatRoomVM> {
    return this.http.post<ChatRoomVM>(`/api/chat/rooms/${roomId}/sub-groups`, { name });
  }

  sendDirectChatRequest(targetUserId: string): Observable<DirectChatRequestVM> {
    return this.http.post<DirectChatRequestVM>('/api/chat/direct-requests', { targetUserId });
  }

  getIncomingChatRequests(): Observable<DirectChatRequestVM[]> {
    return this.http.get<DirectChatRequestVM[]>('/api/chat/direct-requests/incoming');
  }

  getOutgoingChatRequests(): Observable<DirectChatRequestVM[]> {
    return this.http.get<DirectChatRequestVM[]>('/api/chat/direct-requests/outgoing');
  }

  acceptDirectRequest(requestId: string): Observable<DirectChatRequestVM> {
    return this.http.post<DirectChatRequestVM>(`/api/chat/direct-requests/${requestId}/accept`, null);
  }

  declineDirectRequest(requestId: string): Observable<DirectChatRequestVM> {
    return this.http.post<DirectChatRequestVM>(`/api/chat/direct-requests/${requestId}/decline`, null);
  }

  cancelDirectRequest(requestId: string): Observable<void> {
    return this.http.delete<void>(`/api/chat/direct-requests/${requestId}`);
  }

  getConnectionStatus(targetUserId: string): Observable<DirectChatRequestVM | null> {
    return this.http.get<DirectChatRequestVM | null>(
      `/api/chat/direct-requests/connection-status/${targetUserId}`
    );
  }

  uploadFile(roomId: string, file: File): Observable<MessageVM> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<MessageVM>(`/api/chat/rooms/${roomId}/files`, formData);
  }

  getFileUrl(roomId: string, messageId: string): Observable<{ url: string }> {
    return this.http.get<{ url: string }>(`/api/chat/rooms/${roomId}/messages/${messageId}/file-url`);
  }
}
