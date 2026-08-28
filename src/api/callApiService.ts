import apiClient from './client';
import { CallResponseDto } from './types';

/**
 * Service for managing Call Controller API endpoints
 */
export const callApiService = {
  /**
   * Fetch all call logs for the logged-in user
   * GET /api/calls
   * @param type Optional filter by call type (e.g., 'AUDIO', 'VIDEO')
   */
  getAllCalls: async (type?: string): Promise<CallResponseDto[]> => {
    try {
      const url = type ? `/api/calls?type=${encodeURIComponent(type)}` : '/api/calls';
      const response = await apiClient.get<any>(url);
      const raw = response.data;
      if (Array.isArray(raw)) return raw;
      if (raw && Array.isArray(raw.data)) return raw.data;
      if (raw && Array.isArray(raw.content)) return raw.content;
      return [];
    } catch (error: any) {
      console.error('Error fetching all calls from API:', error);
      return [];
    }
  },

  /**
   * Fetch call history with a specific user
   * GET /api/calls/user/{userId}
   * @param userId The ID of the target user
   * @param type Optional filter by call type
   */
  getCallsForUser: async (
    userId: number | string,
    type?: string,
  ): Promise<CallResponseDto[]> => {
    try {
      const url = type
        ? `/api/calls/user/${userId}?type=${encodeURIComponent(type)}`
        : `/api/calls/user/${userId}`;
      const response = await apiClient.get<any>(url);
      const raw = response.data;
      if (Array.isArray(raw)) return raw;
      if (raw && Array.isArray(raw.data)) return raw.data;
      if (raw && Array.isArray(raw.content)) return raw.content;
      return [];
    } catch (error: any) {
      console.error(`Error fetching calls for user ${userId} from API:`, error);
      return [];
    }
  },

  /**
   * Delete all call logs with a specific user
   * DELETE /api/calls/user/{userId}
   * @param userId The ID of the target user
   */
  deleteAllCallsForUser: async (
    userId: number | string,
  ): Promise<string> => {
    try {
      const response = await apiClient.delete<any>(`/api/calls/user/${userId}`);
      return typeof response.data === 'string'
        ? response.data
        : response.data?.statusMsg || response.data?.message || 'Success';
    } catch (error: any) {
      console.error(`Error deleting calls for user ${userId}:`, error);
      throw error;
    }
  },

  /**
   * Delete selected call logs by their IDs
   * DELETE /api/calls/delete
   * @param callIds Array of call IDs (numbers)
   */
  deleteCalls: async (
    callIds: (number | string)[],
  ): Promise<string> => {
    try {
      const numericIds = callIds
        .map(id => Number(id))
        .filter(id => !isNaN(id));
      const response = await apiClient.delete<any>('/api/calls/delete', {
        data: numericIds,
      });
      return typeof response.data === 'string'
        ? response.data
        : response.data?.statusMsg || response.data?.message || 'Success';
    } catch (error: any) {
      console.error('Error deleting call records:', error);
      throw error;
    }
  },
};

export default callApiService;
