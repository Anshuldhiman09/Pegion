// src/services/ChatSocketService.ts

import SocketService from './SocketService';

export interface ReplyMessagePayload {
  id: number | string;
  senderId: number | string;
  senderName: string;
  content: string;
  mediaUrl?: string | null;
  mediaType?: string | null;
}

export interface ChatMessagePayload {
  id?: number | string;
  senderId: number | string;
  receiverId?: number | string;
  content: string;
  createdAt?: string;
  isRead?: boolean;
  mediaUrl?: string | null;
  mediaType?: string | null;
  replyTo?: ReplyMessagePayload | null;
  replyToMessageId?: number | string | null;
}

export type MessageCallback = (
  message: ChatMessagePayload,
) => void;

export type TypingCallback = (
  sender: string | number,
) => void;

export type ErrorCallback = (
  error: string,
) => void;

export type ConnectCallback = () => void;

export type ReadCallback = (data: any) => void;

export interface ChatThemePayload {
  bg: string | null;
  bubble: string | null;
  pattern: boolean;
  themeName?: string;
  senderId?: string | number;
  receiverId?: string | number;
}

export type ThemeCallback = (theme: ChatThemePayload) => void;

class ChatSocketService {
  private messageHandler: ((...args: any[]) => void) | null = null;
  private typingHandler: ((...args: any[]) => void) | null = null;
  private errorHandler: ((...args: any[]) => void) | null = null;
  private connectHandler: (() => void) | null = null;
  private readHandler: ((...args: any[]) => void) | null = null;
  private themeHandler: ((...args: any[]) => void) | null = null;

  /**
   * Receives ALL socket events and detects chat messages.
   */
  private handleAnySocketEvent(
    event: string,
    args: any[],
    onMessage: MessageCallback,
    onRead?: ReadCallback,
    onTheme?: ThemeCallback,
  ): void {
    console.log(`[ChatSocket] Incoming event "${event}":`, args);

    if (!args || args.length === 0) {
      return;
    }

    let data = args[0];

    // Sometimes Socket.IO receives JSON string
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch {
        // Not a JSON string
      }
    }

    // Handle read receipt events
    if (event === 'chat.read' || event === 'read' || event === 'messages.read') {
      if (onRead) {
        onRead(data);
      }
      return;
    }

    // Handle theme update events
    if (event === 'chat.theme' || event === 'theme' || event === 'theme.update') {
      if (onTheme && data) {
        onTheme({
          bg: data.bg ?? null,
          bubble: data.bubble ?? null,
          pattern: Boolean(data.pattern),
          themeName: data.themeName,
          senderId: data.senderId,
          receiverId: data.receiverId,
        });
      }
      return;
    }

    // Handle typing events
    if (
      event === 'chat.typing' ||
      event === 'typing' ||
      event === 'user.typing' ||
      event === 'user_typing' ||
      event === 'typing.start'
    ) {
      if (data) {
        let val: any = data;
        if (typeof data === 'object') {
          val =
            data.senderId ??
            data.userId ??
            data.id ??
            data.sender ??
            data.from ??
            data.sender_id ??
            data.email ??
            data.username;
        }
        if (val !== undefined && val !== null) {
          // Trigger typing callback if handler exists
          if (this.typingHandler) {
            this.typingHandler(val);
          }
        }
      }
      return;
    }

    if (!data || typeof data !== 'object') {
      return;
    }

    // Unwrap if wrapped in message or data envelope
    let raw: any = data;
    if (data.message && typeof data.message === 'object') {
      raw = data.message;
    } else if (data.data && typeof data.data === 'object') {
      raw = data.data;
    }

    const senderId =
      raw.senderId ?? raw.sender_id ?? raw.sender ?? raw.from ?? raw.userId;
    const content =
      raw.content ?? raw.message ?? raw.text ?? raw.msg;

    if (senderId === undefined || senderId === null || content === undefined || content === null) {
      return;
    }

    const receiverId =
      raw.receiverId ?? raw.receiver_id ?? raw.receiver ?? raw.to ?? raw.targetId;

    const strContent = String(content);

    // If message is a __THEME_CHANGE__ payload, trigger onTheme
    if (strContent.startsWith('__THEME_CHANGE__:')) {
      try {
        const themeJson = JSON.parse(strContent.slice('__THEME_CHANGE__:'.length));
        if (onTheme) {
          onTheme({
            ...themeJson,
            senderId,
            receiverId,
          });
        }
      } catch (e) {
        console.warn('Failed to parse theme change json:', e);
      }
    }

