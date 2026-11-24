import {
  getIsRampsServiceDisruptionActive,
  getRampsProvidersAheadOfHistory,
} from './ramps-feature-flags';

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

  describe('getRampsProvidersAheadOfHistory', () => {
    const enabledFlag = {
      enabled: true,
      minimumVersion: '0.0.0',
      providerIds: ['crossmint', 'transak'],
    };

    const emptyCases: [string, unknown][] = [
      ['missing', undefined],
      ['disabled', { ...enabledFlag, enabled: false }],
      [
        'below the minimum version',
        { ...enabledFlag, minimumVersion: '999.0.0' },
      ],
      ['without provider ids', { enabled: true, minimumVersion: '0.0.0' }],
      [
        'with an invalid id',
        { ...enabledFlag, providerIds: ['crossmint', ''] },
      ],
    ];

    for (const [label, flag] of emptyCases) {
      it(`returns an empty list when the flag is ${label}`, () => {
        expect(
          getRampsProvidersAheadOfHistory(
            mk({ rampsProvidersAheadOfHistory: flag }) as never,
          ),
        ).toStrictEqual([]);
      });
    }

    it('returns the provider ids when enabled', () => {
      expect(
        getRampsProvidersAheadOfHistory(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          mk({ rampsProvidersAheadOfHistory: enabledFlag }) as any,
        ),
      ).toStrictEqual(['crossmint', 'transak']);
    });

    it('unwraps a progressive rollout', () => {
      expect(
        getRampsProvidersAheadOfHistory(
          mk({
            rampsProvidersAheadOfHistory: {
              name: 'group-a',
              value: enabledFlag,
            },
          }) as never,
        ),
      ).toStrictEqual(['crossmint', 'transak']);
    });
  });
});
