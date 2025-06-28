export const WelcomePageState = {
  Banner: 'Banner',
  Login: 'Login',
} as const;

export const LOGIN_ERROR = {
  UNABLE_TO_CONNECT: 'unable_to_connect',
  GENERIC: 'generic',
  SESSION_EXPIRED: 'session_expired',
} as const;

export type LoginErrorType = (typeof LOGIN_ERROR)[keyof typeof LOGIN_ERROR];