    const parsed: ChatMessagePayload = {
      id: raw.id ?? raw.messageId ?? raw._id,
      senderId,
      receiverId: receiverId !== undefined && receiverId !== null ? receiverId : undefined,
      content: strContent,
      createdAt: raw.createdAt ?? raw.created_at ?? raw.timestamp ?? raw.time ?? new Date().toISOString(),
      isRead: raw.isRead ?? raw.read ?? raw.is_read ?? false,
      mediaUrl: raw.mediaUrl ?? raw.media_url ?? null,
      mediaType: raw.mediaType ?? raw.media_type ?? null,
      replyTo: raw.replyTo ?? raw.reply_to ?? null,
      replyToMessageId: raw.replyToMessageId ?? raw.reply_to_message_id ?? null,
    };

    console.log('🔥 [ChatSocket] REAL-TIME MESSAGE PARSED:', parsed);
    onMessage(parsed);
  }

  async connect(
    onConnect?: ConnectCallback,
    onMessage?: MessageCallback,
    onTyping?: TypingCallback,
    onError?: ErrorCallback,
    onRead?: ReadCallback,
    onTheme?: ThemeCallback,
  ): Promise<void> {
    // Remove previous ChatScreen listeners first
    this.detachListeners();

    const socket = await SocketService.connect();
    console.log('[ChatSocket] Socket ready:', socket.id);

    // CONNECT
    if (onConnect) {
      this.connectHandler = () => {
        console.log('[ChatSocket] Connected');
        onConnect();
      };
      SocketService.on('connect', this.connectHandler);
      if (SocketService.isConnected) {
        onConnect();
      }
    }

    // MESSAGE (Listen via onAny + explicit events)
    if (onMessage) {
      this.messageHandler = (event: string, ...args: any[]) => {
        this.handleAnySocketEvent(event, args, onMessage, onRead, onTheme);
      };
      socket.onAny(this.messageHandler);

      // Also register direct listeners for common events
      const directMsgHandler = (data: any) => {
        this.handleAnySocketEvent('messages', [data], onMessage, onRead, onTheme);
      };
      SocketService.on('messages', directMsgHandler);
      SocketService.on('message', directMsgHandler);
      SocketService.on('chat.send', directMsgHandler);
      SocketService.on('chat.receive', directMsgHandler);
    }

    // READ RECEIPTS
    if (onRead) {
      this.readHandler = (data: any) => {
        console.log('[ChatSocket] Read event received:', data);
        onRead(data);
      };
      SocketService.on('chat.read', this.readHandler);
      SocketService.on('read', this.readHandler);
      SocketService.on('messages.read', this.readHandler);
    }

    // THEME SYNC EVENT
    if (onTheme) {
      this.themeHandler = (data: any) => {
        console.log('[ChatSocket] Theme event received:', data);
        if (data) {
          onTheme({
            bg: data.bg ?? null,
            bubble: data.bubble ?? null,
            pattern: Boolean(data.pattern),
            themeName: data.themeName,
            senderId: data.senderId,
            receiverId: data.receiverId,
          });
        }
      };
      SocketService.on('chat.theme', this.themeHandler);
      SocketService.on('theme', this.themeHandler);
      SocketService.on('theme.update', this.themeHandler);
    }

    // TYPING
    if (onTyping) {
      this.typingHandler = (sender: any) => {
        console.log('[ChatSocket] Typing event:', sender);
        let value = sender;
        if (sender && typeof sender === 'object') {
          value =
            sender.senderId ??
            sender.userId ??
            sender.id ??
            sender.sender ??
            sender.email;
        }
        if (value !== undefined && value !== null) {
          onTyping(value);
        }
      };
      SocketService.on('typing', this.typingHandler);
      SocketService.on('chat.typing', this.typingHandler);
    }

    // ERRORS
    if (onError) {
      this.errorHandler = (errMsg: any) => {
        const formatted =
          typeof errMsg === 'object' ? JSON.stringify(errMsg) : String(errMsg);
        if (
          formatted.includes('java.util.Map') ||
          formatted.includes('NullPointer') ||
          formatted.includes('Cannot invoke')
        ) {
          return;
        }
        console.warn('[ChatSocket] Server error:', errMsg);
        onError(formatted);
      };
      SocketService.on('errors', this.errorHandler);
      SocketService.on('error', this.errorHandler);
    }
  }

  /**
   * Send text/media message (chat.send)
   */
  sendMessage(
    receiverId: number | string,
    content: string,
    replyToMessageId?: number | string | null,
    mediaUrl?: string | null,
    mediaType?: string | null,
  ): boolean {
    console.log('[ChatSocket] Emitting chat.send to receiver:', receiverId, {
      content,
      replyToMessageId,
    });
    const payload: any = {
      receiverId,
      content,
    };
    if (replyToMessageId) {
      payload.replyToMessageId = replyToMessageId;
    }
    if (mediaUrl) {
      payload.mediaUrl = mediaUrl;
    }
    if (mediaType) {
      payload.mediaType = mediaType;
    }
    return SocketService.emit('chat.send', payload);
  }

  /**
   * Broadcast theme change to peer (chat.theme + message sync)
   */
  sendTheme(
    receiverId: number | string,
    payload: {
      bg: string | null;
      bubble: string | null;
      pattern: boolean;
      themeName?: string;
    },
  ): boolean {
    console.log('[ChatSocket] Emitting chat.theme to receiver:', receiverId, payload);
    SocketService.emit('chat.theme', {
      receiverId,
      ...payload,
    });
    // Also emit as __THEME_CHANGE__ chat message so it persists in history and syncs across all socket bridges
    return this.sendMessage(
      receiverId,
      `__THEME_CHANGE__:${JSON.stringify(payload)}`,
    );
  }

  /**
   * Send typing event (chat.typing & typing)
   */
  sendTyping(receiverId: number | string): boolean {
    console.log('[ChatSocket] Emitting typing for receiver:', receiverId);
    SocketService.emit('typing', {
      receiverId,
      targetId: receiverId,
      to: receiverId,
      userId: receiverId,
    });
    return SocketService.emit('chat.typing', {
      receiverId,
      targetId: receiverId,
      to: receiverId,
      userId: receiverId,
    });
  }

  private lastReadEmitTime: { [receiverId: string]: number } = {};

  /**
   * Send read event (chat.read) with debounce/throttle to avoid spam
   */
  sendRead(receiverId: number | string): boolean {
    const key = String(receiverId);
    const now = Date.now();
    if (this.lastReadEmitTime[key] && now - this.lastReadEmitTime[key] < 2000) {
      return false; // Throttled: already emitted within 2s
    }
    this.lastReadEmitTime[key] = now;
    console.log('[ChatSocket] Emitting chat.read for receiver:', receiverId);
    return SocketService.emit('chat.read', {
      receiverId: Number(receiverId) || receiverId,
      targetId: Number(receiverId) || receiverId,
      to: Number(receiverId) || receiverId,
      userId: Number(receiverId) || receiverId,
    });
  }

  /**
   * Remove ONLY ChatSocketService listeners.
   */
  detachListeners(): void {
    if (this.connectHandler) {
      SocketService.off('connect', this.connectHandler);
    }
    if (this.messageHandler) {
      SocketService.offAny(this.messageHandler);
      SocketService.off('messages');
      SocketService.off('message');
      SocketService.off('chat.send');
      SocketService.off('chat.receive');
    }
    if (this.readHandler) {
      SocketService.off('chat.read', this.readHandler);
      SocketService.off('read', this.readHandler);
      SocketService.off('messages.read', this.readHandler);
    }
    if (this.themeHandler) {
      SocketService.off('chat.theme', this.themeHandler);
      SocketService.off('theme', this.themeHandler);
      SocketService.off('theme.update', this.themeHandler);
    }
    if (this.typingHandler) {
      SocketService.off('typing', this.typingHandler);
      SocketService.off('chat.typing', this.typingHandler);
    }
    if (this.errorHandler) {
      SocketService.off('errors', this.errorHandler);
      SocketService.off('error', this.errorHandler);
    }

    this.connectHandler = null;
    this.messageHandler = null;
    this.readHandler = null;
    this.themeHandler = null;
    this.typingHandler = null;
    this.errorHandler = null;
  }

  get isConnected(): boolean {
    return SocketService.isConnected;
  }
}

const ChatSocketServiceInstance = new ChatSocketService();
export default ChatSocketServiceInstance;