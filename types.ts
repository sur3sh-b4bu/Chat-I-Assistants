import { User as FirebaseUser } from 'firebase/auth';

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  AUDIO = 'audio',
  AI = 'ai'
}

export interface AppUser {
  uid: string;
  displayName: string | null;
  photoURL: string | null;
  email: string | null;
}

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderName?: string;
  type: MessageType;
  content: string; // Text content or download URL
  timestamp: number;
  status: 'sent' | 'delivered' | 'seen';
}

export interface Chat {
  id: string;
  participants: string[];
  participantDetails?: Record<string, AppUser>; // Cache basic user info
  lastMessage?: string;
  lastMessageTimestamp?: number;
  isAiChat?: boolean;
}
