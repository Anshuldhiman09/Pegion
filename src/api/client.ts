import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '@env';

const cleanBaseUrl = (BASE_URL )
  .trim()
  .replace(/\/+$/, '');

export const apiClient = axios.create({
  baseURL: cleanBaseUrl,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    Accept: '*/*',
    'ngrok-skip-browser-warning': 'true',
  },
});

// Request interceptor to automatically add Authorization token
apiClient.interceptors.request.use(
  async config => {
    try {
      const url = config.url || '';
      const isPublicAuthEndpoint =
        url.includes('/api/auth/') ||
        url.includes('/send-otp') ||
        url.includes('/verify-otp') ||
        url.includes('/login') ||
        url.includes('/register');

      if (!isPublicAuthEndpoint) {
        const rawToken =
          (await AsyncStorage.getItem('auth_token')) ||
          (await AsyncStorage.getItem('authToken'));
        if (rawToken && rawToken.trim()) {
          const clean = rawToken.trim();
          const bearer = clean.startsWith('Bearer ') ? clean : `Bearer ${clean}`;

          if (config.headers) {
            config.headers.Authorization = bearer;
            if (typeof config.headers.set === 'function') {
              config.headers.set('Authorization', bearer);
            }
          }
        }
      }
    } catch (e) {
      console.log('Error reading auth token from storage:', e);
    }
    return config;
  },
  error => Promise.reject(error),
);

// Response interceptor for unified response handling
apiClient.interceptors.response.use(
  response => response,
  async error => {
    const status = error.response?.status;
    const url = error.config?.url || '';

    // Auto-clear stale token if forbidden or unauthorized on protected routes
    if ((status === 401 || status === 403) && !url.includes('/api/auth/')) {
      try {
        await AsyncStorage.multiRemove([
          'auth_token',
          'authToken',
          'auth_email',
          'userId',
        ]);
      } catch (e) {}
    }

    const errorMsg =
      error.response?.data?.statusMsg ||
      error.response?.data?.message ||
      error.message ||
      'Network request failed';
    const customError: any = new Error(errorMsg);
    customError.response = error.response;
    customError.statusCodes =
      error.response?.data?.statusCodes || error.response?.status;
    customError.statusMsg = error.response?.data?.statusMsg;
    return Promise.reject(customError);
  },
);

export default apiClient;
