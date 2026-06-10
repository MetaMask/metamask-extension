import React from 'react';
import {
  fireEvent,
  render as renderComponent,
  screen,
} from '@testing-library/react';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { CaipChainId, Hex } from '@metamask/utils';
import type { AccountGroupAssets, Asset } from '@metamask/assets-controllers';
import { enLocale as messages } from '../../../../../test/lib/i18n-helpers';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../../shared/constants/metametrics';
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
} from '../../../../selectors/assets';
import { MUSD_TOKEN_ADDRESS } from '../../musd/constants';
import TokenList from './token-list';

jest.mock('../token-cell', () => {
  const ReactActual = jest.requireActual('react');

  return {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    __esModule: true,
    default: ({
      token,
      onClick,
    }: {
      token: { symbol: string; title: string };
      onClick?: () => void;
    }) =>
      ReactActual.createElement(
        'button',
        {
          'data-testid': `token-cell-${token.symbol}`,
          onClick,
          type: 'button',
        },
        token.title,
      ),
  };
});

jest.mock('../../../../contexts/metametrics', () => {
  const ReactActual = jest.requireActual('react');
  const mockTrackEvent = jest.fn();

  return {
    MetaMetricsContext: ReactActual.createContext({
      trackEvent: mockTrackEvent,
      bufferedTrace: jest.fn(),
      bufferedEndTrace: jest.fn(),
      onboardingParentContext: { current: null },
    }),
    mockTrackEvent,
  };
});

jest.mock('../util/sortAssetsWithPriority', () => ({
  sortAssetsWithPriority: jest.fn((assets) => assets),
}));

jest.mock('../../../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string, substitutions?: unknown[]) => {
    const { enLocale } = jest.requireActual(
      '../../../../../test/lib/i18n-helpers',
    );
    const message = enLocale[key]?.message ?? key;

    return (
      substitutions?.reduce<string>(
        (result, substitution, index) =>
          result.replace(`$${index + 1}`, String(substitution)),
        message,
      ) ?? message
    );
  },
}));

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
}));

const CHAIN_ID = '0x1' as Hex;
const LINEA_CHAIN_ID = '0xe708' as Hex;
const ACCOUNT_ID = 'account-1';

const lowValueAssetsLabel = (count: number) =>
  messages.lowValueAssets.message.replace('$1', String(count));

const getMockTrackEvent = () =>
  jest.requireMock('../../../../contexts/metametrics')
    .mockTrackEvent as jest.Mock;

const createAsset = ({
  symbol,
  fiatBalance,
  isNative = false,
  address: addressOverride,
  balance = '1',
  rawBalance,
}: {
  symbol: string;
  fiatBalance?: number;
  isNative?: boolean;
  address?: Hex;
  balance?: string;
  rawBalance?: Hex;
}): Asset => {
  const address =
    addressOverride ??
    (`0x${symbol.charCodeAt(0).toString(16).padEnd(40, '0')}` as Hex);

  return {
    accountType: 'eip155:eoa',
    accountId: ACCOUNT_ID,
    assetId: address,
    address,
    balance,
    chainId: CHAIN_ID,
    decimals: 18,
    fiat:
      fiatBalance === undefined
        ? undefined
        : {
            balance: fiatBalance,
            conversionRate: 1,
            currency: 'usd',
          },
    image: '',
    isNative,
    name: symbol,
    rawBalance:
      rawBalance ??
      (balance === '0' ? ('0x0' as Hex) : ('0xde0b6b3a7640000' as Hex)),
    symbol,
  };
};

const createAccountGroupAssets = (assets: Asset[]): AccountGroupAssets => ({
  [CHAIN_ID]: assets,
});

const render = () => {
  const store = configureMockStore([thunk])({});

  return renderComponent(
    <Provider store={store}>
      <TokenList onTokenClick={jest.fn()} />
    </Provider>,
  );
};

