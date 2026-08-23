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
  error => {
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
