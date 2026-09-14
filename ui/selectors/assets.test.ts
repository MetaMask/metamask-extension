import {
  EthScope,
  SolAccountType,
  SolScope,
  XlmAccountType,
  XlmScope,
} from '@metamask/keyring-api';
import { CaipAssetType } from '@metamask/utils';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { AVAILABLE_MULTICHAIN_NETWORK_CONFIGURATIONS } from '@metamask/multichain-network-controller';
import { cloneDeep } from 'lodash';
import {
  selectAllAssets,
  selectAssetsBySelectedAccountGroup,
} from '@metamask/assets-controllers';
import type { AccountGroupAssets } from '@metamask/assets-controllers';
import type { MetaMaskReduxState } from '../store/store';
import { createMockInternalAccount } from '../../test/jest/mocks';
import {
  AssetsRatesState,
  AssetsState,
  getAccountAssets,
  getAssetsInfo,
  getAssetsMetadata,
  getAssetsBalance,
  selectIsAssetInAssetsBalance,
  getAssetsPrice,
  getAssetPreferences,
  getCustomAssets,
  getSelectedCurrency,
  getAssetsRates,
  getMultiChainAssets,
  getMultichainNativeAssetType,
  getTokenByAccountAndAddressAndChainId,
  getHistoricalMultichainAggregatedBalance,
  selectBalanceForAllWallets,
  selectBalanceByAccountGroup,
  selectBalanceByWallet,
  type BalanceCalculationState,
  selectBalanceChangeBySelectedAccountGroup,
  selectAccountGroupBalanceForEmptyState,
  selectAccountGroupBalanceIsLoadedForEmptyState,
  getAssetsByAccountGroupId,
  getAssetsBySelectedAccountGroup,
  getAssetsBySelectedAccountGroupIncludingHidden,
  getAsset,
  getFungibleAssetForRoute,
  getAssetsBySelectedAccountGroupWithTronSpecialAssets,
} from './assets';

