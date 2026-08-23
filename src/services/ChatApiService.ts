import apiClient from '../api/client';
import { PageableResponse } from '../api/types';
import { ChatMessagePayload } from './ChatSocketService';

export interface ChatHistoryResponse extends PageableResponse<ChatMessagePayload> {}

export interface ConversationResponseItem {
  otherUserId: number;
  otherUserName: string;
  otherUserProfileImage: string | null;
  lastMessage: string;
  lastMessageTime: string;
  lastMessageIsMine: boolean;
  lastMessageIsRead: boolean;
  unreadCount: number;
}

/**
 * Fetch list of conversations for logged-in user
 * GET /api/chat/conversations
 */
export const getConversations = async (): Promise<ConversationResponseItem[]> => {
  try {
    const response = await apiClient.get<any>(
      '/api/chat/conversations',
    );
    const raw = response.data;
    console.log('GET /api/chat/conversations response:', raw);
    if (Array.isArray(raw)) return raw;
    if (raw && Array.isArray(raw.data)) return raw.data;
    if (raw && Array.isArray(raw.content)) return raw.content;
    return [];
  } catch (error: any) {
    console.error('Error fetching conversations from API:', error);
    return [];
  }
};

/**
 * Fetch total unread conversations count
 * GET /api/chat/conversations/unread-count
 */
export const getUnreadCount = async (): Promise<number> => {
  try {
    const response = await apiClient.get<any>(
      '/api/chat/conversations/unread-count',
    );
    const raw = response.data;
    if (typeof raw === 'number') return raw;
    if (raw && typeof raw.data === 'number') return raw.data;
    return Number(raw?.data ?? raw) || 0;
  } catch (error: any) {
    console.error('Error fetching unread count from API:', error);
    return 0;
  }
};


/**
 * Fetch paginated chat history between logged in user and another user
 * GET /api/chat/history/{otherUserId}?page={page}&size={size}
 */
export const getChatHistory = async (
  otherUserId: number | string,
  page: number = 0,
  size: number = 20,
): Promise<ChatHistoryResponse> => {
  try {
    const response = await apiClient.get<ChatHistoryResponse>(
      `/api/chat/history/${otherUserId}?page=${page}&size=${size}`,
    );
    return response.data;
  } catch (error: any) {
    console.error('Error fetching chat history from API:', error);
    throw error;
  }
};

/**
 * Mark messages from other user as read
 * POST /api/chat/read/{otherUserId}
 */
export const markMessagesRead = async (
  otherUserId: number | string,
): Promise<any> => {
  try {
    const response = await apiClient.post(`/api/chat/read/${otherUserId}`, {});
    return response.data;
  } catch (_error: any) {
    console.error('Error marking messages as read:', _error);
    return null;
  }
};

export default {
  getConversations,
  getUnreadCount,
  getChatHistory,
  markMessagesRead,
};

