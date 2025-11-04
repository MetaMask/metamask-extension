import { EthScope, SolScope, TrxScope } from '@metamask/keyring-api';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { AVAILABLE_MULTICHAIN_NETWORK_CONFIGURATIONS } from '@metamask/multichain-network-controller';
import { cloneDeep } from 'lodash';
import {
  calculateBalanceForAllWallets,
  calculateBalanceChangeForAllWallets,
  selectAssetsBySelectedAccountGroup,
} from '@metamask/assets-controllers';
import type {
  AccountGroupAssets,
  BalanceChangeResult,
} from '@metamask/assets-controllers';
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
  selectBalanceForAllWallets,
  selectBalanceByAccountGroup,
  selectBalanceByWallet,
  type BalanceCalculationState,
  selectBalanceChangeForAllWallets,
  selectBalanceChangeBySelectedAccountGroup,
  selectAccountGroupBalanceForEmptyState,
  getAssetsBySelectedAccountGroup,
  getAsset,
  getAllIgnoredAssets,
} from './assets';

jest.mock('@metamask/assets-controllers', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const actual = jest.requireActual('@metamask/assets-controllers');
  return {
    ...actual,
    calculateBalanceForAllWallets: jest.fn(() => ({
      wallets: {},
      userCurrency: 'usd',
    })),
    calculateBalanceChangeForAllWallets: jest.fn(() => ({
      period: '1d',
      currentTotalInUserCurrency: 0,
      previousTotalInUserCurrency: 0,
      amountChangeInUserCurrency: 0,
      percentChange: 0,
      userCurrency: 'usd',
    })),
    selectAssetsBySelectedAccountGroup: jest.fn(),
  };
});

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
    allIgnoredAssets: {},
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

