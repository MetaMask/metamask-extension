import React from 'react';
import { renderHook } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import type { CaipChainId, Hex } from '@metamask/utils';
import type { AccountGroupAssets, Asset } from '@metamask/assets-controllers';
import { getPreferences } from '../../../../../shared/lib/selectors/preferences';
import {
  getCurrencyRates,
  getShouldHideZeroBalanceTokens,
  getTokenSortConfig,
  getUseExternalServices,
} from '../../../../selectors';
import {
  getAllEnabledNetworksForAllNamespaces,
  getIsEvmMultichainNetworkSelected,
  getSelectedMultichainNetworkConfiguration,
} from '../../../../selectors/multichain/networks';
import {
  getAssetsBySelectedAccountGroup,
  selectAccountGroupBalanceForEmptyState,
  selectIsAssetsLoadingForSelectedAccountGroup,
} from '../../../../selectors/assets';
import {
  sortTokenAssets,
  type TokenTableSort,
} from '../util/sortAssetsWithPriority';
import {
  useTokenListData,
  type TokenListDisplayItem,
} from './useTokenListData';

jest.mock('../../../../hooks/useAnalytics', () => ({
  useAnalytics: () => ({
    createEventBuilder: jest.requireActual(
      '../../../../../shared/lib/analytics/create-event-builder',
    ).createEventBuilder,
    trackEvent: jest.fn(),
  }),
}));

jest.mock('../util/sortAssetsWithPriority', () => {
  const actual = jest.requireActual<
    typeof import('../util/sortAssetsWithPriority')
  >('../util/sortAssetsWithPriority');

  return {
    ...actual,
    sortTokenAssets: jest.fn(actual.sortTokenAssets),
  };
});

jest.mock('../../../../selectors', () => ({
  getCurrencyRates: jest.fn(),
  getShouldHideZeroBalanceTokens: jest.fn(),
  getTokenSortConfig: jest.fn(),
  getUseExternalServices: jest.fn(),
}));

jest.mock('../../../../../shared/lib/selectors/preferences', () => ({
  getPreferences: jest.fn(),
}));

jest.mock('../../../../selectors/multichain/networks', () => ({
  getAllEnabledNetworksForAllNamespaces: jest.fn(),
  getIsEvmMultichainNetworkSelected: jest.fn(),
  getSelectedMultichainNetworkConfiguration: jest.fn(),
}));

jest.mock('../../../../selectors/assets', () => ({
  getAssetsBySelectedAccountGroup: jest.fn(),
  selectAccountGroupBalanceForEmptyState: jest.fn(),
  selectIsAssetsLoadingForSelectedAccountGroup: jest.fn(),
}));

jest.mock('#ui/hooks/token-asset/useTokenAssetSecurityResults', () => ({
  useTokenAssetSecurityResults: jest.fn(() => ({})),
}));

jest.mock('../../../../pages/bridge/hooks/useRWAToken', () => ({
  useRWAToken: () => ({
    isStockToken: () => false,
    isTokenTradingOpen: () => true,
  }),
}));

const CHAIN_ID = '0x1' as Hex;
const ACCOUNT_ID = 'account-1';

const createAsset = ({
  symbol,
  fiatBalance,
  isNative = false,
}: {
  symbol: string;
  fiatBalance: number;
  isNative?: boolean;
}): Asset => {
  const address =
    `0x${symbol.charCodeAt(0).toString(16).padEnd(40, '0')}` as Hex;

  return {
    accountType: 'eip155:eoa',
    accountId: ACCOUNT_ID,
    assetId: address,
    address,
    balance: '1',
    chainId: CHAIN_ID,
    decimals: 18,
    fiat: {
      balance: fiatBalance,
      conversionRate: 1,
      currency: 'usd',
    },
    image: '',
    isNative,
    name: symbol,
    rawBalance: '0xde0b6b3a7640000' as Hex,
    symbol,
  };
};

const accountAssets = (assets: Asset[]): AccountGroupAssets => ({
  [CHAIN_ID]: assets,
});

