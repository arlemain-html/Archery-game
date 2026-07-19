import { ApiResponse } from '@archery/types';

export const parseResponse = <T>(data: any): ApiResponse<T> => {
  return data as ApiResponse<T>;
};