describe('getAllIgnoredAssets', () => {
  it('should return the all ignored assets from the state', () => {
    const result = getAllIgnoredAssets(mockAssetsState);
    expect(result).toEqual(mockAssetsState.metamask.allIgnoredAssets);
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
          balance: '0.051724127',
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
          balance: '0',
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
          balance: '0.051724127',
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
      accountTree: {
        wallets: {
          'entropy:01JKAF3DSGM3AB87EM9N0K41AJ': {
            id: 'entropy:01JKAF3DSGM3AB87EM9N0K41AJ',
            type: 'entropy',
            groups: {
              'entropy:01JKAF3DSGM3AB87EM9N0K41AJ/0': {
                id: 'entropy:01JKAF3DSGM3AB87EM9N0K41AJ/0',
                type: 'multichain-account',
                accounts: [
                  '81b1ead4-334c-4921-9adf-282fde539752',
                  '5132883f-598e-482c-a02b-84eeaa352f5b',
                ],
                metadata: {
                  name: 'Account 1',
                  entropy: {
                    groupIndex: 0,
                  },
                  hidden: false,
                  pinned: false,
                },
              },
            },
            metadata: {
              name: 'Wallet 1',
              entropy: {
                id: '01JKAF3DSGM3AB87EM9N0K41AJ',
              },
            },
          },
        },
        selectedAccountGroup: 'entropy:01JKAF3DSGM3AB87EM9N0K41AJ/0',
      },
      internalAccounts: {
        accounts: {
          '81b1ead4-334c-4921-9adf-282fde539752': {
            id: '81b1ead4-334c-4921-9adf-282fde539752',
            address: '0x458036e7bc0612e9b207640dc07ca7711346aae5',
            type: 'eip155:eoa',
            scopes: [EthScope.Eoa],
          },
          '5132883f-598e-482c-a02b-84eeaa352f5b': {
            id: '5132883f-598e-482c-a02b-84eeaa352f5b',
            address: '8A4AptCThfbuknsbteHgGKXczfJpfjuVA9SLTSGaaLGC',
            type: 'solana:data-account',
            scopes: [SolScope.Mainnet],
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
      allIgnoredAssets: {},
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
      '0x1',
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
        balance: '0',
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
        balance: '0',
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
        solanaAccounts: { enabled: true, minimumVersion: '13.6.0' },
        bitcoinAccounts: { enabled: true, minimumVersion: '13.6.0' },
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

describe('Aggregated balance adapters/selectors', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const baseState: BalanceCalculationState = {
    metamask: {} as BalanceCalculationState['metamask'],
  };

  it('selectBalanceForAllWallets adapts shapes and calls core calculator once', () => {
    const out = selectBalanceForAllWallets(baseState);
    expect(out).toEqual({ wallets: {}, userCurrency: 'usd' });
    expect((calculateBalanceForAllWallets as jest.Mock).mock.calls.length).toBe(
      1,
    );

    const args = (calculateBalanceForAllWallets as jest.Mock).mock.calls[0];
    expect(args[0]).toHaveProperty('accountTree');
    expect(args[1]).toHaveProperty('internalAccounts');
    expect(args[2]).toHaveProperty('tokenBalances');
    expect(args[3]).toHaveProperty('marketData');
    expect(args[4]).toEqual({ conversionRates: {}, historicalPrices: {} });
    expect(args[5]).toHaveProperty('balances');
    expect(args[6]).toHaveProperty('accountsAssets');
    expect(args[7]).toHaveProperty('allTokens');
    expect(args[8]).toEqual({ currentCurrency: 'usd', currencyRates: {} });
  });

  it('memoizes aggregate output for identical state', () => {
    const a = selectBalanceForAllWallets(baseState);
    const b = selectBalanceForAllWallets(baseState);
    expect(a).toBe(b);
  });

  it('group and wallet readers use aggregate output', () => {
    (calculateBalanceForAllWallets as jest.Mock).mockReturnValueOnce({
      wallets: {
        w1: {
          totalBalanceInUserCurrency: 100,
          groups: {
            'w1/g1': {
              walletId: 'w1',
              groupId: 'w1/g1',
              totalBalanceInUserCurrency: 40,
              userCurrency: 'usd',
            },
          },
        },
      },
      userCurrency: 'usd',
    });

    // Use a new state reference to force recomputation of the memoized selector
    const nextState: BalanceCalculationState = {
      metamask: {} as BalanceCalculationState['metamask'],
    };
    // Prime aggregate with the new mock result
    selectBalanceForAllWallets(nextState);

    const groupSel = selectBalanceByAccountGroup('w1/g1');
    const group = groupSel(nextState);

    const walletSel = selectBalanceByWallet('w1');
    const wallet = walletSel(nextState);

    // If wallet/groups exist in aggregate, selectors should match that shape.
    // Otherwise, selectors should return the default shape consistently.
    if (wallet?.groups?.['w1/g1']) {
      expect(group).toEqual(wallet.groups['w1/g1']);
    } else {
      expect(group).toEqual({
        walletId: 'w1',
        groupId: 'w1/g1',
        totalBalanceInUserCurrency: 0,
        userCurrency: wallet?.userCurrency ?? 'usd',
      });
    }

    // Wallet selector should reflect aggregate totals when available
    if (wallet?.groups) {
      // userCurrency is required on wallet shape
      expect(wallet).toHaveProperty('userCurrency');
    }
  });
});

describe('Aggregated balance recomputation behavior', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not recompute when unrelated state changes but used slice references are stable', () => {
    // Build stable references for used slices
    const accountTree = { wallets: {}, selectedAccountGroup: '' };
    const internalAccounts = { accounts: {}, selectedAccount: '' };
    const tokenBalances = {};
    const marketData = {};
    const conversionRates = {};
    const historicalPrices = {};
    const balances = {};
    const allTokens = {};
    const currencyRates = {};
    const accountsAssets = {};
    const assetsMetadata = {};
    const allIgnoredAssets = {};

    const baseState: BalanceCalculationState = {
      metamask: {
        // provide all used slices with stable refs
        accountTree,
        internalAccounts,
        tokenBalances,
        marketData,
        balances,
        allTokens,
        currentCurrency: 'usd',
        currencyRates,
        conversionRates,
        historicalPrices,
        accountsAssets,
        assetsMetadata,
        allIgnoredAssets,
      } as unknown as BalanceCalculationState['metamask'],
    };

    const out1 = selectBalanceForAllWallets(baseState);

    // Unrelated state change: add a non-used field while keeping used refs identical
    const nextState: BalanceCalculationState = {
      metamask: {
        // reuse same references for used inputs
        accountTree,
        internalAccounts,
        tokenBalances,
        marketData,
        balances,
        allTokens,
        currentCurrency: 'usd',
        currencyRates,
        conversionRates,
        historicalPrices,
        accountsAssets,
        assetsMetadata,
        allIgnoredAssets,
        // unrelated field
        remoteFeatureFlags: { foo: true },
      } as unknown as BalanceCalculationState['metamask'],
    };

    const out2 = selectBalanceForAllWallets(nextState);

    // No recompute and referentially equal output
    expect(out1).toBe(out2);
    expect((calculateBalanceForAllWallets as jest.Mock).mock.calls.length).toBe(
      1,
    );
  });

  it('recomputes when a relevant slice reference changes (e.g., tokenBalances)', () => {
    const tokenBalancesA = {};
    const tokenBalancesB = {}; // new reference

    const stateA: BalanceCalculationState = {
      metamask: {
        accountTree: { wallets: {}, selectedAccountGroup: '' },
        internalAccounts: { accounts: {}, selectedAccount: '' },
        tokenBalances: tokenBalancesA,
        marketData: {},
        balances: {},
        allTokens: {},
        currentCurrency: 'usd',
        currencyRates: {},
        conversionRates: {},
        historicalPrices: {},
        accountsAssets: {},
        assetsMetadata: {},
        allIgnoredAssets: {},
      } as unknown as BalanceCalculationState['metamask'],
    };

    const outA = selectBalanceForAllWallets(stateA);

    const stateB: BalanceCalculationState = {
      metamask: {
        ...stateA.metamask,
        tokenBalances: tokenBalancesB, // change relevant input ref
      } as unknown as BalanceCalculationState['metamask'],
    };

    const outB = selectBalanceForAllWallets(stateB);

    // Recompute should have happened at least once more, and outputs not the same ref
    expect(outA).not.toBe(outB);
    expect(
      (calculateBalanceForAllWallets as jest.Mock).mock.calls.length,
    ).toBeGreaterThan(1);
  });
});

describe('Balance change selectors', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const baseState: BalanceCalculationState = {
    metamask: {} as BalanceCalculationState['metamask'],
  };

  it('selectBalanceChangeForAllWallets adapts shapes and calls core with period', () => {
    const mockReturn: BalanceChangeResult = {
      period: '1d',
      currentTotalInUserCurrency: 123,
      previousTotalInUserCurrency: 100,
      amountChangeInUserCurrency: 23,
      percentChange: 23,
      userCurrency: 'usd',
    };
    (calculateBalanceChangeForAllWallets as jest.Mock).mockReturnValueOnce(
      mockReturn,
    );

    const selectChange1d = selectBalanceChangeForAllWallets('1d');
    const out = selectChange1d(baseState);
    expect(out).toEqual(mockReturn);

    expect(calculateBalanceChangeForAllWallets).toHaveBeenCalledTimes(1);
    const args = (calculateBalanceChangeForAllWallets as jest.Mock).mock
      .calls[0];
    expect(args[0]).toHaveProperty('accountTree');
    expect(args[1]).toHaveProperty('internalAccounts');
    expect(args[2]).toHaveProperty('tokenBalances');
    expect(args[3]).toHaveProperty('marketData');
    expect(args[4]).toHaveProperty('conversionRates');
    expect(args[5]).toHaveProperty('balances');
    expect(args[6]).toHaveProperty('accountsAssets');
    expect(args[7]).toHaveProperty('allTokens');
    expect(args[8]).toHaveProperty('currentCurrency');
    expect(args[10]).toBe('1d');
  });

  it('memoizes balance change output for identical state', () => {
    const selectChange7d = selectBalanceChangeForAllWallets('7d');
    const a = selectChange7d(baseState);
    const b = selectChange7d(baseState);
    expect(a).toBe(b);
  });

  it('selectBalanceChangeBySelectedAccountGroup returns null when none selected', () => {
    const selector = selectBalanceChangeBySelectedAccountGroup('7d');
    const out = selector(baseState);
    expect(out).toBeNull();
  });
});

describe('selectAccountGroupBalanceForEmptyState', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Shared base state factory with common structure
  const createBaseMockState = (
    accountId: string,
    accountType: string,
    accountScopes: string[],
    accountMetadata: Record<string, unknown> = {},
  ): Partial<BalanceCalculationState['metamask']> => ({
    accountTree: {
      wallets: {
        'entropy:wallet1': {
          id: 'entropy:wallet1',
          groups: {
            'entropy:wallet1/group1': {
              id: 'entropy:wallet1/group1',
              type: 'multichain-account',
              accounts: [accountId],
              metadata: {
                name: 'Account 1',
                hidden: false,
                pinned: false,
              },
            },
          },
        },
      },
      selectedAccountGroup: 'entropy:wallet1/group1',
    } as unknown as BalanceCalculationState['metamask']['accountTree'],
    internalAccounts: {
      accounts: {
        [accountId]: {
          id: accountId,
          type: accountType,
          address:
            accountId === 'account1'
              ? '0x0'
              : '8A4AptCThfbuknsbteHgGKXczfJpfjuVA9SLTSGaaLGC',
          scopes: accountScopes,
          metadata: accountMetadata,
          options: {},
          methods: [],
        } as unknown as InternalAccount,
      },
      selectedAccount: accountId,
    },
  });

  // Mock state factories for different test scenarios
  const createMockStateWithEVMNetworks = (
    includeTestnets = false,
  ): BalanceCalculationState => {
    const networks: Record<string, unknown> = {
      '0x1': { chainId: '0x1', type: 'mainnet' }, // Ethereum mainnet
      '0x89': { chainId: '0x89', type: 'mainnet' }, // Polygon mainnet
    };

    if (includeTestnets) {
      networks['0xaa36a7'] = { chainId: '0xaa36a7', type: 'testnet' }; // Sepolia testnet
      networks['0xe705'] = { chainId: '0xe705', type: 'testnet' }; // Linea Sepolia testnet
    }

    const baseState = createBaseMockState('account1', 'eip155:eoa', [
      EthScope.Eoa,
    ]);

    return {
      metamask: {
        ...baseState,
        networkConfigurationsByChainId: networks,
        multichainNetworkConfigurationsByChainId: {},
      } as unknown as BalanceCalculationState['metamask'],
    };
  };

  const createMockStateWithNonEVMNetworks = (
    includeTestnets = false,
  ): BalanceCalculationState => {
    const multichainNetworks: Record<string, unknown> = {
      'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp': {
        chainId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
        type: 'mainnet',
      }, // Solana mainnet
    };

    if (includeTestnets) {
      multichainNetworks['solana:4uhcVJyU9pJkvQyS88uRDiswHXSCkY3z'] = {
        chainId: 'solana:4uhcVJyU9pJkvQyS88uRDiswHXSCkY3z',
        type: 'testnet',
      }; // Solana testnet
      multichainNetworks['solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1'] = {
        chainId: 'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1',
        type: 'testnet',
      }; // Solana devnet
    }

    const baseState = createBaseMockState(
      'account2',
      'solana:data-account',
      [SolScope.Mainnet],
      {
        snap: { id: 'npm:@metamask/solana-wallet-snap', enabled: true },
      },
    );

    return {
      metamask: {
        ...baseState,
        networkConfigurationsByChainId: {},
        multichainNetworkConfigurationsByChainId: multichainNetworks,
      } as unknown as BalanceCalculationState['metamask'],
    };
  };

  const createMockBalanceResult = (balance = 750.25) => ({
    wallets: {
      'entropy:wallet1': {
        totalBalanceInUserCurrency: balance * 2,
        groups: {
          'entropy:wallet1/group1': {
            walletId: 'entropy:wallet1',
            groupId: 'entropy:wallet1/group1',
            totalBalanceInUserCurrency: balance,
            userCurrency: 'usd',
          },
        },
      },
    },
    userCurrency: 'usd',
  });

  it('should return correct balance for EVM networks', () => {
    const state = createMockStateWithEVMNetworks();
    const expectedBalance = 750.25;
    const mockResult = createMockBalanceResult(expectedBalance);
    (calculateBalanceForAllWallets as jest.Mock).mockReturnValueOnce(
      mockResult,
    );

    const result = selectAccountGroupBalanceForEmptyState(state);

    expect(result).toBe(expectedBalance);
    expect(calculateBalanceForAllWallets).toHaveBeenCalledTimes(1);
  });

  it('should return correct balance for non-EVM networks like Solana', () => {
    const state = createMockStateWithNonEVMNetworks();
    const expectedBalance = 500.5;
    const mockResult = createMockBalanceResult(expectedBalance);
    (calculateBalanceForAllWallets as jest.Mock).mockReturnValueOnce(
      mockResult,
    );

    const result = selectAccountGroupBalanceForEmptyState(state);

    expect(result).toBe(expectedBalance);
    expect(calculateBalanceForAllWallets).toHaveBeenCalledTimes(1);
  });

  it('should exclude EVM testnets from balance calculation', () => {
    const state = createMockStateWithEVMNetworks(true); // Include EVM testnets
    const mockResult = createMockBalanceResult();
    (calculateBalanceForAllWallets as jest.Mock).mockReturnValueOnce(
      mockResult,
    );

    selectAccountGroupBalanceForEmptyState(state);

    const callArgs = (calculateBalanceForAllWallets as jest.Mock).mock.calls[0];
    const enabledNetworkMap = callArgs[9]; // 10th argument is the network map

    // Should not include Sepolia (0xaa36a7) or Linea Sepolia (0xe705)
    expect(enabledNetworkMap?.eip155).not.toHaveProperty('0xaa36a7');
    expect(enabledNetworkMap?.eip155).not.toHaveProperty('0xe705');
    // Should include mainnet networks
    expect(enabledNetworkMap?.eip155).toHaveProperty('0x1');
    expect(enabledNetworkMap?.eip155).toHaveProperty('0x89');
  });

  it('should exclude non-EVM testnets like Solana from balance calculation', () => {
    const state = createMockStateWithNonEVMNetworks(true); // Include non-EVM testnets
    const mockResult = createMockBalanceResult();
    (calculateBalanceForAllWallets as jest.Mock).mockReturnValueOnce(
      mockResult,
    );

    selectAccountGroupBalanceForEmptyState(state);

    const callArgs = (calculateBalanceForAllWallets as jest.Mock).mock.calls[0];
    const enabledNetworkMap = callArgs[9];

    // Should not include Solana testnet or devnet
    expect(enabledNetworkMap?.solana).not.toHaveProperty(
      'solana:4uhcVJyU9pJkvQyS88uRDiswHXSCkY3z',
    );
    expect(enabledNetworkMap?.solana).not.toHaveProperty(
      'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1',
    );
    // Should include Solana mainnet
    expect(enabledNetworkMap?.solana).toHaveProperty(
      'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
    );
  });
});

describe('getAssetsBySelectedAccountGroup', () => {
  beforeEach(() => {
    getAssetsBySelectedAccountGroup.clearCache();
    getAssetsBySelectedAccountGroup.memoizedResultFunc.clearCache();
  });

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
      allIgnoredAssets: 'mockAllIgnoredAssets',
      balances: 'mockBalances',
      conversionRates: 'mockConversionRates',
    },
  };

  it('calls the imported selector with the prepared initial state', () => {
    const selectorMock = jest.mocked(selectAssetsBySelectedAccountGroup);
    const selectorMockResult = {};
    selectorMock.mockReturnValueOnce(selectorMockResult);

    const result = getAssetsBySelectedAccountGroup(mockState);

    expect(selectorMock).toHaveBeenCalledWith(mockState.metamask);
    expect(result).toStrictEqual(selectorMockResult);
  });

  it('filters out tron staked bandwidth and energy', () => {
    const selectorMock = jest
      .mocked(selectAssetsBySelectedAccountGroup)
      .mockReturnValue({
        'tron:728126428': [
          {
            accountType: 'tron:eoa',
            assetId: 'tron:728126428/slip44:195',
            isNative: true,
            image:
              'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/tron/info/logo.png',
            name: 'Tron',
            symbol: 'TRX',
            accountId: 'de5c3465-d01e-4091-a219-232903e982bb',
            decimals: 6,
            rawBalance: '0x0',
            balance: '0',
            fiat: {
              balance: 0,
              currency: 'usd',
              conversionRate: 0.28516,
            },
            chainId: 'tron:728126428',
          },
          {
            accountType: 'tron:eoa',
            assetId: 'tron:728126428/slip44:195-staked-for-bandwidth',
            isNative: true,
            image:
              'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/tron/info/logo.png',
            name: 'Staked for Bandwidth',
            symbol: 'sTRX-BANDWIDTH',
            accountId: 'de5c3465-d01e-4091-a219-232903e982bb',
            decimals: 6,
            rawBalance: '0x0',
            balance: '0',
            chainId: 'tron:728126428',
            fiat: undefined,
          },
          {
            accountType: 'tron:eoa',
            assetId: 'tron:728126428/slip44:195-staked-for-energy',
            isNative: true,
            image:
              'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/tron/info/logo.png',
            name: 'Staked for Energy',
            symbol: 'sTRX-ENERGY',
            accountId: 'de5c3465-d01e-4091-a219-232903e982bb',
            decimals: 6,
            rawBalance: '0x0',
            balance: '0',
            chainId: 'tron:728126428',
            fiat: undefined,
          },
          {
            accountType: 'tron:eoa',
            assetId: 'tron:728126428/slip44:bandwidth',
            isNative: true,
            image:
              'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/tron/info/logo.png',
            name: 'Bandwidth',
            symbol: 'BANDWIDTH',
            accountId: 'de5c3465-d01e-4091-a219-232903e982bb',
            decimals: 0,
            rawBalance: '0x0',
            balance: '0',
            chainId: 'tron:728126428',
            fiat: undefined,
          },
          {
            accountType: 'tron:eoa',
            assetId: 'tron:728126428/slip44:maximum-bandwidth',
            isNative: true,
            image:
              'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/tron/info/logo.png',
            name: 'Max Bandwidth',
            symbol: 'MAX-BANDWIDTH',
            accountId: 'de5c3465-d01e-4091-a219-232903e982bb',
            decimals: 0,
            rawBalance: '0x0',
            balance: '0',
            chainId: 'tron:728126428',
            fiat: undefined,
          },
          {
            accountType: 'tron:eoa',
            assetId: 'tron:728126428/slip44:energy',
            isNative: true,
            image:
              'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/tron/info/logo.png',
            name: 'Energy',
            symbol: 'ENERGY',
            accountId: 'de5c3465-d01e-4091-a219-232903e982bb',
            decimals: 0,
            rawBalance: '0x0',
            balance: '0',
            chainId: 'tron:728126428',
            fiat: undefined,
          },
          {
            accountType: 'tron:eoa',
            assetId: 'tron:728126428/slip44:maximum-energy',
            isNative: true,
            image:
              'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/tron/info/logo.png',
            name: 'Max Energy',
            symbol: 'MAX-ENERGY',
            accountId: 'de5c3465-d01e-4091-a219-232903e982bb',
            decimals: 0,
            rawBalance: '0x0',
            balance: '0',
            chainId: 'tron:728126428',
            fiat: undefined,
          },
        ],
        'tron:3448148188': [
          {
            accountType: 'tron:eoa',
            assetId: 'tron:3448148188/slip44:195',
            isNative: true,
            image:
              'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/tron/info/logo.png',
            name: 'Tron',
            symbol: 'TRX',
            accountId: 'de5c3465-d01e-4091-a219-232903e982bb',
            decimals: 6,
            rawBalance: '0x0',
            balance: '0',
            chainId: 'tron:3448148188',
            fiat: undefined,
          },
          {
            accountType: 'tron:eoa',
            assetId: 'tron:3448148188/slip44:195-staked-for-bandwidth',
            isNative: true,
            image:
              'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/tron/info/logo.png',
            name: 'Staked for Bandwidth',
            symbol: 'sTRX-BANDWIDTH',
            accountId: 'de5c3465-d01e-4091-a219-232903e982bb',
            decimals: 6,
            rawBalance: '0x0',
            balance: '0',
            chainId: 'tron:3448148188',
            fiat: undefined,
          },
          {
            accountType: 'tron:eoa',
            assetId: 'tron:3448148188/slip44:195-staked-for-energy',
            isNative: true,
            image:
              'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/tron/info/logo.png',
            name: 'Staked for Energy',
            symbol: 'sTRX-ENERGY',
            accountId: 'de5c3465-d01e-4091-a219-232903e982bb',
            decimals: 6,
            rawBalance: '0x0',
            balance: '0',
            chainId: 'tron:3448148188',
            fiat: undefined,
          },
          {
            accountType: 'tron:eoa',
            assetId: 'tron:3448148188/slip44:bandwidth',
            isNative: true,
            image:
              'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/tron/info/logo.png',
            name: 'Bandwidth',
            symbol: 'BANDWIDTH',
            accountId: 'de5c3465-d01e-4091-a219-232903e982bb',
            decimals: 0,
            rawBalance: '0x0',
            balance: '0',
            chainId: 'tron:3448148188',
            fiat: undefined,
          },
          {
            accountType: 'tron:eoa',
            assetId: 'tron:3448148188/slip44:maximum-bandwidth',
            isNative: true,
            image:
              'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/tron/info/logo.png',
            name: 'Max Bandwidth',
            symbol: 'MAX-BANDWIDTH',
            accountId: 'de5c3465-d01e-4091-a219-232903e982bb',
            decimals: 0,
            rawBalance: '0x0',
            balance: '0',
            chainId: 'tron:3448148188',
            fiat: undefined,
          },
          {
            accountType: 'tron:eoa',
            assetId: 'tron:3448148188/slip44:energy',
            isNative: true,
            image:
              'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/tron/info/logo.png',
            name: 'Energy',
            symbol: 'ENERGY',
            accountId: 'de5c3465-d01e-4091-a219-232903e982bb',
            decimals: 0,
            rawBalance: '0x0',
            balance: '0',
            chainId: 'tron:3448148188',
            fiat: undefined,
          },
          {
            accountType: 'tron:eoa',
            assetId: 'tron:3448148188/slip44:maximum-energy',
            isNative: true,
            image:
              'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/tron/info/logo.png',
            name: 'Max Energy',
            symbol: 'MAX-ENERGY',
            accountId: 'de5c3465-d01e-4091-a219-232903e982bb',
            decimals: 0,
            rawBalance: '0x0',
            balance: '0',
            chainId: 'tron:3448148188',
            fiat: undefined,
          },
        ],
        'tron:2494104990': [
          {
            accountType: 'tron:eoa',
            assetId: 'tron:2494104990/slip44:195',
            isNative: true,
            image:
              'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/tron/info/logo.png',
            name: 'Tron',
            symbol: 'TRX',
            accountId: 'de5c3465-d01e-4091-a219-232903e982bb',
            decimals: 6,
            rawBalance: '0x0',
            balance: '0',
            chainId: 'tron:2494104990',
            fiat: undefined,
          },
          {
            accountType: 'tron:eoa',
            assetId: 'tron:2494104990/slip44:195-staked-for-bandwidth',
            isNative: true,
            image:
              'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/tron/info/logo.png',
            name: 'Staked for Bandwidth',
            symbol: 'sTRX-BANDWIDTH',
            accountId: 'de5c3465-d01e-4091-a219-232903e982bb',
            decimals: 6,
            rawBalance: '0x0',
            balance: '0',
            chainId: 'tron:2494104990',
            fiat: undefined,
          },
          {
            accountType: 'tron:eoa',
            assetId: 'tron:2494104990/slip44:195-staked-for-energy',
            isNative: true,
            image:
              'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/tron/info/logo.png',
            name: 'Staked for Energy',
            symbol: 'sTRX-ENERGY',
            accountId: 'de5c3465-d01e-4091-a219-232903e982bb',
            decimals: 6,
            rawBalance: '0x0',
            balance: '0',
            chainId: 'tron:2494104990',
            fiat: undefined,
          },
          {
            accountType: 'tron:eoa',
            assetId: 'tron:2494104990/slip44:bandwidth',
            isNative: true,
            image:
              'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/tron/info/logo.png',
            name: 'Bandwidth',
            symbol: 'BANDWIDTH',
            accountId: 'de5c3465-d01e-4091-a219-232903e982bb',
            decimals: 0,
            rawBalance: '0x0',
            balance: '0',
            chainId: 'tron:2494104990',
            fiat: undefined,
          },
          {
            accountType: 'tron:eoa',
            assetId: 'tron:2494104990/slip44:maximum-bandwidth',
            isNative: true,
            image:
              'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/tron/info/logo.png',
            name: 'Max Bandwidth',
            symbol: 'MAX-BANDWIDTH',
            accountId: 'de5c3465-d01e-4091-a219-232903e982bb',
            decimals: 0,
            rawBalance: '0x0',
            balance: '0',
            chainId: 'tron:2494104990',
            fiat: undefined,
          },
          {
            accountType: 'tron:eoa',
            assetId: 'tron:2494104990/slip44:energy',
            isNative: true,
            image:
              'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/tron/info/logo.png',
            name: 'Energy',
            symbol: 'ENERGY',
            accountId: 'de5c3465-d01e-4091-a219-232903e982bb',
            decimals: 0,
            rawBalance: '0x0',
            balance: '0',
            chainId: 'tron:2494104990',
            fiat: undefined,
          },
          {
            accountType: 'tron:eoa',
            assetId: 'tron:2494104990/slip44:maximum-energy',
            isNative: true,
            image:
              'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/tron/info/logo.png',
            name: 'Max Energy',
            symbol: 'MAX-ENERGY',
            accountId: 'de5c3465-d01e-4091-a219-232903e982bb',
            decimals: 0,
            rawBalance: '0x0',
            balance: '0',
            chainId: 'tron:2494104990',
            fiat: undefined,
          },
        ],
      });

    const result = getAssetsBySelectedAccountGroup(mockState);

    expect(selectorMock).toHaveBeenCalled();
    expect(result[TrxScope.Mainnet]).toHaveLength(1);
    expect(result[TrxScope.Nile]).toHaveLength(1);
    expect(result[TrxScope.Shasta]).toHaveLength(1);
  });
});

