export const DEFAULT_CENTRIFUGE_URL =
  'wss://mfa-relayer.dev-api.cx.metamask.io/connection/websocket';
export const DEFAULT_SERVER_URL = 'https://mpc-service.dev-api.cx.metamask.io';

export const SERVER_PARTY_ID = '1';
export const CLIENT_PARTY_ID = '2';
export const NEW_PARTY_ID = '3';

// Dev JWT private key for local Centrifugo testing
export const DEV_JWT_PRIVATE_KEY = `-----BEGIN EC PRIVATE KEY-----
MHcCAQEEILuv/+8PmLm/8kMmpqUub7QN1YtYfXPlUWxQtwSW3o3doAoGCCqGSM49
AwEHoUQDQgAEMvF6XHUtlANVAIFXy16lKL6aFI/tDuIOPSEIaRGghfHmBiyYDw6Q
HkErhTiEr3CgwhgwuoHQ5FeXXGAhKQYoCA==
-----END EC PRIVATE KEY-----`;

export const PARTY_LABELS: Record<string, string> = {
  '1': 'Server',
  '2': 'Extension',
  '3': 'Mobile',
};
