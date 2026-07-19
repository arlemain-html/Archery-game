import { AxiosInstance } from 'axios';

export const attachInterceptors = (client: AxiosInstance) => {
  client.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  });

  client.interceptors.response.use(
    (response) => response,
    (error) => {
      // Handle global errors
      return Promise.reject(error);
    }
  );
};
