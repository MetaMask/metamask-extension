import { renderHookWithProvider } from '../../../test/lib/render-helpers-navigate';
import { fetchBuyableChains } from '../../ducks/ramps';
import { useFetchBuyableChains } from './useFetchBuyableChains';

jest.mock('../../ducks/ramps', () => ({
  ...jest.requireActual('../../ducks/ramps'),
  fetchBuyableChains: jest.fn(() => ({
    type: 'ramps/fetchBuyableChains/mock',
  })),
}));

const mockFetchBuyableChains = jest.mocked(fetchBuyableChains);

describe('useFetchBuyableChains', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('dispatches fetchBuyableChains when the wallet is unlocked and onboarding is complete', () => {
    renderHookWithProvider(() => useFetchBuyableChains(), {
      metamask: {
        isUnlocked: true,
        completedOnboarding: true,
      },
    });

    expect(mockFetchBuyableChains).toHaveBeenCalledTimes(1);
  });

  it('does not dispatch fetchBuyableChains when the wallet is locked', () => {
    renderHookWithProvider(() => useFetchBuyableChains(), {
      metamask: {
        isUnlocked: false,
        completedOnboarding: true,
      },
    });

    expect(mockFetchBuyableChains).not.toHaveBeenCalled();
  });

  it('does not dispatch fetchBuyableChains when onboarding is incomplete', () => {
    renderHookWithProvider(() => useFetchBuyableChains(), {
      metamask: {
        isUnlocked: true,
        completedOnboarding: false,
      },
    });

    expect(mockFetchBuyableChains).not.toHaveBeenCalled();
  });
});
