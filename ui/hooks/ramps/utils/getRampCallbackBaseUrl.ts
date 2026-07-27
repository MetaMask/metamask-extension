const RAMP_CALLBACK_URL_PRODUCTION =
  'https://on-ramp-content.api.cx.metamask.io/regions/fake-callback';
const RAMP_CALLBACK_URL_STAGING =
  'https://on-ramp-content.uat-api.cx.metamask.io/regions/fake-callback';

export function getRampCallbackBaseUrl(): string {
  const env = process.env.METAMASK_ENVIRONMENT;
  switch (env) {
    case 'production':
    case 'beta':
    case 'rc':
      return RAMP_CALLBACK_URL_PRODUCTION;
    default:
      return RAMP_CALLBACK_URL_STAGING;
  }
}
