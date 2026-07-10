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
  it('getIsRampsServiceDisruptionActive defaults to false', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(getIsRampsServiceDisruptionActive(mk() as any)).toBe(false);
  });
  it('getIsRampsServiceDisruptionActive reads the flag', () => {
    expect(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      getIsRampsServiceDisruptionActive(
        mk({ rampsServiceDisruption: true }) as any,
      ),
    ).toBe(true);
  });
});
