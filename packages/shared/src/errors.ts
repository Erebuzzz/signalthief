export class AppError extends Error {
  constructor(
    public readonly kind: string,
    message: string,
    public readonly retryable = false,
    public readonly statusCode = 500,
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super('validation', message, false, 400);
  }
}

export class LocalDeviceAuthError extends AppError {
  constructor(message = 'Local device authorization failed') {
    super('local-device-auth', message, false, 401);
  }
}