describe('TokenList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getMockTrackEvent().mockClear();

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
  });

  it('collapses non-native tokens with fiat balance below one dollar', () => {
    jest
      .mocked(getAssetsBySelectedAccountGroup)
      .mockReturnValue(
        createAccountGroupAssets([
          createAsset({ symbol: 'ETH', fiatBalance: 0.5, isNative: true }),
          createAsset({ symbol: 'DUST', fiatBalance: 0.5 }),
          createAsset({ symbol: 'USDC', fiatBalance: 25 }),
        ]),
      );

    render();

    expect(screen.getByTestId('token-cell-ETH')).toBeInTheDocument();
    expect(screen.getByTestId('token-cell-USDC')).toBeInTheDocument();
    expect(screen.queryByTestId('token-cell-DUST')).not.toBeInTheDocument();
    expect(screen.getByText(lowValueAssetsLabel(1))).toBeInTheDocument();
  });

  it('uses the current currency equivalent of one dollar for BTC balances', () => {
    jest.mocked(getCurrencyRates).mockReturnValue({
      ETH: {
        conversionDate: null,
        conversionRate: 0.05,
        usdConversionRate: 2500,
      },
    });
    jest
      .mocked(getAssetsBySelectedAccountGroup)
      .mockReturnValue(
        createAccountGroupAssets([
          createAsset({ symbol: 'DUST', fiatBalance: 0.00001 }),
          createAsset({ symbol: 'USDC', fiatBalance: 0.00003 }),
        ]),
      );

    render();

    expect(screen.getByTestId('token-cell-USDC')).toBeInTheDocument();
    expect(screen.queryByTestId('token-cell-DUST')).not.toBeInTheDocument();
    expect(screen.getByText(lowValueAssetsLabel(1))).toBeInTheDocument();
  });

  it('uses the current currency equivalent of one dollar for weak currency balances', () => {
    jest.mocked(getCurrencyRates).mockReturnValue({
      ETH: {
        conversionDate: null,
        conversionRate: 250000,
        usdConversionRate: 2500,
      },
    });
    jest
      .mocked(getAssetsBySelectedAccountGroup)
      .mockReturnValue(
        createAccountGroupAssets([
          createAsset({ symbol: 'DUST', fiatBalance: 50 }),
          createAsset({ symbol: 'USDC', fiatBalance: 150 }),
        ]),
      );

    render();

    expect(screen.getByTestId('token-cell-USDC')).toBeInTheDocument();
    expect(screen.queryByTestId('token-cell-DUST')).not.toBeInTheDocument();
    expect(screen.getByText(lowValueAssetsLabel(1))).toBeInTheDocument();
  });

  it('does not collapse non-native tokens with missing fiat balance', () => {
    jest
      .mocked(getAssetsBySelectedAccountGroup)
      .mockReturnValue(
        createAccountGroupAssets([
          createAsset({ symbol: 'USDC', fiatBalance: 25 }),
          createAsset({ symbol: 'UNKNOWN' }),
        ]),
      );

    render();

    expect(screen.getByTestId('token-cell-USDC')).toBeInTheDocument();
    expect(screen.getByTestId('token-cell-UNKNOWN')).toBeInTheDocument();
    expect(screen.queryByTestId('low-value-assets-toggle')).toBeNull();
  });

  it('hides zero-balance mUSD tokens when hide zero balance tokens is enabled', () => {
    jest.mocked(getShouldHideZeroBalanceTokens).mockReturnValue(true);
    jest
      .mocked(getAllEnabledNetworksForAllNamespaces)
      .mockReturnValue([CHAIN_ID, LINEA_CHAIN_ID] as ReturnType<
        typeof getAllEnabledNetworksForAllNamespaces
      >);
    jest.mocked(getAssetsBySelectedAccountGroup).mockReturnValue({
      [CHAIN_ID]: [
        createAsset({
          symbol: 'MUSD',
          address: MUSD_TOKEN_ADDRESS,
          balance: '0',
          fiatBalance: 0,
        }),
        createAsset({ symbol: 'USDC', fiatBalance: 25 }),
      ],
      [LINEA_CHAIN_ID]: [
        {
          ...createAsset({
            symbol: 'MUSD',
            address: MUSD_TOKEN_ADDRESS,
            balance: '0',
            fiatBalance: 0,
          }),
          chainId: LINEA_CHAIN_ID,
        } as Asset,
      ],
    });

    render();

    expect(screen.getByTestId('token-cell-USDC')).toBeInTheDocument();
    expect(screen.queryAllByTestId('token-cell-MUSD')).toHaveLength(0);
    expect(screen.queryByTestId('low-value-assets-toggle')).toBeNull();
  });

  it('renders zero-balance mUSD outside the low value bucket when zero-balance tokens are shown', () => {
    jest.mocked(getAssetsBySelectedAccountGroup).mockReturnValue(
      createAccountGroupAssets([
        createAsset({
          symbol: 'MUSD',
          address: MUSD_TOKEN_ADDRESS,
          balance: '0',
          fiatBalance: 0,
        }),
        createAsset({ symbol: 'USDC', fiatBalance: 25 }),
      ]),
    );

    render();

    expect(screen.getByTestId('token-cell-USDC')).toBeInTheDocument();
    expect(screen.getByTestId('token-cell-MUSD')).toBeInTheDocument();
    expect(screen.queryByTestId('low-value-assets-toggle')).toBeNull();
  });

  it('renders mUSD when it has a balance', () => {
    jest.mocked(getAssetsBySelectedAccountGroup).mockReturnValue(
      createAccountGroupAssets([
        createAsset({
          symbol: 'MUSD',
          address: MUSD_TOKEN_ADDRESS,
          balance: '1',
          fiatBalance: 1,
        }),
      ]),
    );

    render();

    expect(screen.getByTestId('token-cell-MUSD')).toBeInTheDocument();
  });

  it('renders low value tokens inline when sort is not declining balance', () => {
    jest.mocked(getTokenSortConfig).mockReturnValue({
      key: 'title',
      order: 'asc',
      sortCallback: 'alphaNumeric',
    });
    jest
      .mocked(getAssetsBySelectedAccountGroup)
      .mockReturnValue(
        createAccountGroupAssets([
          createAsset({ symbol: 'USDC', fiatBalance: 25 }),
          createAsset({ symbol: 'DUST', fiatBalance: 0.5 }),
        ]),
      );

    render();

    expect(screen.getByTestId('token-cell-USDC')).toBeInTheDocument();
    expect(screen.getByTestId('token-cell-DUST')).toBeInTheDocument();
    expect(screen.queryByTestId('low-value-assets-toggle')).toBeNull();
  });

  it('tracks low value asset expansion and collapse', () => {
    jest
      .mocked(getAssetsBySelectedAccountGroup)
      .mockReturnValue(
        createAccountGroupAssets([
          createAsset({ symbol: 'USDC', fiatBalance: 25 }),
          createAsset({ symbol: 'DUST', fiatBalance: 0.5 }),
        ]),
      );

    render();

    const toggle = screen.getByTestId('low-value-assets-toggle');
    fireEvent.click(toggle);

    expect(screen.getByTestId('token-cell-DUST')).toBeInTheDocument();
    expect(getMockTrackEvent()).toHaveBeenCalledWith({
      category: MetaMetricsEventCategory.Home,
      event: MetaMetricsEventName.LowValueAssetsToggled,
      properties: {
        state: 'expanded',
        count: 1,
      },
    });

    fireEvent.click(toggle);

    expect(screen.queryByTestId('token-cell-DUST')).not.toBeInTheDocument();
    expect(getMockTrackEvent()).toHaveBeenCalledWith({
      category: MetaMetricsEventCategory.Home,
      event: MetaMetricsEventName.LowValueAssetsToggled,
      properties: {
        state: 'collapsed',
        count: 1,
      },
    });
  });

  it('persists expansion for the browser session', () => {
    jest
      .mocked(getAssetsBySelectedAccountGroup)
      .mockReturnValue(
        createAccountGroupAssets([
          createAsset({ symbol: 'USDC', fiatBalance: 25 }),
          createAsset({ symbol: 'DUST', fiatBalance: 0.5 }),
        ]),
      );

    const { unmount } = render();

    fireEvent.click(screen.getByTestId('low-value-assets-toggle'));
    expect(screen.getByTestId('token-cell-DUST')).toBeInTheDocument();

    unmount();
    render();

    expect(screen.getByTestId('token-cell-DUST')).toBeInTheDocument();
  });
});
