import { SolScope } from '@metamask/keyring-api';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { AVAILABLE_MULTICHAIN_NETWORK_CONFIGURATIONS } from '@metamask/multichain-network-controller';
import { cloneDeep } from 'lodash';
import { selectAssetsBySelectedAccountGroup } from '@metamask/assets-controllers';
import {
  AssetsRatesState,
  AssetsState,
  getAccountAssets,
  getAssetsMetadata,
  getAssetsRates,
  getHistoricalPrices,
  getMultiChainAssets,
  getMultichainNativeAssetType,
  getTokenByAccountAndAddressAndChainId,
  getHistoricalMultichainAggregatedBalance,
  getAssetsBySelectedAccountGroup,
} from './assets';

jest.mock('@metamask/assets-controllers');

const mockRatesState = {
  metamask: {
    conversionRates: {
      'token-1': { rate: 1.5, currency: 'USD' },
      'token-2': { rate: 0.8, currency: 'EUR' },
    },
    historicalPrices: {
      'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501': {
        usd: {
          intervals: {},
          updateTime: 1737542312,
          expirationTime: 1737542312,
        },
      },
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
      metamask: { conversionRates: {}, historicalPrices: {} },
    };
    const result = getAssetsRates(emptyState);
    expect(result).toEqual({});
  });

  it('should return undefined if state does not have metamask property', () => {
    const invalidState = {} as AssetsRatesState;
    expect(() => getAssetsRates(invalidState)).toThrow();
  });
});

describe('getHistoricalPrices', () => {
  it('should return the assetsRates from the state', () => {
    const result = getHistoricalPrices(mockRatesState);
    expect(result).toEqual(mockRatesState.metamask.historicalPrices);
  });

  it('should return an empty object if historicalPrices is empty', () => {
    const emptyState: AssetsRatesState = {
      metamask: { conversionRates: {}, historicalPrices: {} },
    };
    const result = getHistoricalPrices(emptyState);
    expect(result).toEqual({});
  });

  it('should return undefined if state does not have metamask property', () => {
    const invalidState = {} as AssetsRatesState;
    expect(() => getHistoricalPrices(invalidState)).toThrow();
  });
});

describe('getMultiChainAssets', () => {
  const mockAccountId = '5132883f-598e-482c-a02b-84eeaa352f5b';
  const mockMultichainBalances = {
    [mockAccountId]: {
      'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501': {
        amount: '0.051724127',
        unit: 'SOL',
      },
      'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v':
        {
          amount: '0',
          unit: 'USDC',
        },
    },
  };

  const mockAccountAssets = {
    [mockAccountId]: [
      'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501',
      'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    ],
  };
  it('should return assets with zero balance with hideZeroBalanceTokens set to false', () => {
    const mockState = {
      metamask: {
        ...mockAssetsState.metamask,
        ...mockRatesState.metamask,
        accountsAssets: mockAccountAssets,
        preferences: {
          hideZeroBalanceTokens: false,
        },
        balances: mockMultichainBalances,
      },
    };
    const result = getMultiChainAssets(mockState, {
      address: '0xAddress',
      id: mockAccountId,
    });
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: 'Token 1',
          address: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501',
          symbol: 'TKN1',
          image: 'https://example.com/token-1.png',
          decimals: 9,
          chainId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
          isNative: true,
          primary: '0.051724127',
          secondary: null,
        }),
        expect.objectContaining({
          title: 'USDC',
          address:
            'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
          symbol: 'USDC',
          image: undefined,
          decimals: 0,
          chainId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
          isNative: false,
          primary: '0',
          secondary: null,
        }),
      ]),
    );
  });
  it('should not return assets with zero balance with hideZeroBalanceTokens set to true', () => {
    const mockState = {
      metamask: {
        ...mockAssetsState.metamask,
        ...mockRatesState.metamask,
        accountsAssets: mockAccountAssets,
        preferences: {
          hideZeroBalanceTokens: true,
        },
        balances: mockMultichainBalances,
      },
    };
    const result = getMultiChainAssets(mockState, {
      address: '0xAddress',
      id: mockAccountId,
    });
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: 'Token 1',
          address: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501',
          symbol: 'TKN1',
          image: 'https://example.com/token-1.png',
          decimals: 9,
          chainId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
          isNative: true,
          primary: '0.051724127',
          secondary: null,
        }),
      ]),
    );
  });

  it('returns the same data if state does not change', () => {
    const mockState = {
      metamask: {
        ...mockAssetsState.metamask,
        ...mockRatesState.metamask,
        accountsAssets: mockAccountAssets,
        preferences: {
          hideZeroBalanceTokens: false,
        },
        balances: mockMultichainBalances,
      },
    };
    const result1 = getMultiChainAssets(mockState, {
      address: '0xAddress',
      id: mockAccountId,
    });
    const result2 = getMultiChainAssets(mockState, {
      address: '0xAddress',
      id: mockAccountId,
    });
    expect(result1 === result2).toBe(true);
  });
});

