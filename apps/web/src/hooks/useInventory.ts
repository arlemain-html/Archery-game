import { useQuery } from '@tanstack/react-query';
import { createApiClient } from '@archery/api-client';
import { useAuthStore } from '../stores/auth.store';

const apiClient = createApiClient(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001');

export function useInventory() {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  return useQuery({
    queryKey: ['inventory'],
    queryFn: async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) throw new Error('No access token');
      
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      // Assuming a GET /profile route also returns inventory or there is a specific /inventory route
      const response = await apiClient.get('/profile');
      return response.data.inventory || [];
    },
    enabled: isAuthenticated,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}
