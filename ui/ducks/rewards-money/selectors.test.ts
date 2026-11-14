import type { MetaMaskReduxState } from '../../store/store';
import {
  canAcceptMoneyReferralInvite,
  selectIsMoneyReferralInviteEnabled,
  selectMoneyReferralAllowedForGeo,
} from './selectors';

function state({
  geoLocation,
  excludedRegions,
}: {
  geoLocation: string | null;
  excludedRegions: string[] | null;
}): MetaMaskReduxState {
  return {
    rewards: { geoLocation },
    metamask: { excludedRegions },
  } as unknown as MetaMaskReduxState;
}

describe('canAcceptMoneyReferralInvite', () => {
  it('allows a plain user, a cashback experiment, and copy trading', () => {
    expect(canAcceptMoneyReferralInvite({ roles: [] })).toBe(true);
    expect(
      canAcceptMoneyReferralInvite({ roles: ['CASHBACK_EXPERIMENT'] }),
    ).toBe(true);
    expect(canAcceptMoneyReferralInvite({ roles: ['COPY_TRADING'] })).toBe(
      true,
    );
    expect(canAcceptMoneyReferralInvite(null)).toBe(true);
  });

  it('refuses a referrer or an existing referee', () => {
    expect(canAcceptMoneyReferralInvite({ roles: ['REFERRER'] })).toBe(false);
    expect(canAcceptMoneyReferralInvite({ roles: ['REFEREE'] })).toBe(false);
    expect(
      canAcceptMoneyReferralInvite({ roles: ['REFERRER', 'REFEREE'] }),
    ).toBe(false);
    expect(
      canAcceptMoneyReferralInvite({
        roles: ['CASHBACK_EXPERIMENT', 'REFEREE'],
      }),
    ).toBe(false);
  });
});

describe('selectIsMoneyReferralInviteEnabled', () => {
  function gatedState({
    enabled = true,
    minimumVersion = '0.0.0',
    useExternalServices = true,
  }: {
    enabled?: boolean;
    minimumVersion?: string | null;
    useExternalServices?: boolean;
  } = {}): MetaMaskReduxState {
    return {
      metamask: {
        useExternalServices,
        remoteFeatureFlags: {
          rewardsMoneyControllerEnabled: { enabled, minimumVersion },
        },
      },
    } as unknown as MetaMaskReduxState;
  }

  it('allows the invite when Basic Functionality and the flag are on', () => {
    expect(selectIsMoneyReferralInviteEnabled(gatedState())).toBe(true);
  });

  it('refuses the invite when Basic Functionality is off', () => {
    expect(
      selectIsMoneyReferralInviteEnabled(
        gatedState({ useExternalServices: false }),
      ),
    ).toBe(false);
  });

  it('refuses the invite when the flag is off, missing, or version-gated', () => {
    expect(
      selectIsMoneyReferralInviteEnabled(gatedState({ enabled: false })),
    ).toBe(false);
    expect(
      selectIsMoneyReferralInviteEnabled(
        gatedState({ minimumVersion: '999.0.0' }),
      ),
    ).toBe(false);
    expect(
      selectIsMoneyReferralInviteEnabled({
        metamask: { useExternalServices: true, remoteFeatureFlags: {} },
      } as unknown as MetaMaskReduxState),
    ).toBe(false);
  });
});

describe('selectMoneyReferralAllowedForGeo', () => {
  it('fails open when geo is unknown', () => {
    expect(
      selectMoneyReferralAllowedForGeo(
        state({ geoLocation: null, excludedRegions: ['US'] }),
      ),
    ).toBe(true);
    expect(
      selectMoneyReferralAllowedForGeo(
        state({ geoLocation: 'UNKNOWN', excludedRegions: ['US'] }),
      ),
    ).toBe(true);
    expect(
      selectMoneyReferralAllowedForGeo(
        state({ geoLocation: '  ', excludedRegions: ['US'] }),
      ),
    ).toBe(true);
  });

  it('fails open when exclusions have not loaded or are empty', () => {
    expect(
      selectMoneyReferralAllowedForGeo(
        state({ geoLocation: 'US', excludedRegions: null }),
      ),
    ).toBe(true);
    expect(
      selectMoneyReferralAllowedForGeo(
        state({ geoLocation: 'US', excludedRegions: [] }),
      ),
    ).toBe(true);
  });

  it('refuses a country that is on the exclusion list', () => {
    expect(
      selectMoneyReferralAllowedForGeo(
        state({ geoLocation: 'US-NY', excludedRegions: ['US'] }),
      ),
    ).toBe(false);
    expect(
      selectMoneyReferralAllowedForGeo(
        state({ geoLocation: 'ca', excludedRegions: ['US', 'CA'] }),
      ),
    ).toBe(false);
  });

  it('allows a country that is not excluded', () => {
    expect(
      selectMoneyReferralAllowedForGeo(
        state({ geoLocation: 'GB', excludedRegions: ['US'] }),
      ),
    ).toBe(true);
  });
});