/**
 * State shape for asset selector tests. Cast to this when passing partial state
 * to selectors that accept a full Redux state type.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AssetSelectorTestState = any;

const mockGetAggregatedBalanceForAccount = jest.fn(
  (..._args: unknown[]) => undefined,
);
const mockCalculateBalanceForAllWalletsFromUnified = jest.fn(
  (..._args: unknown[]) => ({
    wallets: {},
    totalBalanceInUserCurrency: 0,
    userCurrency: 'usd',
  }),
);
const mockCalculateBalanceChangeForAccountGroupFromUnified = jest.fn(
  (..._args: unknown[]) => ({
    period: '1d',
    currentTotalInUserCurrency: 0,
    previousTotalInUserCurrency: 0,
    amountChangeInUserCurrency: 0,
    percentChange: 0,
    userCurrency: 'usd',
  }),
);
jest.mock('@metamask/assets-controller', () => ({
  getAggregatedBalanceForAccount: (...args: unknown[]) =>
    mockGetAggregatedBalanceForAccount(...args),
  calculateBalanceForAllWallets: (...args: unknown[]) =>
    mockCalculateBalanceForAllWalletsFromUnified(...args),
  calculateBalanceChangeForAccountGroup: (...args: unknown[]) =>
    mockCalculateBalanceChangeForAccountGroupFromUnified(...args),
  // The getter selectors fall back to this default state; return empty maps so
  // the "missing → empty" getter expectations hold in tests.
  getDefaultAssetsControllerState: () => ({
    assetsInfo: {},
    assetsBalance: {},
    assetsPrice: {},
    assetPreferences: {},
    customAssets: {},
    selectedCurrency: 'usd',
  }),
}));

jest.mock('@metamask/assets-controllers', () => {
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
    selectAssetsBySelectedAccountGroup: jest.fn(() => ({})), // Returns empty object by default
    selectAllAssets: jest.fn(() => ({})),
  };
});

const SOLANA_ACCOUNT_ID = '5132883f-598e-482c-a02b-84eeaa352f5b';
const SOL_NATIVE_ASSET_ID =
  'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501' as CaipAssetType;
const SOL_USDC_ASSET_ID =
  'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' as CaipAssetType;
const RATE_ASSET_1 =
  'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:Token1Mint111111111111111111111111111' as CaipAssetType;
const RATE_ASSET_2 =
  'bip122:000000000019d6689c085ae165831e93/slip44:0' as CaipAssetType;

const mockSolanaAccount = {
  id: SOLANA_ACCOUNT_ID,
  address: '8A4AptCThfbuknsbteHgGKXczfJpfjuVA9SLTSGaaLGC',
  type: 'solana:data-account',
  scopes: [SolScope.Mainnet],
};

const mockRatesState = {
  metamask: {
    assetsPrice: {
      [RATE_ASSET_1]: {
        assetPriceType: 'fungible',
        price: 1.5,
        usdPrice: 1.5,
        lastUpdated: 1000,
      },
      [RATE_ASSET_2]: {
        assetPriceType: 'fungible',
        price: 0.8,
        usdPrice: 0.8,
        lastUpdated: 2000,
      },
    },
  },
};

const expectedDerivedAssetsRates = {
  [RATE_ASSET_1]: {
    rate: '1.5',
    conversionTime: 1000,
    expirationTime: undefined,
    marketData: {
      fungible: true,
      allTimeHigh: undefined,
      allTimeLow: undefined,
      circulatingSupply: undefined,
      marketCap: undefined,
      totalVolume: undefined,
      pricePercentChange: {
        PT1H: undefined,
        P1D: undefined,
        P7D: undefined,
        P14D: undefined,
        P30D: undefined,
        P200D: undefined,
        P1Y: undefined,
      },
    },
  },
  [RATE_ASSET_2]: {
    rate: '0.8',
    conversionTime: 2000,
    expirationTime: undefined,
    marketData: {
      fungible: true,
      allTimeHigh: undefined,
      allTimeLow: undefined,
      circulatingSupply: undefined,
      marketCap: undefined,
      totalVolume: undefined,
      pricePercentChange: {
        PT1H: undefined,
        P1D: undefined,
        P7D: undefined,
        P14D: undefined,
        P30D: undefined,
        P200D: undefined,
        P1Y: undefined,
      },
    },
  },
};

// Mock state for testing (unified AssetsController fields)
const mockAssetsState: AssetSelectorTestState = {
  metamask: {
    internalAccounts: {
      accounts: {
        [SOLANA_ACCOUNT_ID]: mockSolanaAccount,
      },
      selectedAccount: SOLANA_ACCOUNT_ID,
    },
    assetsInfo: {
      [SOL_NATIVE_ASSET_ID]: {
        type: 'native',
        name: 'Token 1',
        symbol: 'TKN1',
        decimals: 9,
        image: 'https://example.com/token-1.png',
      },
    },
    assetsBalance: {
      [SOLANA_ACCOUNT_ID]: {
        [SOL_NATIVE_ASSET_ID]: { amount: '0' },
      },
    },
    customAssets: {},
    assetPreferences: {},
  },
};

const expectedDerivedAccountsAssets = {
  [SOLANA_ACCOUNT_ID]: [SOL_NATIVE_ASSET_ID],
};

const expectedDerivedAssetsMetadata = {
  [SOL_NATIVE_ASSET_ID]: {
    fungible: true,
    iconUrl: 'https://example.com/token-1.png',
    units: [{ decimals: 9, symbol: 'TKN1', name: 'Token 1' }],
    symbol: 'TKN1',
    name: 'Token 1',
  },
};

describe('getAccountAssets', () => {
  it('returns the assets from the state', () => {
    const result = getAccountAssets(mockAssetsState);
    expect(result).toEqual(expectedDerivedAccountsAssets);
  });
});

describe('getAssetsMetadata', () => {
  it('returns the assets metadata from the state', () => {
    const result = getAssetsMetadata(mockAssetsState);
    expect(result).toEqual(expectedDerivedAssetsMetadata);
  });

  it('returns empty object when state has no metamask property', () => {
    const invalidState = {} as AssetsState;
    expect(getAssetsMetadata(invalidState)).toEqual({});
  });

  it('returns empty object when assetsInfo is missing', () => {
    const state = { metamask: {} };
    expect(getAssetsMetadata(state as AssetsState)).toEqual({});
  });
});

describe('getAssetsInfo', () => {
  it('returns assetsInfo from state.metamask', () => {
    const state: AssetSelectorTestState = {
      metamask: { assetsInfo: { 'eip155:0x1/slip44:60': {} } },
    };
    expect(getAssetsInfo(state)).toEqual(state.metamask?.assetsInfo);
  });

  it('returns empty object when metamask is missing', () => {
    expect(getAssetsInfo({} as AssetSelectorTestState)).toEqual({});
  });

  it('returns empty object when assetsInfo is missing', () => {
    expect(getAssetsInfo({ metamask: {} } as AssetSelectorTestState)).toEqual(
      {},
    );
  });
});

describe('getAssetsBalance', () => {
  it('returns assetsBalance from state.metamask', () => {
    const state: AssetSelectorTestState = {
      metamask: { assetsBalance: { 'eip155:0x1/slip44:60': '100' } },
    };
    expect(getAssetsBalance(state)).toEqual(state.metamask?.assetsBalance);
  });

  it('returns empty object when metamask is missing', () => {
    expect(getAssetsBalance({} as AssetSelectorTestState)).toEqual({});
  });

  it('returns empty object when assetsBalance is missing', () => {
    expect(
      getAssetsBalance({ metamask: {} } as AssetSelectorTestState),
    ).toEqual({});
  });
});

describe('selectIsAssetInAssetsBalance', () => {
  const evmAccountId = 'evm-account-id';
  const solanaAccountId = 'solana-account-id';
  const otherGroupAccountId = 'other-group-account-id';
  const walletId = 'entropy:01JKAF3DSGM3AB87EM9N0K41AJ';
  const groupId = `${walletId}/0`;
  const assetId = 'eip155:1/erc20:0xabc' as CaipAssetType;
  const solanaAssetId =
    'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:abc' as CaipAssetType;

  const evmAccount = createMockInternalAccount({
    id: evmAccountId,
    address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
    name: 'Test Account',
  });
  const solanaAccount = createMockInternalAccount({
    id: solanaAccountId,
    address: '7EcDhSYGxXyscszYEp35KHN8vvw3svAuLKTzXwCFLtV',
    type: SolAccountType.DataAccount,
    name: 'Test Solana Account',
  });
  const otherGroupAccount = createMockInternalAccount({
    id: otherGroupAccountId,
    address: '0xec1adf982415d2ef5ec55899b9bfb8bc0f29251b',
    name: 'Other Account',
  });

  const buildState = ({
    assetsBalance = {},
    selectedAccountGroup = groupId,
  }: {
    assetsBalance?: Record<string, unknown>;
    selectedAccountGroup?: string | null;
  }): AssetSelectorTestState => ({
    metamask: {
      selectedAccountGroup,
      accountTree: {
        wallets: {
          [walletId]: {
            id: walletId,
            type: 'entropy',
            groups: {
              [groupId]: {
                id: groupId,
                type: 'multichain-account',
                // The selected group holds both accounts; the third account
                // below belongs to another group.
                accounts: [evmAccountId, solanaAccountId],
                metadata: { name: 'Account 1' },
              },
            },
            metadata: { name: 'Wallet 1' },
          },
        },
      },
      internalAccounts: {
        accounts: {
          [evmAccountId]: evmAccount,
          [solanaAccountId]: solanaAccount,
          [otherGroupAccountId]: otherGroupAccount,
        },
        selectedAccount: evmAccountId,
      },
      assetsBalance,
    },
  });

  it('returns true when an account in the selected group holds the asset', () => {
    const state = buildState({
      assetsBalance: { [evmAccountId]: { [assetId]: { amount: '1' } } },
    });

    expect(selectIsAssetInAssetsBalance(state, assetId)).toBe(true);
  });

  it('returns true when a non-selected account in the group holds the asset', () => {
    const state = buildState({
      assetsBalance: {
        [solanaAccountId]: { [solanaAssetId]: { amount: '1' } },
      },
    });

    expect(selectIsAssetInAssetsBalance(state, solanaAssetId)).toBe(true);
  });

  it('returns true when the asset reference casing differs', () => {
    const state = buildState({
      assetsBalance: {
        [evmAccountId]: { 'eip155:1/erc20:0xABC': { amount: '1' } },
      },
    });

    expect(selectIsAssetInAssetsBalance(state, assetId)).toBe(true);
  });

  it('returns false when no account in the group holds the asset', () => {
    const state = buildState({
      assetsBalance: {
        [evmAccountId]: { 'eip155:1/erc20:0xdef': { amount: '1' } },
      },
    });

    expect(selectIsAssetInAssetsBalance(state, assetId)).toBe(false);
  });

  it('returns false when the group accounts have no assetsBalance entry', () => {
    const state = buildState({ assetsBalance: {} });

    expect(selectIsAssetInAssetsBalance(state, assetId)).toBe(false);
  });

  it('returns false when only an account outside the group holds the asset', () => {
    const state = buildState({
      assetsBalance: {
        [otherGroupAccountId]: { [assetId]: { amount: '1' } },
      },
    });

    expect(selectIsAssetInAssetsBalance(state, assetId)).toBe(false);
  });

  it('returns false when there is no selected account group', () => {
    const state = buildState({
      assetsBalance: { [evmAccountId]: { [assetId]: { amount: '1' } } },
      selectedAccountGroup: null,
    });

    expect(selectIsAssetInAssetsBalance(state, assetId)).toBe(false);
  });
});

describe('getAssetsPrice', () => {
  it('returns assetsPrice from state.metamask', () => {
    const state: AssetSelectorTestState = {
      metamask: { assetsPrice: { 'eip155:0x1/slip44:60': 2000 } },
    };
    expect(getAssetsPrice(state)).toEqual(state.metamask?.assetsPrice);
  });

  it('returns empty object when metamask is missing', () => {
    expect(getAssetsPrice({} as AssetSelectorTestState)).toEqual({});
  });

  it('returns empty object when assetsPrice is missing', () => {
    expect(getAssetsPrice({ metamask: {} } as AssetSelectorTestState)).toEqual(
      {},
    );
  });
});

describe('getAssetPreferences', () => {
  it('returns assetPreferences from state.metamask', () => {
    const state: AssetSelectorTestState = {
      metamask: { assetPreferences: { hideZeroBalanceTokens: true } },
    };
    expect(getAssetPreferences(state)).toEqual(
      state.metamask?.assetPreferences,
    );
  });

  it('returns empty object when metamask is missing', () => {
    expect(getAssetPreferences({} as AssetSelectorTestState)).toEqual({});
  });

  it('returns empty object when assetPreferences is missing', () => {
    expect(
      getAssetPreferences({ metamask: {} } as AssetSelectorTestState),
    ).toEqual({});
  });
});

describe('getCustomAssets', () => {
  it('returns customAssets from state.metamask', () => {
    const state: AssetSelectorTestState = {
      metamask: { customAssets: { 'eip155:0x1/erc20:0xabc': {} } },
    };
    expect(getCustomAssets(state)).toEqual(state.metamask?.customAssets);
  });

  it('returns empty object when metamask is missing', () => {
    expect(getCustomAssets({} as AssetSelectorTestState)).toEqual({});
  });

  it('returns empty object when customAssets is missing', () => {
    expect(getCustomAssets({ metamask: {} } as AssetSelectorTestState)).toEqual(
      {},
    );
  });
});

describe('getSelectedCurrency', () => {
  it('returns selectedCurrency from state.metamask', () => {
    const state: AssetSelectorTestState = {
      metamask: { selectedCurrency: 'eur' },
    };
    expect(getSelectedCurrency(state)).toBe('eur');
  });

  it('returns the default currency when metamask is missing', () => {
    expect(getSelectedCurrency({} as AssetSelectorTestState)).toBe('usd');
  });

  it('returns the default currency when selectedCurrency is missing', () => {
    expect(
      getSelectedCurrency({ metamask: {} } as AssetSelectorTestState),
    ).toBe('usd');
  });
});

describe('getAssetsRates', () => {
  it('returns the assetsRates derived from assetsPrice', () => {
    const result = getAssetsRates(mockRatesState);
    expect(result).toEqual(expectedDerivedAssetsRates);
  });

  it('returns an empty object if assetsPrice is empty', () => {
    const emptyState: AssetSelectorTestState = {
      metamask: { assetsPrice: {} },
    };
    const result = getAssetsRates(emptyState);
    expect(result).toEqual({});
  });

  it('throws if state does not have metamask property', () => {
    const invalidState = {} as AssetsRatesState;
    expect(() => getAssetsRates(invalidState)).toThrow();
  });
});

describe('getMultiChainAssets', () => {
  const mockAccountId = SOLANA_ACCOUNT_ID;

  const mockAssetsInfo = {
    [SOL_NATIVE_ASSET_ID]: {
      type: 'native',
      name: 'Token 1',
      symbol: 'TKN1',
      decimals: 9,
      image: 'https://example.com/token-1.png',
    },
    [SOL_USDC_ASSET_ID]: {
      type: 'token',
      name: 'USDC',
      symbol: 'USDC',
      decimals: 0,
    },
  };

  const mockAssetsBalance = {
    [mockAccountId]: {
      [SOL_NATIVE_ASSET_ID]: { amount: '0.051724127' },
      [SOL_USDC_ASSET_ID]: { amount: '0' },
    },
  };

  const mockInternalAccounts = {
    accounts: {
      [mockAccountId]: mockSolanaAccount,
    },
    selectedAccount: mockAccountId,
  };

  it('returns assets with zero balance with hideZeroBalanceTokens set to false', () => {
    const mockState = {
      metamask: {
        internalAccounts: mockInternalAccounts,
        assetsInfo: mockAssetsInfo,
        assetsBalance: mockAssetsBalance,
        customAssets: {},
        assetsPrice: {},
        preferences: {
          hideZeroBalanceTokens: false,
        },
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
          address: SOL_NATIVE_ASSET_ID,
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
          address: SOL_USDC_ASSET_ID,
          symbol: 'USDC',
          image: '',
          decimals: 0,
          chainId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
          isNative: false,
          balance: '0',
          secondary: null,
        }),
      ]),
    );
  });
  it('does not return assets with zero balance with hideZeroBalanceTokens set to true', () => {
    const mockState = {
      metamask: {
        internalAccounts: mockInternalAccounts,
        assetsInfo: mockAssetsInfo,
        assetsBalance: mockAssetsBalance,
        customAssets: {},
        assetsPrice: {},
        preferences: {
          hideZeroBalanceTokens: true,
        },
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
          address: SOL_NATIVE_ASSET_ID,
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
        internalAccounts: mockInternalAccounts,
        assetsInfo: mockAssetsInfo,
        assetsBalance: mockAssetsBalance,
        customAssets: {},
        assetsPrice: {},
        preferences: {
          hideZeroBalanceTokens: false,
        },
      },
    };
    // getMultiChainAssets uses createSelector (weakMapMemoize) which keys the
    // cache on argument *references*.  Use the same account object both times so
    // the second call is a cache hit and the result is the same reference.
    const account = { address: '0xAddress', id: mockAccountId };
    const result1 = getMultiChainAssets(mockState, account);
    const result2 = getMultiChainAssets(mockState, account);
    expect(result1 === result2).toBe(true);
  });
});

describe('getTokenByAccountAndAddressAndChainId', () => {
  const evmAccountId = '81b1ead4-334c-4921-9adf-282fde539752';
  const evmAddress = '0x458036e7bc0612e9b207640dc07ca7711346aae5';
  const evmAddressChecksummed = '0x458036e7Bc0612e9b207640Dc07Ca7711346AAE5';
  const token2AssetId = `eip155:1/erc20:${evmAddress}` as CaipAssetType;

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
                accounts: [evmAccountId, SOLANA_ACCOUNT_ID],
                metadata: {
                  name: 'Account 1',
                  entropy: {
                    groupIndex: 0,
                  },
                  hidden: false,
                  pinned: false,
                  lastSelected: 0,
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
      },
      selectedAccountGroup: 'entropy:01JKAF3DSGM3AB87EM9N0K41AJ/0',
      internalAccounts: {
        accounts: {
          [evmAccountId]: {
            id: evmAccountId,
            address: evmAddress,
            type: 'eip155:eoa',
            scopes: [EthScope.Eoa],
            metadata: {
              name: 'Account 1',
              keyring: { type: 'HD Key Tree' },
              lastSelected: 1,
            },
            options: {},
            methods: [],
          },
          [SOLANA_ACCOUNT_ID]: {
            id: SOLANA_ACCOUNT_ID,
            address: '8A4AptCThfbuknsbteHgGKXczfJpfjuVA9SLTSGaaLGC',
            type: 'solana:data-account',
            scopes: [SolScope.Mainnet],
            metadata: {
              name: 'Solana Account',
              keyring: { type: 'Snap Keyring' },
              lastSelected: 0,
            },
            options: {},
            methods: [],
          },
        },
        selectedAccount: evmAccountId,
      },
      assetsInfo: {
        [token2AssetId]: {
          type: 'erc20',
          name: 'Token 2',
          symbol: 'TKN2',
          decimals: 18,
        },
        [SOL_NATIVE_ASSET_ID]: {
          type: 'native',
          name: 'Token 1',
          symbol: 'TKN1',
          decimals: 9,
          image: 'https://example.com/token-1.png',
        },
      },
      assetsBalance: {
        [evmAccountId]: {
          [token2AssetId]: { amount: '0' },
        },
        [SOLANA_ACCOUNT_ID]: {
          [SOL_NATIVE_ASSET_ID]: { amount: '0' },
        },
      },
      customAssets: {},
      assetsPrice: {},
      assetPreferences: {},
      preferences: {
        hideZeroBalanceTokens: false,
      },
      completedOnboarding: true,
    },
  };

  // Deleted: "returns null if chainId is undefined" — undefined chainId now
  // throws inside non-EVM account resolution (isEvmChainId returns false for
  // non-strings), so that legacy null-return path cannot be reproduced.

  it('returns null when no tokens exist for the chain', () => {
    const result = getTokenByAccountAndAddressAndChainId(
      mockState,
      undefined,
      evmAddress,
      '0x999',
    );
    expect(result).toBeNull();
  });

  describe('when the passed account is an EVM account', () => {
    const account = mockState.metamask.internalAccounts.accounts[
      evmAccountId
    ] as unknown as InternalAccount;

    it('returns the token from the state', () => {
      const result = getTokenByAccountAndAddressAndChainId(
        mockState,
        account,
        evmAddress,
        '0x1',
      );
      expect(result).toEqual({
        address: evmAddressChecksummed,
        symbol: 'TKN2',
        decimals: 18,
        name: 'Token 2',
        image: undefined,
        chainId: '0x1',
        isNative: false,
      });
    });
  });

  describe('when the passed account is a non-EVM account', () => {
    const account = mockState.metamask.internalAccounts.accounts[
      SOLANA_ACCOUNT_ID
    ] as unknown as InternalAccount;

    it('returns the token from the state', () => {
      const result = getTokenByAccountAndAddressAndChainId(
        mockState,
        account,
        SOL_NATIVE_ASSET_ID,
        'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
      );

      expect(result).toEqual({
        address: SOL_NATIVE_ASSET_ID,
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
    it('uses the selected account to return the token from the state', () => {
      const account = undefined;
      const mockStateWithSelectedAccount = cloneDeep(mockState);
      mockStateWithSelectedAccount.metamask.internalAccounts.selectedAccount =
        SOLANA_ACCOUNT_ID;

      const result = getTokenByAccountAndAddressAndChainId(
        mockStateWithSelectedAccount,
        account,
        SOL_NATIVE_ASSET_ID,
        'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
      );

      expect(result).toEqual({
        address: SOL_NATIVE_ASSET_ID,
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

  describe('when account is undefined and selectedAccountGroup is null', () => {
    it('returns null without crashing (deeplink guard)', () => {
      const mockStateNoGroup = cloneDeep(mockState);
      mockStateNoGroup.metamask.selectedAccountGroup =
        null as unknown as string;
      mockStateNoGroup.metamask.internalAccounts.selectedAccount =
        SOLANA_ACCOUNT_ID;

      const result = getTokenByAccountAndAddressAndChainId(
        mockStateNoGroup,
        undefined,
        SOL_NATIVE_ASSET_ID,
        'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
      );

      expect(result).toBeNull();
    });
  });

  describe('when account is undefined and no account in the group matches the non-EVM chainId', () => {
    it('returns null without crashing', () => {
      const mockStateNoMatchingAccount = cloneDeep(mockState);
      mockStateNoMatchingAccount.metamask.internalAccounts.selectedAccount =
        SOLANA_ACCOUNT_ID;
      // Override the Solana account's scopes so it no longer matches the queried chain
      mockStateNoMatchingAccount.metamask.internalAccounts.accounts[
        SOLANA_ACCOUNT_ID
      ].scopes = [EthScope.Eoa] as unknown as SolScope[];

      const result = getTokenByAccountAndAddressAndChainId(
        mockStateNoMatchingAccount,
        undefined,
        SOL_NATIVE_ASSET_ID,
        'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
      );

      expect(result).toBeNull();
    });
  });
});

describe('getMultichainNativeAssetType', () => {
  const mockState = {
    metamask: {
      internalAccounts: {
        accounts: {
          [SOLANA_ACCOUNT_ID]: {
            id: SOLANA_ACCOUNT_ID,
            address: '8A4AptCThfbuknsbteHgGKXczfJpfjuVA9SLTSGaaLGC',
            type: 'solana:data-account',
          },
        },
        selectedAccount: SOLANA_ACCOUNT_ID,
      },
      assetsBalance: {
        [SOLANA_ACCOUNT_ID]: {
          [SOL_NATIVE_ASSET_ID]: { amount: '0' },
          [SOL_USDC_ASSET_ID]: { amount: '0' },
        },
      },
      customAssets: {},
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
    it('returns the native asset type', () => {
      const result = getMultichainNativeAssetType(mockState);

      expect(result).toEqual(SOL_NATIVE_ASSET_ID);
    });
  });

  describe('when a native asset type is not available', () => {
    const mockStateWithoutNativeAssetType = cloneDeep(mockState);
    mockStateWithoutNativeAssetType.metamask.assetsBalance[SOLANA_ACCOUNT_ID] =
      {
        [SOL_USDC_ASSET_ID]: { amount: '0' },
      };

    it('returns undefined', () => {
      const result = getMultichainNativeAssetType(
        mockStateWithoutNativeAssetType,
      );

      expect(result).toBeUndefined();
    });
  });
});

describe('getHistoricalMultichainAggregatedBalance', () => {
  const mockAccountId = SOLANA_ACCOUNT_ID;

  const mockInternalAccounts = {
    accounts: {
      [mockAccountId]: mockSolanaAccount,
    },
    selectedAccount: mockAccountId,
  };

  const mockAssetsInfo = {
    [SOL_NATIVE_ASSET_ID]: {
      type: 'native',
      name: 'SOL',
      symbol: 'SOL',
      decimals: 9,
    },
    [SOL_USDC_ASSET_ID]: {
      type: 'token',
      name: 'USDC',
      symbol: 'USDC',
      decimals: 6,
    },
  };

  const mockAssetsBalance = {
    [mockAccountId]: {
      [SOL_NATIVE_ASSET_ID]: { amount: '100' },
      [SOL_USDC_ASSET_ID]: { amount: '50' },
    },
  };

  const mockAssetsPrice = {
    [SOL_NATIVE_ASSET_ID]: {
      assetPriceType: 'fungible',
      price: 10,
      usdPrice: 10,
      lastUpdated: 1000,
      pricePercentChange1d: 5,
      pricePercentChange7d: -2,
    },
    [SOL_USDC_ASSET_ID]: {
      assetPriceType: 'fungible',
      price: 1,
      usdPrice: 1,
      lastUpdated: 1000,
      pricePercentChange1d: 10,
      pricePercentChange7d: 5,
    },
  };

  const mockState = {
    metamask: {
      internalAccounts: mockInternalAccounts,
      assetsInfo: mockAssetsInfo,
      assetsBalance: mockAssetsBalance,
      customAssets: {},
      assetsPrice: mockAssetsPrice,
    },
  };

  it('calculates historical balances, percent changes, and amount changes correctly', () => {
    const result = getHistoricalMultichainAggregatedBalance(mockState, {
      id: mockAccountId,
    });

    expect(result.P1D).toEqual({
      balance: 997.8354978354979,
      percentChange: 5.22776573,
      amountChange: 52.16450216,
    });
  });

  it('handles assets without price data', () => {
    // Assets still listed in balance, but only USDC has assetsPrice (market data).
    // Legacy conversionRates-without-marketData is no longer representable once rates
    // are derived from assetsPrice (which always nests pricePercentChange).
    const noMarketDataState = {
      metamask: {
        internalAccounts: mockInternalAccounts,
        assetsInfo: mockAssetsInfo,
        assetsBalance: mockAssetsBalance,
        customAssets: {},
        assetsPrice: {
          [SOL_USDC_ASSET_ID]: {
            assetPriceType: 'fungible',
            price: 1,
            usdPrice: 1,
            lastUpdated: 1000,
            pricePercentChange1d: 10,
            pricePercentChange7d: 5,
          },
        },
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

  it('returns zero values for all periods when no assets have price data', () => {
    const noMarketDataState = {
      metamask: {
        internalAccounts: mockInternalAccounts,
        assetsInfo: mockAssetsInfo,
        assetsBalance: mockAssetsBalance,
        customAssets: {},
        assetsPrice: {},
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

  it('handles precision correctly', () => {
    const precisionState = {
      metamask: {
        internalAccounts: mockInternalAccounts,
        assetsInfo: mockAssetsInfo,
        assetsBalance: mockAssetsBalance,
        customAssets: {},
        assetsPrice: {
          [SOL_NATIVE_ASSET_ID]: {
            assetPriceType: 'fungible',
            price: 10.123456789,
            usdPrice: 10.123456789,
            lastUpdated: 1000,
            pricePercentChange1d: 5.123456789,
          },
        },
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
    metamask: {
      internalAccounts: { accounts: {}, selectedAccount: '' },
      assetsInfo: {},
      assetsBalance: {},
      assetsPrice: {},
      assetPreferences: {},
      customAssets: {},
      selectedCurrency: 'usd',
    } as unknown as BalanceCalculationState['metamask'],
  };

  it('selectBalanceForAllWallets adapts shapes and calls core calculator once', () => {
    const out = selectBalanceForAllWallets(baseState);
    expect(out).toEqual({
      wallets: {},
      totalBalanceInUserCurrency: 0,
      userCurrency: 'usd',
    });
    expect(mockCalculateBalanceForAllWalletsFromUnified.mock.calls.length).toBe(
      1,
    );

    const args = mockCalculateBalanceForAllWalletsFromUnified.mock.calls[0];
    expect(args[0]).toEqual(
      expect.objectContaining({
        assetsInfo: {},
        assetsBalance: {},
        assetsPrice: {},
        assetPreferences: {},
        customAssets: {},
        selectedCurrency: 'usd',
      }),
    );
    expect(args[1]).toHaveProperty('accountTree');
    expect(args[1]).toHaveProperty('selectedAccountGroup');
    expect(args[2]).toBeDefined(); // enabledNetworkMap
  });

  it('memoizes aggregate output for identical state', () => {
    const a = selectBalanceForAllWallets(baseState);
    const b = selectBalanceForAllWallets(baseState);
    expect(a).toBe(b);
  });

  it('group and wallet readers use aggregate output', () => {
    mockCalculateBalanceForAllWalletsFromUnified.mockReturnValueOnce({
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
      metamask: {
        internalAccounts: { accounts: {}, selectedAccount: '' },
        assetsInfo: {},
        assetsBalance: {},
        assetsPrice: {},
        assetPreferences: {},
        customAssets: {},
        selectedCurrency: 'usd',
      } as unknown as BalanceCalculationState['metamask'],
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
    // createDeepEqualSelector caches by deep input equality across tests;
    // clear so call-count assertions are not affected by earlier describes.
    selectBalanceForAllWallets.clearCache();
    selectBalanceForAllWallets.memoizedResultFunc.clearCache();
  });

  it('does not recompute when unrelated state changes but used slice references are stable', () => {
    // Build stable references for used slices
    const accountTree = { wallets: {} };
    const selectedAccountGroup = '';
    const internalAccounts = { accounts: {}, selectedAccount: '' };
    const assetsInfo = {};
    const assetsBalance = {};
    const assetsPrice = {};
    const assetPreferences = {};
    const customAssets = {};
    const selectedCurrency = 'usd';

    const baseState: BalanceCalculationState = {
      metamask: {
        selectedAccountGroup,
        accountTree,
        internalAccounts,
        assetsInfo,
        assetsBalance,
        assetsPrice,
        assetPreferences,
        customAssets,
        selectedCurrency,
      } as unknown as BalanceCalculationState['metamask'],
    };

    const out1 = selectBalanceForAllWallets(baseState);

    // Unrelated state change: add a non-used field while keeping used refs identical
    const nextState: BalanceCalculationState = {
      metamask: {
        selectedAccountGroup,
        accountTree,
        internalAccounts,
        assetsInfo,
        assetsBalance,
        assetsPrice,
        assetPreferences,
        customAssets,
        selectedCurrency,
        // unrelated field
        remoteFeatureFlags: { foo: true },
      } as unknown as BalanceCalculationState['metamask'],
    };

    const out2 = selectBalanceForAllWallets(nextState);

    // No recompute and referentially equal output
    expect(out1).toBe(out2);
    expect(mockCalculateBalanceForAllWalletsFromUnified.mock.calls.length).toBe(
      1,
    );
  });

  it('recomputes when a relevant slice reference changes (e.g., assetsBalance)', () => {
    const assetsBalanceA = {};
    const assetsBalanceB = { newAccount: {} }; // different references with different values so that selector does not memoize them

    const stateA: BalanceCalculationState = {
      metamask: {
        selectedAccountGroup: '',
        accountTree: { wallets: {} },
        internalAccounts: { accounts: {}, selectedAccount: '' },
        assetsInfo: {},
        assetsBalance: assetsBalanceA,
        assetsPrice: {},
        assetPreferences: {},
        customAssets: {},
        selectedCurrency: 'usd',
      } as unknown as BalanceCalculationState['metamask'],
    };

    const outA = selectBalanceForAllWallets(stateA);

    const stateB: BalanceCalculationState = {
      metamask: {
        ...stateA.metamask,
        assetsBalance: assetsBalanceB, // change relevant input ref
      } as unknown as BalanceCalculationState['metamask'],
    };

    const outB = selectBalanceForAllWallets(stateB);

    // Recompute should have happened at least once more, and outputs not the same ref
    expect(outA).not.toBe(outB);
    expect(
      mockCalculateBalanceForAllWalletsFromUnified.mock.calls.length,
    ).toBeGreaterThan(1);
  });
});

describe('Balance change selectors', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const baseState: BalanceCalculationState = {
    metamask: {
      internalAccounts: { accounts: {}, selectedAccount: '' },
    } as unknown as BalanceCalculationState['metamask'],
  };

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
    selectedAccountGroup: 'entropy:wallet1/group1',
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
                lastSelected: 0,
              },
            },
          },
        },
      },
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
        snaps: {},
      } as unknown as BalanceCalculationState['metamask'],
    };
  };

  const createMockStateWithNonEVMNetworks = (
    includeTestnets: boolean = false,
    accountId: string = 'account2',
    accountType: string = 'solana:data-account',
    accountScopes: string[] = [SolScope.Mainnet],
    accountMetadata: Record<string, unknown> = {
      snap: { id: 'npm:@metamask/solana-wallet-snap', enabled: true },
    },
  ): BalanceCalculationState => {
    const multichainNetworks: Record<string, unknown> = {
      'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp': {
        chainId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
        type: 'mainnet',
      }, // Solana mainnet
      [XlmScope.Pubnet]: {
        chainId: XlmScope.Pubnet,
        type: 'mainnet',
      }, // Stellar mainnet
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
      multichainNetworks[XlmScope.Testnet] = {
        chainId: XlmScope.Testnet,
        type: 'testnet',
      }; // Stellar testnet
    }

    const baseState = createBaseMockState(
      accountId,
      accountType,
      accountScopes,
      accountMetadata,
    );

    return {
      metamask: {
        ...baseState,
        networkConfigurationsByChainId: {},
        multichainNetworkConfigurationsByChainId: multichainNetworks,
        snaps: {
          'npm:@metamask/solana-wallet-snap': { enabled: true },
          'npm:@metamask/stellar-wallet-snap': { enabled: true },
        },
      } as unknown as BalanceCalculationState['metamask'],
    };
  };

  const createMockStateWithStellarNetworks = (
    includeTestnets: boolean = false,
  ): BalanceCalculationState => {
    return createMockStateWithNonEVMNetworks(
      includeTestnets,
      'stellar-account',
      XlmAccountType.Account,
      [XlmScope.Pubnet],
      {
        snap: { id: 'npm:@metamask/stellar-wallet-snap', enabled: true },
      },
    );
  };

  const ethNativeAssetId = 'eip155:1/slip44:60' as CaipAssetType;
  const ethSepoliaNativeAssetId = 'eip155:11155111/slip44:60' as CaipAssetType;
  const usdcAssetId =
    'eip155:1/erc20:0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' as CaipAssetType;
  const solTestnetNativeAssetId =
    'solana:4uhcVJyU9pJkvQyS88uRDiswHXSCkY3z/slip44:501' as CaipAssetType;
  const xlmNativeAssetId = `${XlmScope.Pubnet}/slip44:148` as CaipAssetType;
  const xlmTestnetNativeAssetId =
    `${XlmScope.Testnet}/slip44:148` as CaipAssetType;

  const ethNativeInfo = {
    type: 'native' as const,
    symbol: 'ETH',
    decimals: 18,
    name: 'Ether',
  };

  it('returns true when balance is greater than 0 for EVM networks', () => {
    const state = createMockStateWithEVMNetworks();

    state.metamask.assetsInfo = {
      [ethNativeAssetId]: ethNativeInfo,
    };
    state.metamask.assetsBalance = {
      account1: {
        [ethNativeAssetId]: { amount: '10' },
      },
    };

    const result = selectAccountGroupBalanceForEmptyState(state);

    expect(result).toBe(true);
  });

  it('returns true when balance is greater than 0 for non-EVM networks like Solana', () => {
    const state = createMockStateWithNonEVMNetworks();

    state.metamask.assetsInfo = {
      [SOL_NATIVE_ASSET_ID]: {
        type: 'native',
        symbol: 'SOL',
        decimals: 9,
        name: 'Solana',
      },
    };
    state.metamask.assetsBalance = {
      account2: {
        [SOL_NATIVE_ASSET_ID]: { amount: '10.5' },
      },
    };

    const result = selectAccountGroupBalanceForEmptyState(state);

    expect(result).toBe(true);
  });

  it('returns true when balance is greater than 0 for Stellar mainnet', () => {
    const state = createMockStateWithStellarNetworks();

    state.metamask.assetsInfo = {
      [xlmNativeAssetId]: {
        type: 'native',
        symbol: 'XLM',
        decimals: 7,
        name: 'Stellar',
      },
    };
    state.metamask.assetsBalance = {
      'stellar-account': {
        [xlmNativeAssetId]: { amount: '25.5' },
      },
    };

    const result = selectAccountGroupBalanceForEmptyState(state);

    expect(result).toBe(true);
  });

  it('returns false when balance is 0', () => {
    const state = createMockStateWithEVMNetworks();

    state.metamask.assetsInfo = {
      [ethNativeAssetId]: ethNativeInfo,
    };
    state.metamask.assetsBalance = {
      account1: {
        [ethNativeAssetId]: { amount: '0' },
      },
    };

    const result = selectAccountGroupBalanceForEmptyState(state);

    expect(result).toBe(false);
  });

  it('returns true for small positive balances', () => {
    const state = createMockStateWithEVMNetworks();

    state.metamask.assetsInfo = {
      [ethNativeAssetId]: ethNativeInfo,
    };
    state.metamask.assetsBalance = {
      account1: {
        [ethNativeAssetId]: { amount: '0.01' },
      },
    };

    const result = selectAccountGroupBalanceForEmptyState(state);

    expect(result).toBe(true);
  });

  it('returns false when no balances are set', () => {
    const state = createMockStateWithEVMNetworks();

    state.metamask.assetsInfo = {};
    state.metamask.assetsBalance = {};

    const result = selectAccountGroupBalanceForEmptyState(state);

    expect(result).toBe(false);
  });

  it('returns false for loaded state when no mainnet balance records are set', () => {
    const state = createMockStateWithEVMNetworks();

    state.metamask.assetsInfo = {};
    state.metamask.assetsBalance = {};

    const result = selectAccountGroupBalanceIsLoadedForEmptyState(state);

    expect(result).toBe(false);
  });

  it('returns true for loaded state when an EVM mainnet zero balance record exists', () => {
    const state = createMockStateWithEVMNetworks();

    state.metamask.assetsInfo = {
      [ethNativeAssetId]: ethNativeInfo,
    };
    state.metamask.assetsBalance = {
      account1: {
        [ethNativeAssetId]: { amount: '0' },
      },
    };

    const result = selectAccountGroupBalanceIsLoadedForEmptyState(state);

    expect(result).toBe(true);
  });

  it('returns true for loaded state when a non-EVM mainnet zero balance record exists', () => {
    const state = createMockStateWithNonEVMNetworks();

    state.metamask.assetsInfo = {
      [SOL_NATIVE_ASSET_ID]: {
        type: 'native',
        symbol: 'SOL',
        decimals: 9,
        name: 'Solana',
      },
    };
    state.metamask.assetsBalance = {
      account2: {
        [SOL_NATIVE_ASSET_ID]: { amount: '0' },
      },
    };

    const result = selectAccountGroupBalanceIsLoadedForEmptyState(state);

    expect(result).toBe(true);
  });

  it('returns true for loaded state when a Stellar mainnet zero balance record exists', () => {
    const state = createMockStateWithStellarNetworks();

    state.metamask.assetsInfo = {
      [xlmNativeAssetId]: {
        type: 'native',
        symbol: 'XLM',
        decimals: 7,
        name: 'Stellar',
      },
    };
    state.metamask.assetsBalance = {
      'stellar-account': {
        [xlmNativeAssetId]: { amount: '0' },
      },
    };

    const result = selectAccountGroupBalanceIsLoadedForEmptyState(state);

    expect(result).toBe(true);
  });

  it('returns false for loaded state when only testnet balance records exist', () => {
    const state = createMockStateWithEVMNetworks(true);

    state.metamask.assetsInfo = {
      [ethSepoliaNativeAssetId]: ethNativeInfo,
    };
    state.metamask.assetsBalance = {
      account1: {
        [ethSepoliaNativeAssetId]: { amount: '10' },
      },
    };

    const result = selectAccountGroupBalanceIsLoadedForEmptyState(state);

    expect(result).toBe(false);
  });

  it('excludes EVM testnets from balance calculation', () => {
    const state = createMockStateWithEVMNetworks(true); // Include EVM testnets

    state.metamask.assetsInfo = {
      [ethNativeAssetId]: ethNativeInfo,
      [ethSepoliaNativeAssetId]: ethNativeInfo,
    };
    state.metamask.assetsBalance = {
      account1: {
        [ethNativeAssetId]: { amount: '0' },
        [ethSepoliaNativeAssetId]: { amount: '10' },
      },
    };

    const result = selectAccountGroupBalanceForEmptyState(state);

    // Should return false because testnet balance is ignored
    expect(result).toBe(false);
  });

  it('excludes non-EVM testnets like Solana from balance calculation', () => {
    const state = createMockStateWithNonEVMNetworks(true); // Include non-EVM testnets

    state.metamask.assetsInfo = {
      [SOL_NATIVE_ASSET_ID]: {
        type: 'native',
        symbol: 'SOL',
        decimals: 9,
        name: 'Solana',
      },
      [solTestnetNativeAssetId]: {
        type: 'native',
        symbol: 'SOL',
        decimals: 9,
        name: 'Solana',
      },
    };
    state.metamask.assetsBalance = {
      account2: {
        [SOL_NATIVE_ASSET_ID]: { amount: '0' },
        [solTestnetNativeAssetId]: { amount: '10.5' },
      },
    };

    const result = selectAccountGroupBalanceForEmptyState(state);

    // Should return false because testnet balance is ignored
    expect(result).toBe(false);
  });

  it('excludes Stellar testnet from balance calculation', () => {
    const state = createMockStateWithStellarNetworks(true);

    state.metamask.assetsInfo = {
      [xlmNativeAssetId]: {
        type: 'native',
        symbol: 'XLM',
        decimals: 7,
        name: 'Stellar',
      },
      [xlmTestnetNativeAssetId]: {
        type: 'native',
        symbol: 'XLM',
        decimals: 7,
        name: 'Stellar',
      },
    };
    state.metamask.assetsBalance = {
      'stellar-account': {
        [xlmNativeAssetId]: { amount: '0' },
        [xlmTestnetNativeAssetId]: { amount: '100' },
      },
    };

    const result = selectAccountGroupBalanceForEmptyState(state);

    // Should return false because testnet balance is ignored
    expect(result).toBe(false);
  });

  it('returns false for loaded state when only Stellar testnet balance records exist', () => {
    const state = createMockStateWithStellarNetworks(true);

    state.metamask.assetsInfo = {
      [xlmTestnetNativeAssetId]: {
        type: 'native',
        symbol: 'XLM',
        decimals: 7,
        name: 'Stellar',
      },
    };
    state.metamask.assetsBalance = {
      'stellar-account': {
        [xlmTestnetNativeAssetId]: { amount: '100' },
      },
    };

    const result = selectAccountGroupBalanceIsLoadedForEmptyState(state);

    expect(result).toBe(false);
  });

  describe('native token balance checks', () => {
    it('returns true when EVM native token balance exists', () => {
      const state = createMockStateWithEVMNetworks();

      state.metamask.assetsInfo = {
        [ethNativeAssetId]: ethNativeInfo,
      };
      state.metamask.assetsBalance = {
        account1: {
          [ethNativeAssetId]: { amount: '10' },
        },
      };

      const result = selectAccountGroupBalanceForEmptyState(state);

      expect(result).toBe(true);
    });

    it('returns true when non-EVM native token balance exists', () => {
      const state = createMockStateWithNonEVMNetworks();

      state.metamask.assetsInfo = {
        [SOL_NATIVE_ASSET_ID]: {
          type: 'native',
          symbol: 'SOL',
          decimals: 9,
          name: 'Solana',
        },
      };
      state.metamask.assetsBalance = {
        account2: {
          [SOL_NATIVE_ASSET_ID]: { amount: '10.5' },
        },
      };

      const result = selectAccountGroupBalanceForEmptyState(state);

      expect(result).toBe(true);
    });

    it('returns false when no native token balances exist', () => {
      const state = createMockStateWithEVMNetworks();

      state.metamask.assetsInfo = {
        [ethNativeAssetId]: ethNativeInfo,
      };
      state.metamask.assetsBalance = {
        account1: {
          [ethNativeAssetId]: { amount: '0' },
        },
      };

      const result = selectAccountGroupBalanceForEmptyState(state);

      expect(result).toBe(false);
    });

    it('returns false when non-EVM balance is decimal zero like "0.0" or "0.00"', () => {
      const state = createMockStateWithNonEVMNetworks();

      state.metamask.assetsInfo = {
        [SOL_NATIVE_ASSET_ID]: {
          type: 'native',
          symbol: 'SOL',
          decimals: 9,
          name: 'Solana',
        },
      };
      state.metamask.assetsBalance = {
        account2: {
          [SOL_NATIVE_ASSET_ID]: { amount: '0.00' },
        },
      };

      const result = selectAccountGroupBalanceForEmptyState(state);

      expect(result).toBe(false);
    });

    it('returns true when user has ERC-20 tokens but no native tokens', () => {
      const state = createMockStateWithEVMNetworks();

      state.metamask.assetsInfo = {
        [ethNativeAssetId]: ethNativeInfo,
        [usdcAssetId]: {
          type: 'erc20',
          symbol: 'USDC',
          decimals: 6,
          name: 'USD Coin',
        },
      };
      state.metamask.assetsBalance = {
        account1: {
          [ethNativeAssetId]: { amount: '0' },
          [usdcAssetId]: { amount: '1' },
        },
      };
      state.metamask.customAssets = {};

      const result = selectAccountGroupBalanceForEmptyState(state);

      // Should return true because user has non-native tokens
      expect(result).toBe(true);
    });
  });
});

describe('getAssetsByAccountGroupId', () => {
  const ACCOUNT_GROUP_ID = 'entropy:wallet/1';

  const createMockState = (suffix: string): MetaMaskReduxState =>
    ({
      metamask: {
        selectedAccountGroup: `selected-${suffix}`,
        accountTree: 'mockAccountTree',
        internalAccounts: 'mockInternalAccounts',
        networkConfigurationsByChainId: 'mockNetworkConfigurationsByChainId',
        assetsInfo: {},
        assetsBalance: {},
        assetsPrice: {},
        assetPreferences: {},
        customAssets: {},
        selectedCurrency: 'usd',
      },
    }) as unknown as MetaMaskReduxState;

  beforeEach(() => {
    getAssetsByAccountGroupId.clearCache();
    getAssetsByAccountGroupId.memoizedResultFunc.clearCache();
    jest.mocked(selectAllAssets).mockReset();
    jest.mocked(selectAllAssets).mockReturnValue({});
  });

  it('returns an empty map when accountGroupId is undefined', () => {
    const result = getAssetsByAccountGroupId(
      createMockState('undefined-group'),
      undefined,
    );

    expect(result).toStrictEqual({});
    expect(selectAllAssets).not.toHaveBeenCalled();
  });

  it('returns assets for the requested account group', () => {
    const groupAssets = {
      '0x1': [
        {
          address: '0x1111111111111111111111111111111111111111',
          isNative: false,
        },
      ],
    };

    jest.mocked(selectAllAssets).mockReturnValueOnce({
      [ACCOUNT_GROUP_ID]: groupAssets,
      'entropy:wallet/2': {
        '0x1': [{ address: '0x2222222222222222222222222222222222222222' }],
      },
    } as unknown as ReturnType<typeof selectAllAssets>);

    const result = getAssetsByAccountGroupId(
      createMockState('group-assets'),
      ACCOUNT_GROUP_ID as never,
    );

    expect(selectAllAssets).toHaveBeenCalled();
    expect(result).toStrictEqual(groupAssets);
  });

  it('returns an empty map when the account group has no assets', () => {
    jest.mocked(selectAllAssets).mockReturnValueOnce({
      'entropy:wallet/2': {
        '0x1': [{ address: '0x2222222222222222222222222222222222222222' }],
      },
    } as unknown as ReturnType<typeof selectAllAssets>);

    const result = getAssetsByAccountGroupId(
      createMockState('missing-group'),
      ACCOUNT_GROUP_ID as never,
    );

    expect(result).toStrictEqual({});
  });

  it('clears ignored assets when includeHidden is true', () => {
    const groupAssets = {
      '0x1': [
        {
          address: '0x1111111111111111111111111111111111111111',
          isNative: false,
        },
      ],
    };

    jest.mocked(selectAllAssets).mockReturnValueOnce({
      [ACCOUNT_GROUP_ID]: groupAssets,
    } as unknown as ReturnType<typeof selectAllAssets>);

    const result = getAssetsByAccountGroupId(
      createMockState('include-hidden'),
      ACCOUNT_GROUP_ID as never,
      { includeHidden: true },
    );

    expect(selectAllAssets).toHaveBeenCalledWith(
      expect.objectContaining({
        allIgnoredTokens: {},
        allIgnoredAssets: {},
      }),
    );
    expect(result).toStrictEqual(groupAssets);
  });

  it('hides the Arc USDC ERC20 while keeping the native token and other assets', () => {
    const arcNative = {
      address: '0x0000000000000000000000000000000000000000',
      isNative: true,
    };
    const arcUsdcErc20 = {
      address: '0x3600000000000000000000000000000000000000',
      isNative: false,
    };
    const otherToken = {
      address: '0x1111111111111111111111111111111111111111',
      isNative: false,
    };

    jest.mocked(selectAllAssets).mockReturnValueOnce({
      [ACCOUNT_GROUP_ID]: {
        '0x13b2': [arcNative, arcUsdcErc20, otherToken],
        '0x1': [arcUsdcErc20],
      },
    } as unknown as ReturnType<typeof selectAllAssets>);

    const result = getAssetsByAccountGroupId(
      createMockState('arc-filter'),
      ACCOUNT_GROUP_ID as never,
    );

    expect(result['0x13b2']).toStrictEqual([arcNative, otherToken]);
    expect(result['0x1']).toStrictEqual([arcUsdcErc20]);
  });

  it('returns a stable reference when Arc/Stable chains force filterExcludedAssets to allocate', () => {
    const groupAssets = {
      '0x13b2': [
        {
          address: '0x0000000000000000000000000000000000000000',
          isNative: true,
        },
        {
          address: '0x3600000000000000000000000000000000000000',
          isNative: false,
        },
      ],
    };

    jest.mocked(selectAllAssets).mockReturnValue({
      [ACCOUNT_GROUP_ID]: groupAssets,
    } as unknown as ReturnType<typeof selectAllAssets>);

    const state = createMockState('arc-stable-ref');
    const first = getAssetsByAccountGroupId(state, ACCOUNT_GROUP_ID as never);
    const second = getAssetsByAccountGroupId(state, ACCOUNT_GROUP_ID as never);

    expect(first).toBe(second);
    expect(first['0x13b2']).toHaveLength(1);
  });
});

const emptyPreparedAssetListState = {
  selectedAccountGroup: undefined,
  accountTree: 'mockAccountTree',
  internalAccounts: 'mockInternalAccounts',
  allTokens: {},
  allIgnoredTokens: {},
  tokenBalances: {},
  marketData: {},
  currencyRates: {},
  currentCurrency: undefined,
  networkConfigurationsByChainId: 'mockNetworkConfigurationsByChainId',
  accountsByChainId: {},
  accountsAssets: {},
  assetsMetadata: {},
  allIgnoredAssets: {},
  balances: {},
  conversionRates: {},
};

const createUnifiedAssetListMockMetamask = (
  overrides: Record<string, unknown> = {},
) => ({
  accountTree: 'mockAccountTree',
  internalAccounts: 'mockInternalAccounts',
  networkConfigurationsByChainId: 'mockNetworkConfigurationsByChainId',
  assetsInfo: {},
  assetsBalance: {},
  assetsPrice: {},
  assetPreferences: {},
  customAssets: {},
  ...overrides,
});

describe('getAssetsBySelectedAccountGroup', () => {
  beforeEach(() => {
    getAssetsBySelectedAccountGroup.clearCache();
    getAssetsBySelectedAccountGroup.memoizedResultFunc.clearCache();
  });

  const mockState = {
    metamask: createUnifiedAssetListMockMetamask(),
  };

  it('calls the imported selector with the prepared initial state', () => {
    const selectorMock = jest.mocked(selectAssetsBySelectedAccountGroup);
    const selectorMockResult = {};
    selectorMock.mockReturnValueOnce(selectorMockResult);

    const result = getAssetsBySelectedAccountGroup(mockState);

    expect(selectorMock).toHaveBeenCalledWith(emptyPreparedAssetListState);
    expect(result).toStrictEqual(selectorMockResult);
  });

  it('hides the Arc USDC ERC20 while keeping the native token and other assets', () => {
    const arcNative = {
      address: '0x0000000000000000000000000000000000000000',
      isNative: true,
    };
    const arcUsdcErc20 = {
      address: '0x3600000000000000000000000000000000000000',
      isNative: false,
    };
    const otherToken = {
      address: '0x1111111111111111111111111111111111111111',
      isNative: false,
    };

    jest.mocked(selectAssetsBySelectedAccountGroup).mockReturnValueOnce({
      '0x13b2': [arcNative, arcUsdcErc20, otherToken],
      '0x1': [arcUsdcErc20],
    } as unknown as ReturnType<typeof selectAssetsBySelectedAccountGroup>);

    const result = getAssetsBySelectedAccountGroup(mockState);

    // Arc USDC ERC20 removed, native + other token kept.
    expect(result['0x13b2']).toStrictEqual([arcNative, otherToken]);
    // The same address on a non-Arc chain is untouched.
    expect(result['0x1']).toStrictEqual([arcUsdcErc20]);
  });
});

describe('getAssetsBySelectedAccountGroupIncludingHidden', () => {
  beforeEach(() => {
    getAssetsBySelectedAccountGroupIncludingHidden.clearCache();
    getAssetsBySelectedAccountGroupIncludingHidden.memoizedResultFunc.clearCache();
  });

  const mockState = {
    metamask: createUnifiedAssetListMockMetamask(),
  };

  it('calls the imported selector with ignored assets cleared', () => {
    const selectorMock = jest.mocked(selectAssetsBySelectedAccountGroup);
    const selectorMockResult = {};
    selectorMock.mockReturnValueOnce(selectorMockResult);

    const result = getAssetsBySelectedAccountGroupIncludingHidden(mockState);

    expect(selectorMock).toHaveBeenCalledWith({
      ...emptyPreparedAssetListState,
      allIgnoredTokens: {},
      allIgnoredAssets: {},
    });
    expect(result).toStrictEqual(selectorMockResult);
  });

  it('hides the Arc USDC ERC20 from the including-hidden list', () => {
    const arcNative = {
      address: '0x0000000000000000000000000000000000000000',
      isNative: true,
    };
    const arcUsdcErc20 = {
      address: '0x3600000000000000000000000000000000000000',
      isNative: false,
    };

    jest.mocked(selectAssetsBySelectedAccountGroup).mockReturnValueOnce({
      '0x13b2': [arcNative, arcUsdcErc20],
    } as unknown as ReturnType<typeof selectAssetsBySelectedAccountGroup>);

    const result = getAssetsBySelectedAccountGroupIncludingHidden(mockState);

    expect(result['0x13b2']).toStrictEqual([arcNative]);
  });
});

describe('getAssetsBySelectedAccountGroupWithTronSpecialAssets', () => {
  beforeEach(() => {
    getAssetsBySelectedAccountGroupWithTronSpecialAssets.clearCache();
    getAssetsBySelectedAccountGroupWithTronSpecialAssets.memoizedResultFunc.clearCache();
  });

  const mockState = {
    metamask: createUnifiedAssetListMockMetamask(),
  };

  it('calls selector with option to not filter tron special assets', () => {
    const selectorMock = jest
      .mocked(selectAssetsBySelectedAccountGroup)
      .mockReturnValue({});

    const result =
      getAssetsBySelectedAccountGroupWithTronSpecialAssets(mockState);

    expect(selectorMock).toHaveBeenCalledWith(emptyPreparedAssetListState, {
      filterTronStakedTokens: false,
    });
    expect(result).toStrictEqual({});
  });
});

describe('getFungibleAssetForRoute', () => {
  beforeEach(() => {
    getAssetsBySelectedAccountGroup.memoizedResultFunc.clearCache();
    jest.mocked(selectAssetsBySelectedAccountGroup).mockReset();
    jest.mocked(selectAssetsBySelectedAccountGroup).mockReturnValue({});
  });

  const createMockState = (testId: string) => ({
    metamask: createUnifiedAssetListMockMetamask({ testId }),
  });

  it('resolves native EVM assets from a CAIP-19 route asset id', () => {
    const nativeEth = {
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
      balance: '10',
    };

    jest.mocked(selectAssetsBySelectedAccountGroup).mockReturnValueOnce({
      '0x1': [nativeEth],
    } as unknown as AccountGroupAssets);

    const result = getFungibleAssetForRoute(createMockState('native-evm'), {
      assetId: 'eip155:1/slip44:60',
      chainId: 'eip155:1',
    });

    expect(result).toStrictEqual(nativeEth);
  });

  it('resolves ERC-20 assets from a CAIP-19 route by token address', () => {
    const tokenAddress = '0x2EFA2Cb29C2341d8E5Ba7D3262C9e9d6f1Bf3711';
    const customToken = {
      accountType: 'eip155:eoa',
      accountId: 'd7f11451-9d79-4df4-a012-afd253443639',
      chainId: '0x1',
      address: tokenAddress,
      image: '',
      name: 'foo',
      symbol: 'foo',
      isNative: false,
      decimals: 18,
      balance: '1',
    };

    jest.mocked(selectAssetsBySelectedAccountGroup).mockReturnValueOnce({
      '0x1': [customToken],
    } as unknown as AccountGroupAssets);

    const result = getFungibleAssetForRoute(createMockState('erc20-route'), {
      assetId: `eip155:1/erc20:${tokenAddress}` as CaipAssetType,
      chainId: 'eip155:1',
      decodedAsset: tokenAddress,
    });

    expect(result).toStrictEqual(customToken);
  });
});

describe('getAsset', () => {
  beforeEach(() => {
    getAssetsBySelectedAccountGroup.memoizedResultFunc.clearCache();
  });

  const mockState = {
    metamask: createUnifiedAssetListMockMetamask({ testId: 'yyyy' }),
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
