export class ApiClientError extends Error {
  constructor(public code: string, message: string) {
    super(message);
    this.name = 'ApiClientError';
  }
}
