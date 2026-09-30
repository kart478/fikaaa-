export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly errorCode = 'BAD_REQUEST'
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
