import apiClient from './client';
import {
  ApiResponse,
  PageableResponse,
  ConnectionRequestItem,
  ConnectionRequestAction,
  SearchUserItem,
} from './types';

export const connectionService = {
  // Send connection request
  sendConnectionRequest: async (
    recieverEmail: string,
  ): Promise<ApiResponse<string>> => {
    const response = await apiClient.post<ApiResponse<string>>(
      `/api/usr/connection/send-req?revieverEmail=${encodeURIComponent(
        recieverEmail.trim(),
      )}`,
      {},
    );
    return response.data;
  },

  // Get received connection requests
  getReceivedRequests: async (
    page: number = 0,
    size: number = 10,
  ): Promise<ApiResponse<PageableResponse<ConnectionRequestItem>>> => {
    const response = await apiClient.get<
      ApiResponse<PageableResponse<ConnectionRequestItem>>
    >(
      `/api/usr/connection/recieved-connection-req-list?page=${page}&size=${size}`,
    );
    return response.data;
  },

  // Get sent connection requests
  getSentRequests: async (
    page: number = 0,
    size: number = 10,
  ): Promise<ApiResponse<PageableResponse<ConnectionRequestItem>>> => {
    const response = await apiClient.get<
      ApiResponse<PageableResponse<ConnectionRequestItem>>
    >(`/api/usr/connection/sent-connection-req-list?page=${page}&size=${size}`);
    return response.data;
  },

  // Accept or Reject a connection request
  respondToConnectionRequest: async (
    reqId: number | string,
    status: ConnectionRequestAction,
  ): Promise<ApiResponse<string>> => {
    const response = await apiClient.post<ApiResponse<string>>(
      `/api/usr/connection/connection-req-action?reqId=${reqId}&status=${status}`,
      {},
    );
    return response.data;
  },

  // Get all connected users for a user ID
  getConnectedUsers: async (
    userId: number | string,
    page: number = 0,
    size: number = 10,
  ): Promise<ApiResponse<PageableResponse<SearchUserItem>>> => {
    const response = await apiClient.get<
      ApiResponse<PageableResponse<SearchUserItem>>
    >(`/api/usr/connection/${userId}/connections?page=${page}&size=${size}`);
    return response.data;
  },
};

export default connectionService;
