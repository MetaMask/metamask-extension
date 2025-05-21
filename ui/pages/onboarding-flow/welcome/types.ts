export const LOGIN_TYPE = {
  GOOGLE: 'google',
  APPLE: 'apple',
  SRP: 'srp',
} as const;

export type LoginType = (typeof LOGIN_TYPE)[keyof typeof LOGIN_TYPE];

export const LOGIN_OPTION = {
  NEW: 'new',
  EXISTING: 'existing',
} as const;

export type LoginOptionType = (typeof LOGIN_OPTION)[keyof typeof LOGIN_OPTION];

export const WelcomePageState = {
  Banner: 'Banner',
  Login: 'Login',
} as const;