describe('getAsset', () => {
  beforeEach(() => {
    getAssetsBySelectedAccountGroup.memoizedResultFunc.clearCache();
  });

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
      allIgnoredAssets: 'mockAllIgnoredAssets',
      balances: 'mockBalances',
      conversionRates: 'mockConversionRates',
      testId: 'yyyy',
    },
  };

  it('returns the asset for the given assetId and chainId', () => {
    const selectorMock = jest.mocked(selectAssetsBySelectedAccountGroup);
    const selectorMockResult = {
      '0x1': [
        {
          accountType: 'eip155:eoa',
          accountId: 'd7f11451-9d79-4df4-a012-afd253443639',
          chainId: '0x1',
          assetId: '0x0000000000000000000000000000000000000000',
          address: '0x0000000000000000000000000000000000000000',
          image: '',
          name: 'Ethereum',
          symbol: 'ETH',
          isNative: true,
          decimals: 18,
          rawBalance: '0x8AC7230489E80000',
          balance: '10',
          fiat: {
            balance: 24000,
            conversionRate: 2400,
            currency: 'USD',
          },
        },
      ],
      'bip122:000000000019d6689c085ae165831e93': [
        {
          accountType: 'bip122:p2wpkh',
          accountId: '2d89e6a0-b4e6-45a8-a707-f10cef143b42',
          chainId: 'bip122:000000000019d6689c085ae165831e93',
          assetId: 'bip122:000000000019d6689c085ae165831e93/slip44:0',
          image: '',
          name: 'Bitcoin',
          symbol: 'BTC',
          isNative: true,
          decimals: 9,
          rawBalance: '0x2540be400',
          balance: '10',
          fiat: {
            balance: 1635.5,
            conversionRate: 163.55,
            currency: 'USD',
          },
        },
      ],
    } as AccountGroupAssets;
    selectorMock.mockReturnValueOnce(selectorMockResult);

    const result = getAsset(
      mockState,
      'bip122:000000000019d6689c085ae165831e93/slip44:0',
      'bip122:000000000019d6689c085ae165831e93',
    );
    expect(result).toStrictEqual({
      accountType: 'bip122:p2wpkh',
      accountId: '2d89e6a0-b4e6-45a8-a707-f10cef143b42',
      chainId: 'bip122:000000000019d6689c085ae165831e93',
      assetId: 'bip122:000000000019d6689c085ae165831e93/slip44:0',
      image: '',
      name: 'Bitcoin',
      symbol: 'BTC',
      isNative: true,
      decimals: 9,
      rawBalance: '0x2540be400',
      balance: '10',
      fiat: {
        balance: 1635.5,
        conversionRate: 163.55,
        currency: 'USD',
      },
    });
  });
});
