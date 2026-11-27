import { afterEach, describe, expect, it, jest } from '@jest/globals';

describe('PREINSTALLED_SNAPS_URLS', () => {
  const originalEnv = process.env;

  afterEach(() => {
    process.env = originalEnv;
    jest.resetModules();
  });

  it('omits @metamask/braze-snap when Braze config is missing', async () => {
    process.env = { ...originalEnv };
    delete process.env.IN_TEST;
    delete process.env.BRAZE_WEB_API_KEY;
    delete process.env.BRAZE_SDK_ENDPOINT;
    jest.resetModules();

    const { PREINSTALLED_SNAPS_URLS } = await import('./snaps');

    expect(
      PREINSTALLED_SNAPS_URLS.some((url) => url.href.includes('braze-snap')),
    ).toBe(false);
  });

  it('omits @metamask/braze-snap in test builds even when Braze keys are present', async () => {
    process.env = {
      ...originalEnv,
      IN_TEST: 'true',
      BRAZE_WEB_API_KEY: 'key',
      BRAZE_SDK_ENDPOINT: 'sdk.iad-01.braze.com',
    };
    jest.resetModules();

    const { PREINSTALLED_SNAPS_URLS } = await import('./snaps');

    expect(
      PREINSTALLED_SNAPS_URLS.some((url) => url.href.includes('braze-snap')),
    ).toBe(false);
  });

  it('includes @metamask/braze-snap in configured non-test builds', async () => {
    process.env = {
      ...originalEnv,
      BRAZE_WEB_API_KEY: 'key',
      BRAZE_SDK_ENDPOINT: 'sdk.iad-01.braze.com',
    };
    delete process.env.IN_TEST;
    jest.resetModules();

    const { PREINSTALLED_SNAPS_URLS } = await import('./snaps');

    expect(
      PREINSTALLED_SNAPS_URLS.some((url) => url.href.includes('braze-snap')),
    ).toBe(true);
  });
});