describe('getTokenByAccountAndAddressAndChainId', () => {
  // Create a mock state with an EVM account and a non-EVM account, each having a token on their respective chains
  const mockState = {
    metamask: {
      internalAccounts: {
        accounts: {
          '81b1ead4-334c-4921-9adf-282fde539752': {
            id: '81b1ead4-334c-4921-9adf-282fde539752',
            address: '0x458036e7bc0612e9b207640dc07ca7711346aae5',
            type: 'eip155:eoa',
          },
          '5132883f-598e-482c-a02b-84eeaa352f5b': {
            id: '5132883f-598e-482c-a02b-84eeaa352f5b',
            address: '8A4AptCThfbuknsbteHgGKXczfJpfjuVA9SLTSGaaLGC',
            type: 'solana:data-account',
          },
        },
        selectedAccount: '', // To be populated in each case
      },
      accounts: {
        '0x458036e7bc0612e9b207640dc07ca7711346aae5': {
          address: '0x458036e7bc0612e9b207640dc07ca7711346aae5',
          balance: '0x0',
        },
      },
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
      allTokens: {
        'eip155:1': {
          '0x458036e7bc0612e9b207640dc07ca7711346aae5': [
            {
              address: '0x458036e7bc0612e9b207640dc07ca7711346aae5',
              chainId: 'eip155:1',
              name: 'Token 2',
            },
          ],
        },
      },
      accountsByChainId: {
        'eip155:1': {
          '0x458036e7bc0612e9b207640dc07ca7711346aae5': {
            balance: '0x0',
          },
        },
      },
      completedOnboarding: true,
    },
  };

  it('should return null if chainId is undefined', () => {
    const result = getTokenByAccountAndAddressAndChainId(
      mockState,
      undefined,
      '0x458036e7bc0612e9b207640dc07ca7711346aae5',
      undefined,
    );
    expect(result).toBeNull();
  });

  describe('when the passed account is an EVM account', () => {
    const account = mockState.metamask.internalAccounts.accounts[
      '81b1ead4-334c-4921-9adf-282fde539752'
    ] as unknown as InternalAccount;

    it('should return the token from the state', () => {
      const result = getTokenByAccountAndAddressAndChainId(
        mockState,
        account,
        '0x458036e7bc0612e9b207640dc07ca7711346aae5',
        'eip155:1',
      );
      expect(result).toEqual({
        address: '0x458036e7bc0612e9b207640dc07ca7711346aae5',
        chainId: 'eip155:1',
        isNative: false,
        name: 'Token 2',
      });
    });
  });

  describe('when the passed account is a non-EVM account', () => {
    const account = mockState.metamask.internalAccounts.accounts[
      '5132883f-598e-482c-a02b-84eeaa352f5b'
    ] as unknown as InternalAccount;

    it('should return the token from the state', () => {
      const result = getTokenByAccountAndAddressAndChainId(
        mockState,
        account,
        'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501',
        'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
      );

      expect(result).toEqual({
        address: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501',
        chainId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
        decimals: 9,
        image: 'https://example.com/token-1.png',
        isNative: true,
        isStakeable: false,
        primary: '0',
        secondary: null,
        string: '',
        symbol: 'TKN1',
        title: 'Token 1',
        tokenFiatAmount: null,
      });
    });
  });

  describe('when the passed account is undefined', () => {
    it('should use the selected account to return the token from the state', () => {
      const account = undefined;
      const mockStateWithSelectedAccount = cloneDeep(mockState);
      mockStateWithSelectedAccount.metamask.internalAccounts.selectedAccount =
        '5132883f-598e-482c-a02b-84eeaa352f5b';

      const result = getTokenByAccountAndAddressAndChainId(
        mockStateWithSelectedAccount,
        account,
        'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501',
        'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
      );

      expect(result).toEqual({
        address: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501',
        chainId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
        decimals: 9,
        image: 'https://example.com/token-1.png',
        isNative: true,
        isStakeable: false,
        primary: '0',
        secondary: null,
        string: '',
        symbol: 'TKN1',
        title: 'Token 1',
        tokenFiatAmount: null,
      });
    });
  });
});

