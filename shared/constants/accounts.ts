export const ACCOUNTS_DEV_API_BASE_URL =
  'https://accounts.dev-api.cx.metamask.io';
export const ACCOUNTS_PROD_API_BASE_URL = 'https://accounts.api.cx.metamask.io';
export const ACCOUNTS_API_BASE_URL = process.env.ACCOUNTS_USE_DEV_APIS
  ? ACCOUNTS_DEV_API_BASE_URL
  : ACCOUNTS_PROD_API_BASE_URL;

export enum AttemptExportState {
  None = 'None',
  PrivateKey = 'PrivateKey',
  SRP = 'SRP',
}
