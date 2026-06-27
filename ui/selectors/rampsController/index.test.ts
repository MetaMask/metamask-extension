import { selectUserRegion, selectTokens } from './index';

describe('rampsController selectors', () => {
  it('matches snapshot for selectUserRegion and selectTokens', () => {
    const state = {
      metamask: {
        RampsController: {
          userRegion: {
            regionCode: 'us-ca',
            country: { currency: 'USD' },
          },
          tokens: {
            data: { topTokens: [], allTokens: [] },
            selected: null,
            isLoading: false,
            error: null,
          },
        },
      },
    };

    expect(selectUserRegion(state)).toMatchSnapshot();
    expect(selectTokens(state)).toMatchSnapshot();
  });
});
