import {
  getIsRampsEnabled,
  getIsRampsServiceDisruptionActive,
} from './ramps-feature-flags';

const mk = (flags = {}) => ({ metamask: { remoteFeatureFlags: flags } });

describe('ramps feature-flag selectors', () => {
  // TEMP QA: getIsRampsEnabled is forced on for prod-ramps QA.
  it('getIsRampsEnabled is forced on for this QA branch', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(getIsRampsEnabled(mk() as any)).toBe(true);
  });

  it('getIsRampsEnabled stays on even when remote flag is false', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(getIsRampsEnabled(mk({ rampsEnabled: false }) as any)).toBe(true);
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
