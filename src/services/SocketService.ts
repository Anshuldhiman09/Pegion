// src/services/SocketService.ts

import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WEB_SOCKET_URI } from '@env';

const cleanBaseUrl = WEB_SOCKET_URI.trim().replace(/\/+$/, '');

class SocketService {
  private socket: Socket | null = null;
  private isConnectingState = false;
  private connectPromise: Promise<Socket> | null = null;
  private currentToken: string | null = null;

  private listeners: Map<string, Set<(...args: any[]) => void>> = new Map();
  private anyListeners: Set<(event: string, ...args: any[]) => void> = new Set();

  async connect(forceReconnect: boolean = false): Promise<Socket> {
    const storedToken =
      (await AsyncStorage.getItem('auth_token')) ||
      (await AsyncStorage.getItem('authToken'));

    const cleanToken = storedToken
      ? storedToken.replace(/^Bearer\s+/i, '').trim()
      : '';

    // If token changed or forced reconnect requested, disconnect previous socket first
    if (forceReconnect || (this.currentToken !== null && this.currentToken !== cleanToken)) {
      console.log('[Socket] Auth token changed or forceReconnect requested. Resetting socket connection.');
      this.disconnect();
    }

    // Already connected with the same token
    if (this.socket?.connected) {
      return this.socket;
    }

    // Connection already in progress
    if (this.connectPromise) {
      return this.connectPromise;
    }

    this.connectPromise = new Promise(async (resolve, reject) => {
      try {
        this.isConnectingState = true;
        this.currentToken = cleanToken;

        const bearerToken = cleanToken ? `Bearer ${cleanToken}` : '';

        console.log('[Socket] Connecting to:', cleanBaseUrl, 'Token present:', Boolean(cleanToken));

        const socket = io(cleanBaseUrl, {
          transports: ['websocket'],
          auth: {
            token: bearerToken,
            authToken: cleanToken,
          },
          query: {
            token: cleanToken,
            auth: bearerToken,
          },
          extraHeaders: {
            Authorization: bearerToken,
          },
          reconnection: true,
          reconnectionAttempts: Infinity,
          reconnectionDelay: 2000,
          reconnectionDelayMax: 10000,
          timeout: 15000,
          forceNew: true,
        });

        this.socket = socket;

        // Re-attach all registered listeners
        this.listeners.forEach((handlers, event) => {
          handlers.forEach(handler => {
            socket.on(event, handler);
          });
        });
        this.anyListeners.forEach(handler => {
          socket.onAny(handler);
        });

        // --------------------------------------------------
        // DEBUG: Shows EVERY event coming from Socket.IO
        // --------------------------------------------------
        socket.onAny((event, ...args) => {
          console.log(
            `[Socket] EVENT "${event}"`,
            JSON.stringify(args),
          );
        });

        socket.on('connect', () => {
          this.isConnectingState = false;

          console.log(
            '[Socket] Connected:',
            socket.id,
          );

          resolve(socket);
        });

        socket.on('connect_error', error => {
          this.isConnectingState = false;

          console.warn(
            '[Socket] connect_error:',
            error?.message || error,
          );

          reject(error);
        });

        socket.on('disconnect', reason => {
          this.isConnectingState = false;

          console.log(
            '[Socket] Disconnected:',
            reason,
          );
        });

        socket.io.on('reconnect_attempt', attempt => {
          console.log(
            '[Socket] Reconnect attempt:',
            attempt,
          );
        });

        socket.io.on('reconnect', attempt => {
          console.log(
            '[Socket] Reconnected after attempt:',
            attempt,
          );
        });

        socket.io.on('reconnect_error', error => {
          console.warn(
            '[Socket] Reconnect error:',
            error?.message || error,
          );
        });

      } catch (error) {
        this.isConnectingState = false;
        reject(error);
      }
    });

    try {
      return await this.connectPromise;
    } finally {
      this.connectPromise = null;
    }
  }

  on(
    event: string,
    handler: (...args: any[]) => void,
  ): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);

    if (this.socket) {
      this.socket.on(event, handler);
    }
  }

  off(
    event: string,
    handler?: (...args: any[]) => void,
  ): void {
    if (typeof handler === 'function') {
      this.listeners.get(event)?.delete(handler);
      if (this.listeners.get(event)?.size === 0) {
        this.listeners.delete(event);
      }
      try {
        this.socket?.off(event, handler);
      } catch (e) {}
    } else {
      this.listeners.delete(event);
      try {
        this.socket?.off(event);
      } catch (e) {}
    }
  }

  /**
   * Listen to ALL Socket.IO events.
   */
  onAny(
    handler: (event: string, ...args: any[]) => void,
  ): void {
    if (typeof handler === 'function') {
      this.anyListeners.add(handler);
      try {
        this.socket?.onAny(handler);
      } catch (e) {}
    }
  }

  offAny(
    handler?: (event: string, ...args: any[]) => void,
  ): void {
    if (typeof handler === 'function') {
      this.anyListeners.delete(handler);
      try {
        this.socket?.offAny(handler);
      } catch (e) {}
    }
  }

  emit(
    event: string,
    payload: any,
  ): boolean {
    if (!this.socket?.connected) {
      console.warn(
        `[Socket] Cannot emit "${event}" - socket not connected`,
      );

      return false;
    }

    console.log(
      `[Socket] EMIT "${event}"`,
      payload,
    );

    this.socket.emit(event, payload);

    return true;
  }

  disconnect(): void {
    if (this.socket) {
      console.log('[Socket] Disconnecting...');

      this.socket.removeAllListeners();
      this.socket.disconnect();

      this.socket = null;
    }

    this.currentToken = null;
    this.isConnectingState = false;
    this.connectPromise = null;
  }

  get isConnected(): boolean {
    return !!this.socket?.connected;
  }

  get socketId(): string | undefined {
    return this.socket?.id;
  }
}

const SocketServiceInstance = new SocketService();

export default SocketServiceInstance;