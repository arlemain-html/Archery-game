import { useQuery } from '@tanstack/react-query';
import { createApiClient } from '@archery/api-client';
import { useAuthStore } from '../stores/auth.store';

const apiClient = createApiClient(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001');

export function useProfile() {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  return useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) throw new Error('No access token');
      
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const response = await apiClient.get('/profile');
      return response.data;
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
