import apiClient from './client';
import { ApiResponse, VerifyOtpData } from './types';

export const authService = {
  sendOtp: async (email: string): Promise<ApiResponse<null>> => {
    const response = await apiClient.post<ApiResponse<null>>(
      `/api/auth/send-otp?email=${encodeURIComponent(email.trim())}`,
    );
    return response.data;
  },

  verifyOtp: async (
    email: string,
    otp: string,
  ): Promise<ApiResponse<VerifyOtpData>> => {
    const response = await apiClient.post<ApiResponse<VerifyOtpData>>(
      `/api/auth/verify-otp?email=${encodeURIComponent(
        email.trim(),
      )}&otp=${encodeURIComponent(otp.trim())}`,
    );
    return response.data;
  },
};

export default authService;
