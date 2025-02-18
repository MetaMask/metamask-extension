import {
  getAssetsRates,
  AssetsRatesState,
  AssetsState,
  getAccountAssets,
  getAssetsMetadata,
} from './assets';

const mockRatesState = {
  metamask: {
    conversionRates: {
      'token-1': { rate: 1.5, currency: 'USD' },
      'token-2': { rate: 0.8, currency: 'EUR' },
    },
  },
};

// Mock state for testing
const mockAssetsState: AssetsState = {
  metamask: {
    accountsAssets: {
      '5132883f-598e-482c-a02b-84eeaa352f5b': [
        'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501',
      ],
    },
    assetsMetadata: {
      'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501': {
        name: 'Token 1',
        symbol: 'TKN1',
        iconUrl: 'https://example.com/token-1.png',
        fungible: true,
        units: [{ symbol: 'TKN1', name: 'Token 1', decimals: 9 }],
      },
    },
  },
};

describe('getAccountAssets', () => {
  it('should return the assets from the state', () => {
    const result = getAccountAssets(mockAssetsState);
    expect(result).toEqual(mockAssetsState.metamask.accountsAssets);
  });
});

describe('getAssetsMetadata', () => {
  it('should return the assets metadata from the state', () => {
    const result = getAssetsMetadata(mockAssetsState);
    expect(result).toEqual(mockAssetsState.metamask.assetsMetadata);
  });

  it('should return undefined if state does not have metamask property', () => {
    const invalidState = {} as AssetsState;
    expect(() => getAssetsMetadata(invalidState)).toThrow();
  });
});

describe('getAssetsRates', () => {
  it('should return the assetsRates from the state', () => {
    const result = getAssetsRates(mockRatesState);
    expect(result).toEqual(mockRatesState.metamask.conversionRates);
  });

  it('should return an empty object if assetsRates is empty', () => {
    const emptyState: AssetsRatesState = {
      metamask: { conversionRates: {} },
    };
    const result = getAssetsRates(emptyState);
    expect(result).toEqual({});
  });

  it('should return undefined if state does not have metamask property', () => {
    const invalidState = {} as AssetsRatesState;
    expect(() => getAssetsRates(invalidState)).toThrow();
  });
});
