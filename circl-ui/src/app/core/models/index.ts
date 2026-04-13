export type UserRole = 'ADMIN' | 'EVENT_ORGANIZER' | 'EVENT_ORGANIZER_MEMBER' | 'USER';
export type EventType = 'PUBLIC' | 'PRIVATE';
export type EventStatus = 'DRAFT' | 'PUBLISHED' | 'CANCELLED' | 'COMPLETED';
export type ParkingType = 'FREE' | 'PAID' | 'NOT_AVAILABLE';
export type RegistrationStatus = 'REGISTERED' | 'CANCELLED';
export type AttendanceStatus = 'REGISTERED' | 'ATTENDED' | 'NO_SHOW';
export type ChatRoomType = 'EVENT_GROUP' | 'SUB_GROUP' | 'DIRECT';
export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED';
export type MemberRole = 'ADMIN' | 'MEMBER';

export interface AuthResponse {
  token: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

export interface EventVM {
  id: string;
  title: string;
  description: string;
  location: string | null;
  type: EventType;
  status: EventStatus;
  startDateTime: string;
  endDateTime: string;
  organizerId: string;
  maxCapacity: number | null;
  parking: ParkingType | null;
  interests: string[];
}

export interface PageResult<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface RegistrationVM {
  id: string;
  eventId: string;
  userId: string;
  status: RegistrationStatus;
  registeredAt: string;
}

export interface CouponVM {
  id: string;
  eventId: string;
  code: string;
  maxUses: number | null;
  usedCount: number;
  expiresAt: string | null;
  active: boolean;
}

export interface ChatRoomVM {
  id: string;
  name: string;
  type: ChatRoomType;
  eventId: string | null;
  parentChatRoomId: string | null;
  createdBy: string;
  createdAt: string;
}

export interface MessageVM {
  id: string;
  chatRoomId: string;
  senderId: string;
  senderName: string;
  content: string | null;
  sentAt: string;
  fileKey: string | null;
  fileName: string | null;
  fileSize: number | null;
  fileContentType: string | null;
}

export interface ChatMemberVM {
  userId: string;
  userName: string;
  role: MemberRole;
  joinedAt: string;
}

export interface ChatInvitationVM {
  id: string;
  chatRoomId: string;
  chatRoomName: string;
  invitedByUserId: string;
  status: InvitationStatus;
  createdAt: string;
}

export interface ActivityVM {
  id: string;
  userId: string;
  eventId: string;
  eventTitle: string;
  eventType: EventType;
  attendanceStatus: AttendanceStatus;
  registeredAt: string;
  eventStatus: EventStatus;
  totalRegistrations: number;
}

export interface UserProfile {
  userId: string;
  bio: string | null;
  preferredLocation: string | null;
  preferredEventType: 'PUBLIC' | 'PRIVATE' | 'ANY' | null;
  keywords: string[];
  languages: string[];
  interests: string[];
  hasPicture: boolean;
}

export interface UserPublicProfileVM {
  userId: string;
  firstName: string;
  lastName: string;
  bio: string | null;
  location: string | null;
  interests: string[];
  hasPicture: boolean;
}

export type DirectChatRequestStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED';

export interface DirectChatRequestVM {
  id: string;
  senderId: string;
  senderFirstName: string;
  senderLastName: string;
  senderHasPicture: boolean;
  receiverId: string;
  receiverFirstName: string;
  receiverLastName: string;
  receiverHasPicture: boolean;
  status: DirectChatRequestStatus;
  chatRoomId: string | null;
}

export interface PersonSuggestionVM {
  userId: string;
  firstName: string;
  lastName: string;
  bio: string | null;
  location: string | null;
  interests: string[];
  sharedEventsCount: number;
  sharedInterestsCount: number;
  hasPicture: boolean;
}

export interface EventFilters {
  search?: string;
  type?: string;
  startFrom?: string;
  startTo?: string;
  location?: string;
}

export type NotificationType = 'EVENT_REGISTRATION' | 'CHAT_MESSAGE' | 'EVENT_CANCELLED' | 'EVENT_CREATED' | 'CHAT_REQUEST' | 'CHAT_REQUEST_ACCEPTED';

export interface NotificationVM {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  referenceId: string | null;
  seen: boolean;
  createdAt: string;
}
