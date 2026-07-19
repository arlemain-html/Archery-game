import { withRetry } from '@archery/utils';

export const retryRequest = <T>(requestFn: () => Promise<T>) => {
  return withRetry(requestFn);
};
