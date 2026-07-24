import { getRampCallbackBaseUrl } from './getRampCallbackBaseUrl';

describe('getRampCallbackBaseUrl', () => {
  const originalEnv = process.env.METAMASK_ENVIRONMENT;

  afterEach(() => {
    process.env.METAMASK_ENVIRONMENT = originalEnv;
  });

  it('returns the production URL for METAMASK_ENVIRONMENT=production', () => {
    process.env.METAMASK_ENVIRONMENT = 'production';
    expect(getRampCallbackBaseUrl()).toBe(
      'https://on-ramp-content.api.cx.metamask.io/regions/fake-callback',
    );
  });

  it('returns the development URL for METAMASK_ENVIRONMENT=development', () => {
    process.env.METAMASK_ENVIRONMENT = 'development';
    expect(getRampCallbackBaseUrl()).toBe(
      'https://on-ramp-content.dev-api.cx.metamask.io/regions/fake-callback',
    );
  });

  it('returns the staging URL when METAMASK_ENVIRONMENT is unset', () => {
    delete process.env.METAMASK_ENVIRONMENT;
    expect(getRampCallbackBaseUrl()).toBe(
      'https://on-ramp-content.uat-api.cx.metamask.io/regions/fake-callback',
    );
  });
});
