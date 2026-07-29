import { getIsRampRegionUnsupported } from './ramps';

const baseMetamask = {
  userRegion: null,
  countries: { data: [], selected: null, isLoading: false, error: null },
  providers: { data: [], selected: null, isLoading: false, error: null },
  tokens: { data: null, selected: null, isLoading: false, error: null },
};

const mk = (over = {}) => ({ metamask: { ...baseMetamask, ...over } });

describe('ramps selectors', () => {
  it('getIsRampRegionUnsupported reflects the eligibility util', () => {
    const region = {
      country: { isoCode: 'FR', supported: { buy: false } },
      state: null,
      regionCode: 'fr',
    };
    expect(getIsRampRegionUnsupported(mk({ userRegion: region }))).toBe(true);
  });

  it('getIsRampRegionUnsupported fails open on the never-fetched default state', () => {
    expect(getIsRampRegionUnsupported(mk())).toBe(false);
  });
});
