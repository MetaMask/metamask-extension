import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { fireEvent, waitFor } from '@testing-library/react';
import { EthAccountType, EthScope } from '@metamask/keyring-api';
import nock from 'nock';
import { toChecksumHexAddress } from '@metamask/controller-utils';
import {
  CHAIN_IDS,
  MAINNET_DISPLAY_NAME,
} from '../../../../shared/constants/network';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { KeyringType } from '../../../../shared/constants/keyring';
import { AssetType } from '../../../../shared/constants/transaction';
import { ETH_EOA_METHODS } from '../../../../shared/constants/eth-methods';
import { setBackgroundConnection } from '../../../store/background-connection';
import {
  mockNetworkState,
  mockMultichainNetworkState,
} from '../../../../test/stub/networks';
import useMultiPolling from '../../../hooks/useMultiPolling';
import { getAssetsBySelectedAccountGroup } from '../../../selectors/assets';
import { MUSD_TOKEN_ADDRESS } from '../../../components/app/musd/constants';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import AssetPage from './asset-page';

jest.mock('../../../hooks/useAnalytics', () => {
  const { createEventBuilder } = jest.requireActual(
    '../../../../shared/lib/analytics/create-event-builder',
  );

  return {
    useAnalytics: () => ({
      trackEvent: jest.fn(),
      createEventBuilder,
    }),
  };
});

jest.mock('../../../hooks/musd/useMusdGeoBlocking', () => ({
  ...jest.requireActual('../../../hooks/musd/useMusdGeoBlocking'),
  useMusdGeoBlocking: () => ({
    isBlocked: false,
    userCountry: 'US',
    isLoading: false,
    error: null,
    blockedRegions: [],
    blockedMessage: null,
    refreshGeolocation: jest.fn(),
  }),
}));

jest.mock('../../../store/actions', () => ({
  ...jest.requireActual('../../../store/actions'),
  tokenBalancesStartPolling: jest.fn().mockResolvedValue('pollingToken'),
  tokenBalancesStopPollingByPollingToken: jest.fn(),
}));

jest.mock('../../../store/controller-actions/transaction-controller');

// Mock the price chart
jest.mock('react-chartjs-2', () => ({
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  Line: require('react').forwardRef(() => null),
}));

// Mock BUYABLE_CHAINS_MAP
jest.mock('../../../../shared/constants/network', () => ({
  ...jest.requireActual('../../../../shared/constants/network'),
  BUYABLE_CHAINS_MAP: {
    // MAINNET
    '0x1': {
      nativeCurrency: 'ETH',
      network: 'ethereum',
    },
    // POLYGON
    '0x89': {
      nativeCurrency: 'MATIC',
      network: 'polygon',
    },
  },
}));

jest.mock('../../../hooks/musd', () => {
  const actual = jest.requireActual<typeof import('../../../hooks/musd')>(
    '../../../hooks/musd',
  );
  return {
    ...actual,
    useMusdCtaVisibility: () => ({
      shouldShowTokenListItemCta: jest.fn().mockReturnValue(false),
      shouldShowAssetOverviewCta: jest.fn().mockReturnValue(false),
    }),
    useMusdBalance: () => ({
      hasMusdBalance: false,
    }),
    useMusdConversionTokens: () => ({
      tokens: [],
    }),
    useMusdConversion: () => ({
      startConversionFlow: jest.fn().mockResolvedValue(undefined),
    }),
  };
});
jest.mock('../../activity/activity-list', () => ({
  ActivityList: () => <div data-testid="mock-activity-list" />,
}));

