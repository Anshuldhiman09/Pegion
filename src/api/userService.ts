import apiClient from './client';
import {
  ApiResponse,
  ProfileData,
  SetupProfilePayload,
  PageableResponse,
  SearchUserItem,
} from './types';

export const userService = {
  getProfileInfo: async (email?: string): Promise<ApiResponse<ProfileData>> => {
    const url =
      email && email.trim()
        ? `/api/prfl/profile-info?email=${encodeURIComponent(email.trim())}`
        : '/api/prfl/profile-info';
    const response = await apiClient.get<ApiResponse<ProfileData>>(url);
    return response.data;
  },

  getUserById: async (
    id: number | string,
  ): Promise<ApiResponse<ProfileData>> => {
    const response = await apiClient.get<ApiResponse<ProfileData>>(
      `/api/usr/${id}`,
    );
    return response.data;
  },

  saveUsername: async (newUsername: string): Promise<ApiResponse<string>> => {
    const response = await apiClient.patch<ApiResponse<string>>(
      `/api/prfl/save-username?newUsername=${encodeURIComponent(
        newUsername.trim(),
      )}`,
      {},
    );
    return response.data;
  },

  setupProfile: async (
    payload: SetupProfilePayload,
  ): Promise<ApiResponse<null>> => {
    const response = await apiClient.patch<ApiResponse<null>>(
      '/api/prfl/setup-profile',
      payload,
    );
    return response.data;
  },

  updateProfile: async (
    payload: SetupProfilePayload,
  ): Promise<ApiResponse<null>> => {
    const response = await apiClient.patch<ApiResponse<null>>(
      '/api/prfl/update-profile',
      payload,
    );
    return response.data;
  },

  updateProfilePhoto: async (imageUrl: string): Promise<ApiResponse<null>> => {
    const response = await apiClient.patch<ApiResponse<null>>(
      `/api/prfl/profile-photo?dpUrl=${encodeURIComponent(imageUrl)}`,
      {},
    );
    return response.data;
  },

  searchUsers: async (
    keyword: string,
    page: number = 0,
    size: number = 10,
  ): Promise<ApiResponse<PageableResponse<SearchUserItem>>> => {
    const response = await apiClient.get<
      ApiResponse<PageableResponse<SearchUserItem>>
    >(
      `/api/usr/search?keyword=${encodeURIComponent(
        keyword.trim(),
      )}&page=${page}&size=${size}`,
    );
    return response.data;
  },
};

export default userService;
