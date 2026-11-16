import { it } from '@jest/globals';
import { getIsBrazeBannerHomeEnabled } from './braze';

const stateWithFlag = (flag: unknown) => ({
  metamask: { remoteFeatureFlags: { brazeBannerHomeMinVersion: flag } },
});

describe('getIsBrazeBannerHomeEnabled', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      BRAZE_WEB_API_KEY: 'test-key',
      BRAZE_SDK_ENDPOINT: 'sdk.example.com',
    };
    delete process.env.IN_TEST;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it.each([
    [null, false],
    [false, false],
    [{ enabled: false, minimumVersion: '0.0.0' }, false],
    [{ enabled: true, minimumVersion: '9999.0.0' }, false],
    [{ enabled: true, minimumVersion: '0.0.0' }, true],
    [{ value: { enabled: true, minimumVersion: '0.0.0' } }, true],
  ])('evaluates the rollout %j as %s', (flag, expected) => {
    expect(getIsBrazeBannerHomeEnabled(stateWithFlag(flag) as never)).toBe(
      expected,
    );
  });

  it('is false in builds without Braze configuration', () => {
    delete process.env.BRAZE_WEB_API_KEY;

    expect(
      getIsBrazeBannerHomeEnabled(
        stateWithFlag({ enabled: true, minimumVersion: '0.0.0' }) as never,
      ),
    ).toBe(false);
  });
});
