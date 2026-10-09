import type { MetaMaskReduxState } from '../../store/store';
import { selectMoneyReferralAllowedForGeo } from './selectors';

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