const pricedAssets = [
  createAsset({ symbol: 'USDC', fiatBalance: 25 }),
  createAsset({ symbol: 'DUST', fiatBalance: 0.5 }),
  createAsset({ symbol: 'ETH', fiatBalance: 10, isNative: true }),
];

const prices: Record<string, number> = { ETH: 100, DUST: 50, USDC: 2 };

const getPrice = (asset: Asset) => prices[asset.symbol];

const labels = (items: TokenListDisplayItem[]) =>
  items.map((item) => (item.type === 'token' ? item.token.symbol : 'toggle'));

const renderList = (sortOverride?: TokenTableSort | null) => {
  const store = configureMockStore([thunk])({});

  return renderHook(
    () =>
      useTokenListData({
        onTokenClick: jest.fn(),
        sortOverride,
      }),
    {
      wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
    },
  );
};

describe('useTokenListData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest
      .mocked(getPreferences)
      .mockReturnValue({ privacyMode: false } as ReturnType<
        typeof getPreferences
      >);
    jest.mocked(getShouldHideZeroBalanceTokens).mockReturnValue(false);
    jest.mocked(getCurrencyRates).mockReturnValue({
      ETH: { conversionDate: null, conversionRate: 1, usdConversionRate: 1 },
    });
    jest.mocked(getTokenSortConfig).mockReturnValue({
      key: 'tokenFiatAmount',
      order: 'dsc',
      sortCallback: 'stringNumeric',
    });
    jest.mocked(getUseExternalServices).mockReturnValue(true);
    jest
      .mocked(getAllEnabledNetworksForAllNamespaces)
      .mockReturnValue([CHAIN_ID as Hex | CaipChainId] as ReturnType<
        typeof getAllEnabledNetworksForAllNamespaces
      >);
    jest.mocked(getIsEvmMultichainNetworkSelected).mockReturnValue(true);
    jest
      .mocked(getSelectedMultichainNetworkConfiguration)
      .mockReturnValue({ chainId: CHAIN_ID } as ReturnType<
        typeof getSelectedMultichainNetworkConfiguration
      >);
    jest.mocked(selectAccountGroupBalanceForEmptyState).mockReturnValue(true);
    jest
      .mocked(selectIsAssetsLoadingForSelectedAccountGroup)
      .mockReturnValue(false);
    jest
      .mocked(getAssetsBySelectedAccountGroup)
      .mockReturnValue(accountAssets(pricedAssets));
  });

  it('orders tokens by the table override', () => {
    const { result } = renderList({
      column: 'price',
      reversed: false,
      getValue: getPrice,
    });

    expect(labels(result.current.tokenListItems)).toStrictEqual([
      'ETH',
      'DUST',
      'USDC',
    ]);
  });

  it('hides low value tokens only for a high-to-low balance sort', () => {
    const saved = renderList();
    const highToLow = renderList({ column: 'balance', reversed: false });
    const lowToHigh = renderList({ column: 'balance', reversed: true });
    const byPrice = renderList({
      column: 'price',
      reversed: false,
      getValue: getPrice,
    });

    expect(labels(saved.result.current.tokenListItems)).toStrictEqual([
      'USDC',
      'ETH',
      'toggle',
    ]);
    expect(labels(highToLow.result.current.tokenListItems)).toStrictEqual([
      'USDC',
      'ETH',
      'toggle',
    ]);
    expect(labels(lowToHigh.result.current.tokenListItems)).toStrictEqual([
      'DUST',
      'ETH',
      'USDC',
    ]);
    expect(labels(byPrice.result.current.tokenListItems)).toStrictEqual([
      'ETH',
      'DUST',
      'USDC',
    ]);
  });

  it('does not sort again when currency rates change during a balance sort', () => {
    const { rerender } = renderList({ column: 'balance', reversed: false });
    const calls = jest.mocked(sortTokenAssets).mock.calls.length;

    jest.mocked(getCurrencyRates).mockReturnValue({
      ETH: { conversionDate: null, conversionRate: 99, usdConversionRate: 1 },
    });
    rerender();

    expect(jest.mocked(sortTokenAssets).mock.calls.length).toBe(calls);
  });
});