describe('getMultichainNativeAssetType', () => {
  const mockState = {
    metamask: {
      internalAccounts: {
        accounts: {
          '5132883f-598e-482c-a02b-84eeaa352f5b': {
            id: '5132883f-598e-482c-a02b-84eeaa352f5b',
            address: '8A4AptCThfbuknsbteHgGKXczfJpfjuVA9SLTSGaaLGC',
            type: 'solana:data-account',
          },
        },
        selectedAccount: '5132883f-598e-482c-a02b-84eeaa352f5b',
      },
      accountsAssets: {
        '5132883f-598e-482c-a02b-84eeaa352f5b': [
          'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501',
          'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        ],
      },
      networkConfigurationsByChainId: {},
      multichainNetworkConfigurationsByChainId:
        AVAILABLE_MULTICHAIN_NETWORK_CONFIGURATIONS,
      completedOnboarding: true,
      selectedMultichainNetworkChainId: SolScope.Mainnet,
      isEvmSelected: false,
      remoteFeatureFlags: {
        addSolanaAccount: true,
        addBitcoinAccout: true,
      },
    },

    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;

  describe('when a native asset type is available', () => {
    it('should return the native asset type', () => {
      const result = getMultichainNativeAssetType(mockState);

      expect(result).toEqual(
        'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501',
      );
    });
  });

  describe('when a native asset type is not available', () => {
    const mockStateWithoutNativeAssetType = cloneDeep(mockState);
    mockStateWithoutNativeAssetType.metamask.accountsAssets[
      '5132883f-598e-482c-a02b-84eeaa352f5b'
    ] = [
      'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    ];

    it('should return undefined', () => {
      const result = getMultichainNativeAssetType(
        mockStateWithoutNativeAssetType,
      );

      expect(result).toBeUndefined();
    });
  });
});

describe('getHistoricalMultichainAggregatedBalance', () => {
  const mockAccountId = '5132883f-598e-482c-a02b-84eeaa352f5b';

  // Mock balances state
  const mockBalances = {
    [mockAccountId]: {
      'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501': {
        amount: '100',
        unit: 'SOL',
      },
      'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v':
        {
          amount: '50',
          unit: 'USDC',
        },
    },
  };

  // Mock account assets state
  const mockAccountAssets = {
    [mockAccountId]: [
      'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501',
      'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    ],
  };

  // Mock conversion rates state
  const mockConversionRates = {
    'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501': {
      rate: '10',
      marketData: {
        pricePercentChange: {
          P1D: 5, // 5% increase
          P7D: -2, // 2% decrease
        },
      },
    },
    'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v':
      {
        rate: '1',
        marketData: {
          pricePercentChange: {
            P1D: 10, // 10% increase
            P7D: 5, // 5% increase
          },
        },
      },
  };

  // Complete mock state
  const mockState = {
    metamask: {
      accountsAssets: mockAccountAssets,
      conversionRates: mockConversionRates,
      balances: mockBalances,
    },
  };

  it('should calculate historical balances, percent changes, and amount changes correctly', () => {
    const result = getHistoricalMultichainAggregatedBalance(mockState, {
      id: mockAccountId,
    });

    expect(result.P1D).toEqual({
      balance: 997.8354978354979,
      percentChange: 5.22776573,
      amountChange: 52.16450216,
    });
  });

  it('should handle missing market data', () => {
    const noMarketDataState = {
      metamask: {
        accountsAssets: mockAccountAssets,
        conversionRates: {
          'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501': {
            rate: '10',
            // No marketData
          },
          'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v':
            {
              rate: '1',
              marketData: {
                pricePercentChange: {
                  P1D: 10,
                  P7D: 5,
                },
              },
            },
        },
        balances: mockBalances,
      },
    };

    const result = getHistoricalMultichainAggregatedBalance(noMarketDataState, {
      id: mockAccountId,
    });

    expect(result.P1D).toEqual({
      balance: 45.45454545454545,
      percentChange: 10,
      amountChange: 4.54545455,
    });
  });

  it('should return zero values for all periods when no assets have market data', () => {
    const noMarketDataState = {
      metamask: {
        accountsAssets: mockAccountAssets,
        conversionRates: {
          'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501': {
            rate: '10',
            // No marketData
          },
          'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v':
            {
              rate: '1',
              // No marketData
            },
        },
        balances: mockBalances,
      },
    };

    const result = getHistoricalMultichainAggregatedBalance(noMarketDataState, {
      id: mockAccountId,
    });

    // All periods should have zero values since no assets have market data
    Object.values(result).forEach((periodData) => {
      expect(periodData).toEqual({
        balance: 0,
        percentChange: 0,
        amountChange: 0,
      });
    });
  });

  it('should handle precision correctly', () => {
    const precisionState = {
      metamask: {
        accountsAssets: mockAccountAssets,
        conversionRates: {
          'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501': {
            rate: '10.123456789',
            marketData: {
              pricePercentChange: {
                P1D: 5.123456789,
              },
            },
          },
        },
        balances: mockBalances,
      },
    };

    const result = getHistoricalMultichainAggregatedBalance(precisionState, {
      id: mockAccountId,
    });

    expect(result.P1D.percentChange).toBe(5.123457); // max 8 decimal places
    expect(result.P1D.amountChange).toBe(49.33922174); // max 8 decimal places
  });
});

describe('getAssetsBySelectedAccountGroup', () => {
  const mockState = {
    metamask: {
      accountTree: 'mockAccountTree',
      internalAccounts: 'mockInternalAccounts',
      allTokens: 'mockAllTokens',
      allIgnoredTokens: 'mockAllIgnoredTokens',
      tokenBalances: 'mockTokenBalances',
      marketData: 'mockMarketData',
      currencyRates: 'mockCurrencyRates',
      currentCurrency: 'mockCurrentCurrency',
      networkConfigurationsByChainId: 'mockNetworkConfigurationsByChainId',
      accountsByChainId: 'mockAccountsByChainId',
      accountsAssets: 'mockAccountsAssets',
      assetsMetadata: 'mockAssetsMetadata',
      balances: 'mockBalances',
      conversionRates: 'mockConversionRates',
    },
  };

  it('calls the imported selector with the prepared initial state', () => {
    const selectorMock = jest.mocked(selectAssetsBySelectedAccountGroup);
    const expectedResult = {};
    selectorMock.mockReturnValue(expectedResult);

    const result = getAssetsBySelectedAccountGroup(mockState);

    expect(selectorMock).toHaveBeenCalledWith(mockState.metamask);
    expect(result).toBe(expectedResult);
  });
});
