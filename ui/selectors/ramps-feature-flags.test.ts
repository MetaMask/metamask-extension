import {
  getIsRampsEnabled,
  getIsRampsServiceDisruptionActive,
} from './ramps-feature-flags';

const mk = (flags = {}) => ({ metamask: { remoteFeatureFlags: flags } });

describe('ramps feature-flag selectors', () => {
  it('getIsRampsEnabled defaults to false', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(getIsRampsEnabled(mk() as any)).toBe(false);
  });
  it('getIsRampsEnabled reads the flag', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(getIsRampsEnabled(mk({ rampsEnabled: true }) as any)).toBe(true);
  });
  it('getIsRampsEnabled reads a version-gated flag', () => {
    expect(
      getIsRampsEnabled(
        mk({
          rampsEnabled: { enabled: true, minimumVersion: '0.0.0' },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }) as any,
      ),
    ).toBe(true);
  });
  it('getIsRampsEnabled is false when the minimum version is not met', () => {
    expect(
      getIsRampsEnabled(
        mk({
          rampsEnabled: { enabled: true, minimumVersion: '9999.0.0' },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }) as any,
      ),
    ).toBe(false);
  });
  it('getIsRampsEnabled reads a progressive rollout wrapped flag', () => {
    expect(
      getIsRampsEnabled(
        mk({
          rampsEnabled: {
            name: 'rollout',
            value: { enabled: true, minimumVersion: '0.0.0' },
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }) as any,
      ),
    ).toBe(true);
  });
  it('getIsRampsServiceDisruptionActive defaults to false', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(getIsRampsServiceDisruptionActive(mk() as any)).toBe(false);
  });
  it('getIsRampsServiceDisruptionActive reads the flag', () => {
    expect(
      getIsRampsServiceDisruptionActive(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mk({ rampsServiceDisruption: true }) as any,
      ),
    ).toBe(true);
  });
});
