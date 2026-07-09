import {
  getRampsUserRegion,
  getIsRampRegionUnsupported,
  getIsRampsGeolocationUnknown,
} from './ramps';

const baseMetamask = {
  userRegion: null,
  countries: { data: [], selected: null, isLoading: false, error: null },
  providers: { data: [], selected: null, isLoading: false, error: null },
  tokens: { data: null, selected: null, isLoading: false, error: null },
};

const mk = (over = {}) => ({ metamask: { ...baseMetamask, ...over } });

describe('ramps selectors', () => {
  it('getRampsUserRegion returns the region', () => {
    const region = { country: { isoCode: 'US' }, state: null, regionCode: 'us' };
    expect(getRampsUserRegion(mk({ userRegion: region }) as any)).toBe(region);
  });

  it('getIsRampsGeolocationUnknown is true when resolved and region null', () => {
    expect(getIsRampsGeolocationUnknown(mk() as any)).toBe(true);
  });

  it('getIsRampsGeolocationUnknown is false while countries are loading', () => {
    expect(
      getIsRampsGeolocationUnknown(
        mk({ countries: { ...baseMetamask.countries, isLoading: true } }) as any,
      ),
    ).toBe(false);
  });

  it('getIsRampRegionUnsupported reflects the eligibility util', () => {
    const region = {
      country: { isoCode: 'FR', supported: { buy: false } },
      state: null,
      regionCode: 'fr',
    };
    expect(getIsRampRegionUnsupported(mk({ userRegion: region }) as any)).toBe(true);
  });
});
