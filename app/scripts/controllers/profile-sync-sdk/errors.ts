export class NonceRetrievalError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NonceRetrievalError';
  }
}

export class SignInError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SignInError';
  }
}

export class UserStorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UserStorageError';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class UnsupportedAuthTypeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnsupportedAuthTypeError';
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
      super(message);
      this.name = 'NotFoundError';
  }
}
