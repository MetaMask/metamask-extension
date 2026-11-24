import { getIsRampsServiceDisruptionActive } from './ramps-feature-flags';

const mk = (flags = {}) => ({ metamask: { remoteFeatureFlags: flags } });

describe('ramps feature-flag selectors', () => {
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
