import { getAssetsRates, AssetsState } from './multichain-assets-rates';

// Mock state for testing
const mockState = {
  metamask: {
    conversionRates: {
      'token-1': { rate: 1.5, currency: 'USD' },
      'token-2': { rate: 0.8, currency: 'EUR' },
    },
  },
};
describe('getAssetsRates', () => {
  it('should return the assetsRates from the state', () => {
    const result = getAssetsRates(mockState);
    expect(result).toEqual(mockState.metamask.conversionRates);
  });

  it('should return an empty object if assetsRates is empty', () => {
    const emptyState: AssetsState = {
      metamask: {
        conversionRates: {},
      },
    };
    const result = getAssetsRates(emptyState);
    expect(result).toEqual({});
  });

  it('should return undefined if state does not have metamask property', () => {
    const invalidState = {} as AssetsState;
    expect(() => getAssetsRates(invalidState)).toThrow();
  });
});
