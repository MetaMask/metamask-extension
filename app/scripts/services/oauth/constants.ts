export const OAUTH_CONFIG: Record<string, Record<string, string>> = {
  development: {
    GOOGLE_AUTH_CONNECTION_ID: 'mm-google-dev-extension',
    APPLE_AUTH_CONNECTION_ID: 'mm-apple-dev-common',
    GOOGLE_GROUPED_AUTH_CONNECTION_ID: 'mm-google-dev',
    APPLE_GROUPED_AUTH_CONNECTION_ID: 'mm-apple-dev',
    AUTH_SERVER_URL: 'https://auth-service.dev-api.cx.metamask.io',
    WEB3AUTH_NETWORK: 'sapphire_devnet',
  },
  main: {
    GOOGLE_AUTH_CONNECTION_ID: 'mm-google-main-extension',
    APPLE_AUTH_CONNECTION_ID: 'mm-apple-main-common',
    GOOGLE_GROUPED_AUTH_CONNECTION_ID: 'mm-google-main',
    APPLE_GROUPED_AUTH_CONNECTION_ID: 'mm-apple-main',
    AUTH_SERVER_URL: 'https://auth-service.api.cx.metamask.io',
    WEB3AUTH_NETWORK: 'sapphire_mainnet',
  },
  beta: {
    GOOGLE_AUTH_CONNECTION_ID: 'mm-google-main-extension',
    APPLE_AUTH_CONNECTION_ID: 'mm-apple-main-common',
    GOOGLE_GROUPED_AUTH_CONNECTION_ID: 'mm-google-main',
    APPLE_GROUPED_AUTH_CONNECTION_ID: 'mm-apple-main',
    AUTH_SERVER_URL: 'https://auth-service.api.cx.metamask.io',
    WEB3AUTH_NETWORK: 'sapphire_mainnet',
  },
  flask: {
    GOOGLE_AUTH_CONNECTION_ID: 'mm-google-flask-main-extension',
    APPLE_AUTH_CONNECTION_ID: 'mm-apple-flask-main-common',
    GOOGLE_GROUPED_AUTH_CONNECTION_ID: 'mm-google-flask-main',
    APPLE_GROUPED_AUTH_CONNECTION_ID: 'mm-apple-flask-main',
    AUTH_SERVER_URL: 'https://auth-service.api.cx.metamask.io',
    WEB3AUTH_NETWORK: 'sapphire_mainnet',
  },
};
