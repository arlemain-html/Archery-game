import axios from 'axios';
import { attachInterceptors } from './interceptor';

export const createApiClient = (baseURL: string) => {
  const client = axios.create({ baseURL });
  attachInterceptors(client);
  return client;
};
