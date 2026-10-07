import { it } from '@jest/globals';
import { selectBrazeBannerHomeEnabled } from './braze';

describe('selectBrazeBannerHomeEnabled', () => {
  it.each([
    [null, false],
    [false, false],
    [{ enabled: false, minimumVersion: '0.0.0' }, false],
    [{ enabled: true, minimumVersion: '9999.0.0' }, false],
    [{ enabled: true, minimumVersion: '0.0.0' }, true],
    [{ value: { enabled: true, minimumVersion: '0.0.0' } }, true],
  ])('evaluates rollout %j as %s', (flag, expected) => {
    expect(
      selectBrazeBannerHomeEnabled({
        metamask: { remoteFeatureFlags: { brazeBannerHomeMinVersion: flag } },
      }),
    ).toBe(expected);
  });
});
