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
    expect(getRampsUserRegion(mk({ userRegion: region }))).toBe(region);
  });

  it('getIsRampsGeolocationUnknown is false on the never-fetched default state (fail open)', () => {
    expect(getIsRampsGeolocationUnknown(mk())).toBe(false);
  });

  it('getIsRampsGeolocationUnknown is false when countries fetch errored (fail open)', () => {
    expect(
      getIsRampsGeolocationUnknown(
        mk({
          countries: {
            ...baseMetamask.countries,
            error: new Error('failed to fetch countries'),
          },
        }),
      ),
    ).toBe(false);
  });

  it('getIsRampsGeolocationUnknown is true once countries have loaded and region is still null', () => {
    expect(
      getIsRampsGeolocationUnknown(
        mk({
          countries: {
            ...baseMetamask.countries,
            data: [{ isoCode: 'US' }],
          },
        }),
      ),
    ).toBe(true);
  });

  it('getIsRampsGeolocationUnknown is false while countries are loading', () => {
    expect(
      getIsRampsGeolocationUnknown(
        mk({ countries: { ...baseMetamask.countries, isLoading: true } }),
      ),
    ).toBe(false);
  });

  it('getIsRampRegionUnsupported reflects the eligibility util', () => {
    const region = {
      country: { isoCode: 'FR', supported: { buy: false } },
      state: null,
      regionCode: 'fr',
    };
    expect(getIsRampRegionUnsupported(mk({ userRegion: region }))).toBe(true);
  });
});