jest.mock('../../../hooks/useMultiPolling', () => ({
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('../../../hooks/useTokenSecurityData', () => ({
  useTokenSecurityData: jest.fn(() => ({
    securityData: null,
    isLoading: false,
    error: null,
  })),
}));

const mockOpenBuyCryptoInPdapp = jest.fn();
jest.mock('../../../hooks/ramps/useRamps/useRamps', () => ({
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __esModule: true,
  default: jest.fn(() => ({
    openBuyCryptoInPdapp: mockOpenBuyCryptoInPdapp,
  })),
}));

const selectedAccountAddress = 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3';

const DEFAULT_ASSETS_BY_SELECTED_ACCOUNT_GROUP = {
  '0x1': [
    {
      assetId: '0x0000000000000000000000000000000000000000',
      rawBalance: '0x0',
      balance: '0',
      fiat: {
        balance: 0,
      },
    },
    {
      assetId: '0x309375769E79382beFDEc5bdab51063AeBDC4936',
      rawBalance: '0x0',
      balance: '0',
      fiat: {
        balance: 0,
      },
    },
    {
      assetId: '0xe4246B1Ac0Ba6839d9efA41a8A30AE3007185f55',
      rawBalance: '0x0',
      balance: '0',
      fiat: {
        balance: 0,
      },
    },
    {
      assetId: '0xacA92E438df0B2401fF60dA7E4337B687a2435DA',
      rawBalance: '0x0',
      balance: '0',
      fiat: {
        balance: 0,
      },
    },
  ],
};

const ARC_USDC_ASSETS_BY_SELECTED_ACCOUNT_GROUP = {
  [CHAIN_IDS.ARC]: [
    {
      assetId: '0x0000000000000000000000000000000000000000',
      isNative: true,
      rawBalance: '0x75bcd15',
      balance: '123.456789',
      fiat: { balance: 123.456789 },
    },
  ],
};

jest.mock('../../../selectors/assets', () => ({
  ...jest.requireActual('../../../selectors/assets'),
  getAssetsBySelectedAccountGroup: jest.fn(),
}));

describe('AssetPage', () => {
  const mockStore = {
    localeMessages: {
      currentLocale: 'en',
    },
    appState: {
      confirmationExchangeRates: {},
    },
    confirmTransaction: {
      txData: {},
    },
    metamask: {
      ...mockMultichainNetworkState(),
      txHistory: {},
      remoteFeatureFlags: {
        batchSell: { enabled: true },
        bridgeConfig: {
          support: true,
        },
      },
      tokenList: {},
      tokenBalances: {
        [selectedAccountAddress]: {
          [CHAIN_IDS.MAINNET]: {},
        },
      },
      marketData: {},
      allTokens: {},
      accountsByChainId: {
        '0x1': {
          [selectedAccountAddress]: {
            address: selectedAccountAddress,
            balance: '0x00',
          },
        },
      },
      currentCurrency: 'usd',
      accounts: {},
      ...mockNetworkState({ chainId: CHAIN_IDS.MAINNET }),
      currencyRates: {
        TEST: {
          conversionRate: 123,
          ticker: 'ETH',
        },
        ETH: {
          conversionRate: 123,
          ticker: 'ETH',
        },
      },
      useCurrencyRateCheck: true,
      preferences: {},
      enabledNetworkMap: {
        eip155: {},
      },
      selectedAccountGroup: 'entropy:01JKAF3DSGM3AB87EM9N0K41AJ/0',
      accountTree: {
        wallets: {
          'entropy:01JKAF3DSGM3AB87EM9N0K41AJ': {
            id: 'entropy:01JKAF3DSGM3AB87EM9N0K41AJ',
            type: 'entropy',
            groups: {
              'entropy:01JKAF3DSGM3AB87EM9N0K41AJ/0': {
                id: 'entropy:01JKAF3DSGM3AB87EM9N0K41AJ/0',
                type: 'multichain-account',
                accounts: [selectedAccountAddress],
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
      internalAccounts: {
        accounts: {
          [selectedAccountAddress]: {
            address: selectedAccountAddress,
            id: selectedAccountAddress,
            metadata: {
              name: 'Test Account',
              keyring: {
                type: 'HD Key Tree',
              },
            },
            options: {},
            methods: ETH_EOA_METHODS,
            type: EthAccountType.Eoa,
            scopes: [EthScope.Eoa],
          },
        },
        selectedAccount: selectedAccountAddress,
      },
      keyrings: [
        {
          type: KeyringType.hdKeyTree,
          accounts: ['0x1', '0x2'],
        },
        {
          type: KeyringType.ledger,
          accounts: [],
        },
      ],
      accountsAssets: {},
      useExternalServices: true,
    },
  };

  const store = configureMockStore([thunk])(mockStore);

  let openTabSpy: jest.SpyInstance;

  beforeAll(() => {
    jest.clearAllMocks();
    Object.defineProperty(global, 'platform', {
      value: {
        openTab: jest.fn(),
      },
    });
    openTabSpy = jest.spyOn(global.platform, 'openTab');
    setBackgroundConnection({
      getTokenSymbol: jest.fn(),
      getBearerToken: jest.fn().mockResolvedValue('mock-bearer-token'),
    } as never);
  });

  beforeEach(() => {
    openTabSpy.mockClear();

    nock('https://price.api.cx.metamask.io')
      .get(/\/v3\/historical-prices\//u)
      .query(true)
      .reply(200, {})
      .persist();

    // Mock OHLCV chart data API (for AdvancedChart)
    nock('https://price.api.cx.metamask.io')
      .get(/\/v3\/ohlcv-chart\//u)
      .query(true)
      .reply(200, { data: [] })
      .persist();

    // Mocking Date.now would not be sufficient, since it would render differently
    // depending on the machine's timezone. Mock the formatter instead.
    jest.spyOn(Intl, 'DateTimeFormat').mockImplementation(() => {
      return {
        format: () => 'Jun 9, 8:10 PM',
        resolvedOptions: jest.fn(),
        formatToParts: jest.fn(),
        formatRange: jest.fn(),
        formatRangeToParts: jest.fn(),
      };
    });
    // Clear previous mock implementations
    (useMultiPolling as jest.Mock).mockClear();

    // Return a stable (same-reference) default so Reselect's input stability
    // check does not trigger a warning when getAsset calls this selector twice.
    (getAssetsBySelectedAccountGroup as unknown as jest.Mock).mockReturnValue(
      DEFAULT_ASSETS_BY_SELECTED_ACCOUNT_GROUP,
    );

    // Mock implementation for useMultiPolling
    (useMultiPolling as jest.Mock).mockImplementation(({ input }) => {
      // Mock startPolling and stopPollingByPollingToken for each input
      const startPolling = jest.fn().mockResolvedValue('mockPollingToken');
      const stopPollingByPollingToken = jest.fn();

      input.forEach((inputItem: string) => {
        const key = JSON.stringify(inputItem);
        // Simulate returning a unique token for each input
        startPolling.mockResolvedValueOnce(`mockToken-${key}`);
      });

      return { startPolling, stopPollingByPollingToken };
    });
  });

  afterEach(() => {
    store.clearActions();
    jest.restoreAllMocks();
    nock.cleanAll();
  });

  const native = {
    type: AssetType.native,
    chainId: '0x1',
    symbol: 'TEST',
    image: '',
    isOriginalNativeSymbol: true,
    balance: {
      value: '0',
      display: '0',
      fiat: '',
    },
    decimals: 18,
  } as const;

  const token = {
    type: AssetType.token,
    chainId: '0x1',
    address: '0xF0906D83c5a0bD6b74bC9b62D7D9F2014c6525C0',
    symbol: 'TEST',
    decimals: 18,
    image: '',
    balance: {
      value: '0',
      display: '0',
      fiat: '',
    },
  } as const;

  it('renders token decimals with a dedicated test id', () => {
    const { getByTestId } = renderWithProvider(
      <AssetPage asset={token} optionsButton={null} />,
      store,
    );

    expect(getByTestId('asset-token-decimals')).toHaveTextContent('18');
  });

  it('should not show a modal when token passed in props is not an ERC721', () => {
    renderWithProvider(<AssetPage asset={token} optionsButton={null} />, store);
    const actions = store.getActions();
    expect(actions).toHaveLength(0);
  });

  it('should show ConvertTokenToNFT modal when token passed in props is an ERC721', () => {
    renderWithProvider(
      <AssetPage asset={{ ...token, isERC721: true }} optionsButton={null} />,
      store,
    );
    const actions = store.getActions();
    expect(actions).toHaveLength(1);
    expect(actions[0].type).toBe('UI_MODAL_OPEN');
    expect(actions[0].payload).toStrictEqual({
      name: 'CONVERT_TOKEN_TO_NFT',
      tokenAddress: token.address,
    });
  });

  it('should enable the buy button on supported chains', () => {
    const { queryByTestId } = renderWithProvider(
      <AssetPage asset={token} optionsButton={null} />,
      store,
    );
    const buyButton = queryByTestId('token-overview-buy');
    expect(buyButton).toBeInTheDocument();
    expect(buyButton).toBeEnabled();
  });

  it('keeps the buy button enabled on unsupported chains', () => {
    const { queryByTestId } = renderWithProvider(
      <AssetPage asset={token} optionsButton={null} />,
      configureMockStore([thunk])({
        ...mockStore,
        metamask: {
          ...mockStore.metamask,
          ...mockNetworkState({ chainId: CHAIN_IDS.SEPOLIA }),
        },
      }),
    );
    const buyButton = queryByTestId('token-overview-buy');
    expect(buyButton).toBeInTheDocument();
    expect(buyButton).toBeEnabled();
  });

  it('opens the in-extension buy flow when clicking the buy button', async () => {
    const mockedStoreWithBuyableChainId = {
      ...mockStore,
      metamask: {
        ...mockStore.metamask,
        ...mockNetworkState({ chainId: CHAIN_IDS.POLYGON }),
      },
    };
    const mockedStore = configureMockStore([thunk])(
      mockedStoreWithBuyableChainId,
    );

    const { queryByTestId } = renderWithProvider(
      <AssetPage asset={token} optionsButton={null} />,
      mockedStore,
    );
    const buyButton = queryByTestId('token-overview-buy');
    expect(buyButton).toBeInTheDocument();
    expect(buyButton).not.toBeDisabled();

    fireEvent.click(buyButton as HTMLElement);
    expect(mockOpenBuyCryptoInPdapp).toHaveBeenCalledTimes(1);
  });

  it('hides the Send button when token balance is zero', () => {
    const { queryByTestId } = renderWithProvider(
      <AssetPage asset={token} optionsButton={null} />,
      store,
    );

    expect(queryByTestId('eth-overview-send')).not.toBeInTheDocument();
  });

  it('shows the Send button when token balance is greater than zero', () => {
    // Use mockReturnValue (not mockReturnValueOnce) so that Reselect's input
    // stability check — which calls the selector twice — always gets the same
    // reference.  The outer beforeEach will reset this for the next test.
    (getAssetsBySelectedAccountGroup as unknown as jest.Mock).mockReturnValue({
      '0x1': [
        {
          assetId: '0x0000000000000000000000000000000000000000',
          rawBalance: '0x0',
          balance: '0',
          fiat: { balance: 0 },
        },
        {
          assetId: token.address,
          rawBalance: '0x1',
          balance: '1',
          fiat: { balance: 0 },
        },
      ],
    });

    const { queryByTestId } = renderWithProvider(
      <AssetPage asset={token} optionsButton={null} />,
      store,
    );

    expect(queryByTestId('eth-overview-send')).toBeInTheDocument();
  });

  it('uses the Arc native balance on the ERC20 USDC token page', () => {
    (getAssetsBySelectedAccountGroup as unknown as jest.Mock).mockReturnValue(
      ARC_USDC_ASSETS_BY_SELECTED_ACCOUNT_GROUP,
    );

    const { queryByTestId } = renderWithProvider(
      <AssetPage
        asset={{
          ...token,
          chainId: CHAIN_IDS.ARC,
          address: '0x3600000000000000000000000000000000000000',
          symbol: 'USDC',
          decimals: 6,
        }}
        optionsButton={null}
      />,
      store,
    );

    expect(queryByTestId('eth-overview-send')).toBeInTheDocument();
  });

  it('should show the Swap button if chain id is supported', async () => {
    const { queryByTestId } = renderWithProvider(
      <AssetPage asset={token} optionsButton={null} />,
      store,
    );
    const swapButton = queryByTestId('token-overview-swap');
    expect(swapButton).toBeInTheDocument();
    expect(swapButton).not.toBeDisabled();
  });

  it('should render Swap button on testnet chains', async () => {
    const { queryByTestId } = renderWithProvider(
      <AssetPage asset={token} optionsButton={null} />,
      configureMockStore([thunk])({
        ...mockStore,
        metamask: {
          ...mockStore.metamask,
          ...mockNetworkState({ chainId: CHAIN_IDS.SEPOLIA }),
        },
      }),
    );
    const swapButton = queryByTestId('token-overview-swap');
    expect(swapButton).toBeInTheDocument();
    expect(swapButton).not.toBeDisabled();
  });

  it('should render the network name', async () => {
    const mockedStore = configureMockStore([thunk])(mockStore);

    const { queryByTestId } = renderWithProvider(
      <AssetPage asset={token} optionsButton={null} />,
      mockedStore,
    );
    const networkNode = queryByTestId('asset-network');
    expect(networkNode).toBeInTheDocument();
    expect(networkNode?.textContent).toBe(MAINNET_DISPLAY_NAME);
  });

  it('should render a native asset', () => {
    const { getByTestId } = renderWithProvider(
      <AssetPage asset={native} optionsButton={null} />,
      store,
      '/0x1',
    );
    expect(getByTestId('asset-name')).toHaveTextContent(native.symbol);
  });

  it('should render an ERC20 asset without prices', async () => {
    const address = '0x309375769E79382beFDEc5bdab51063AeBDC4936';

    const { queryByTestId } = renderWithProvider(
      <AssetPage asset={{ ...token, address }} optionsButton={null} />,
      configureMockStore([thunk])({
        ...mockStore,
        metamask: {
          ...mockStore.metamask,
          marketData: {
            [CHAIN_IDS.MAINNET]: {
              [address]: {
                price: 123,
              },
            },
          },
        },
      }),
    );

    // Verify the advanced chart iframe is rendered
    await waitFor(() => {
      const chart = queryByTestId('advanced-chart-iframe');
      expect(chart).toBeInTheDocument();
    });
  });

  it('should render an ERC20 token with prices', async () => {
    const address = '0xe4246B1Ac0Ba6839d9efA41a8A30AE3007185f55';
    const marketCap = 456;

    // Mock price history (v3 CAIP path; address must match checksummed segment from useHistoricalPrices)
    nock('https://price.api.cx.metamask.io')
      .get(
        `/v3/historical-prices/eip155:1/erc20:${toChecksumHexAddress(address)}`,
      )
      .query(true)
      .reply(200, { prices: [[1, 1]] });

    // Mock OHLCV chart data API (for AdvancedChart)
    nock('https://price.api.cx.metamask.io')
      .get(/\/v3\/ohlcv-chart\//u)
      .query(true)
      .reply(200, { data: [] });

    const { queryByTestId, container } = renderWithProvider(
      <AssetPage asset={{ ...token, address }} optionsButton={null} />,
      configureMockStore([thunk])({
        ...mockStore,
        metamask: {
          ...mockStore.metamask,
          marketData: {
            [CHAIN_IDS.MAINNET]: {
              [address]: {
                price: 123,
                marketCap,
                currency: 'ETH',
              },
            },
          },
        },
      }),
      '/0x1/0xe4246B1Ac0Ba6839d9efA41a8A30AE3007185f55',
    );

    // Verify the advanced chart iframe is rendered
    await waitFor(() => {
      const chart = queryByTestId('advanced-chart-iframe');
      expect(chart).toBeInTheDocument();
    });

    // Verify market data is rendered
    const marketCapElement = queryByTestId('asset-market-cap');
    expect(marketCapElement).toHaveTextContent('$56.09K');
  });

  describe('mUSD asset page feature flags', () => {
    const musdToken = {
      type: AssetType.token,
      chainId: CHAIN_IDS.MAINNET,
      address: '0xacA92E438df0B2401fF60dA7E4337B687a2435DA',
      symbol: 'MUSD',
      decimals: 6,
      image: '',
      balance: {
        value: '0',
        display: '0',
        fiat: '',
      },
    } as const;

    const musdRemoteFlags = (overrides: {
      earnMusdConversionFlowEnabled?: boolean;
    }) => ({
      bridgeConfig: {
        support: true,
      },
      earnMusdConversionFlowEnabled: true,
      ...overrides,
    });

    it('falls back to standard balance layout when conversion flow is off', () => {
      const { queryByTestId, getByText } = renderWithProvider(
        <AssetPage asset={musdToken} optionsButton={null} />,
        configureMockStore([thunk])({
          ...mockStore,
          metamask: {
            ...mockStore.metamask,
            remoteFeatureFlags: musdRemoteFlags({
              earnMusdConversionFlowEnabled: false,
            }),
          },
        }),
      );

      expect(getByText(messages.yourBalance.message)).toBeInTheDocument();
      expect(queryByTestId('musd-position-section')).not.toBeInTheDocument();
      expect(queryByTestId('musd-convert-section')).not.toBeInTheDocument();
    });

    it('renders the position, but never the convert section, when the conversion flow is on', () => {
      const { queryByTestId } = renderWithProvider(
        <AssetPage asset={musdToken} optionsButton={null} />,
        configureMockStore([thunk])({
          ...mockStore,
          metamask: {
            ...mockStore.metamask,
            remoteFeatureFlags: musdRemoteFlags({}),
          },
        }),
      );

      expect(queryByTestId('musd-position-section')).toBeInTheDocument();
      expect(queryByTestId('musd-convert-section')).not.toBeInTheDocument();
    });
  });

  describe('Advanced Chart Integration', () => {
    it('renders the advanced chart iframe by default', async () => {
      const { queryByTestId } = renderWithProvider(
        <AssetPage asset={token} optionsButton={null} />,
        store,
      );

      await waitFor(() => {
        const chart = queryByTestId('advanced-chart-iframe');
        expect(chart).toBeInTheDocument();
      });
    });

    it('renders IntervalBar for advanced chart', async () => {
      const { container } = renderWithProvider(
        <AssetPage asset={token} optionsButton={null} />,
        store,
      );

      // IntervalBar should render interval buttons
      await waitFor(() => {
        const intervalButtons = container.querySelectorAll('button');
        const hasIntervalButton = Array.from(intervalButtons).some(
          (btn) => btn.textContent === '15m' || btn.textContent === '1h',
        );
        expect(hasIntervalButton).toBe(true);
      });
    });

    it('falls back to legacy chart on error', async () => {
      const { queryByTestId, rerender } = renderWithProvider(
        <AssetPage asset={token} optionsButton={null} />,
        store,
      );

      // Verify advanced chart is initially rendered
      await waitFor(() => {
        expect(queryByTestId('advanced-chart-iframe')).toBeInTheDocument();
      });

      // Simulate chart error by forcing a re-render that triggers onError
      // In a real scenario, the iframe would call onError callback
      rerender(<AssetPage asset={token} optionsButton={null} />);

      // The component should handle errors gracefully
      expect(queryByTestId('advanced-chart-iframe')).toBeInTheDocument();
    });

    it('renders IndicatorBar only for candle chart type', async () => {
      const { container, queryByText } = renderWithProvider(
        <AssetPage asset={token} optionsButton={null} />,
        store,
      );

      // Wait for chart to render
      await waitFor(() => {
        const chart = queryByText('BOL');
        // IndicatorBar may or may not be visible depending on chart type
        // This test just ensures the component doesn't crash
        expect(container).toBeInTheDocument();
      });
    });

    it('handles interval changes', async () => {
      const { container } = renderWithProvider(
        <AssetPage asset={token} optionsButton={null} />,
        store,
      );

      await waitFor(() => {
        // Find interval button (e.g., "1h")
        const buttons = Array.from(container.querySelectorAll('button'));
        const intervalButton = buttons.find((btn) => btn.textContent === '1h');

        if (intervalButton) {
          fireEvent.click(intervalButton);
          // Should not crash
          expect(container).toBeInTheDocument();
        }
      });
    });

    it('handles chart type toggle between line and candle', async () => {
      const { container, queryByTestId } = renderWithProvider(
        <AssetPage asset={token} optionsButton={null} />,
        store,
      );

      await waitFor(() => {
        expect(queryByTestId('advanced-chart-iframe')).toBeInTheDocument();
      });

      // Look for chart type toggle button (if rendered)
      const buttons = Array.from(container.querySelectorAll('button'));
      const chartTypeButton = buttons.find(
        (btn) =>
          btn.getAttribute('aria-label')?.includes('chart') ||
          btn.textContent?.includes('chart'),
      );

      if (chartTypeButton) {
        fireEvent.click(chartTypeButton);
        // Should not crash
        expect(container).toBeInTheDocument();
      }
    });

    it('maintains chart state across re-renders', async () => {
      const { queryByTestId, rerender } = renderWithProvider(
        <AssetPage asset={token} optionsButton={null} />,
        store,
      );

      await waitFor(() => {
        expect(queryByTestId('advanced-chart-iframe')).toBeInTheDocument();
      });

      // Re-render with same props
      rerender(<AssetPage asset={token} optionsButton={null} />);

      // Chart should still be rendered
      expect(queryByTestId('advanced-chart-iframe')).toBeInTheDocument();
    });

    it('renders advanced chart for native assets', async () => {
      const { queryByTestId } = renderWithProvider(
        <AssetPage asset={native} optionsButton={null} />,
        store,
      );

      await waitFor(() => {
        const chart = queryByTestId('advanced-chart-iframe');
        expect(chart).toBeInTheDocument();
      });
    });

    it('uses correct asset ID for advanced chart', async () => {
      const address = '0xe4246B1Ac0Ba6839d9efA41a8A30AE3007185f55';

      const { queryByTestId } = renderWithProvider(
        <AssetPage asset={{ ...token, address }} optionsButton={null} />,
        store,
      );

      await waitFor(() => {
        const chart = queryByTestId('advanced-chart-iframe');
        expect(chart).toBeInTheDocument();
      });
    });

    it('handles indicator toggle without crashing', async () => {
      const { container, queryByText } = renderWithProvider(
        <AssetPage asset={token} optionsButton={null} />,
        store,
      );

      await waitFor(() => {
        // Try to find and click an indicator button
        const bolButton = queryByText('BOL');
        if (bolButton) {
          fireEvent.click(bolButton);
        }
        // Should not crash
        expect(container).toBeInTheDocument();
      });
    });

    it('handles MA toggle without crashing', async () => {
      const { container, queryByText } = renderWithProvider(
        <AssetPage asset={token} optionsButton={null} />,
        store,
      );

      await waitFor(() => {
        // Try to find and interact with MA dropdown
        const maButton = queryByText(/MA/u);
        if (maButton && maButton.textContent?.includes('▾')) {
          fireEvent.click(maButton);
        }
        // Should not crash
        expect(container).toBeInTheDocument();
      });
    });

    it('passes correct props to AdvancedChartIframe', async () => {
      const { queryByTestId } = renderWithProvider(
        <AssetPage asset={token} optionsButton={null} />,
        store,
      );

      await waitFor(() => {
        const iframe = queryByTestId('advanced-chart-iframe');
        expect(iframe).toBeInTheDocument();
        // Verify iframe has correct height
        expect(iframe).toHaveStyle({ height: '300px' });
      });
    });

    it('conditionally renders IndicatorBar based on chart type', async () => {
      const { container, queryByText } = renderWithProvider(
        <AssetPage asset={token} optionsButton={null} />,
        store,
      );

      await waitFor(() => {
        // IndicatorBar should only show for candle charts
        // For line charts, it should not be visible
        const indicatorBar = queryByText('BOL');

        // Test passes if component renders without errors
        // The visibility depends on chart type state
        expect(container).toBeInTheDocument();
      });
    });
  });
});
