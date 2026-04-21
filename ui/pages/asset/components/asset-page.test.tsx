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
jest.mock('react-chartjs-2', () => ({ Line: () => null }));

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
jest.mock('../../../components/multichain/activity-v2/activity-list', () => ({
  ActivityList: () => <div data-testid="mock-activity-list" />,
}));

jest.mock('../../../hooks/useMultiPolling', () => ({
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('../../../components/app/musd/hooks/useMerklRewards', () => ({
  useMerklRewards: jest.fn(() => ({
    hasClaimableReward: false,
    rewardAmountFiat: null,
    lifetimeClaimedFiat: 0,
    isLoading: false,
    isEligible: false,
    refetch: jest.fn(),
    hasClaimedBefore: false,
    claimableRewardDisplay: null,
  })),
}));

jest.mock('../../../components/app/musd/hooks/useMerklClaim', () => ({
  useMerklClaim: jest.fn(() => ({
    claimRewards: jest.fn(),
    isClaiming: false,
    error: null,
  })),
}));

const selectedAccountAddress = 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3';

function mockGetDefaultAssetsBySelectedAccountGroup() {
  return {
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
}

jest.mock('../../../selectors/assets', () => ({
  ...jest.requireActual('../../../selectors/assets'),
  getAssetsBySelectedAccountGroup: jest.fn(() =>
    mockGetDefaultAssetsBySelectedAccountGroup(),
  ),
}));

describe('AssetPage', () => {
  const mockStore = {
    localeMessages: {
      currentLocale: 'en',
    },
    appState: {
      confirmationExchangeRates: {},
    },
    metamask: {
      ...mockMultichainNetworkState(),
      txHistory: {},
      remoteFeatureFlags: {
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

  it('should disable the buy button on unsupported chains', () => {
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
    expect(buyButton).toBeDisabled();
  });

  it('should open the buy crypto URL for a buyable chain ID', async () => {
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
    expect(openTabSpy).toHaveBeenCalledTimes(1);

    await waitFor(() =>
      expect(openTabSpy).toHaveBeenCalledWith({
        url: expect.stringContaining(`/buy?metamaskEntry=ext_buy_sell_button`),
      }),
    );
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
    const { container } = renderWithProvider(
      <AssetPage asset={native} optionsButton={null} />,
      store,
      '/0x1',
    );
    const dynamicImages = container.querySelectorAll('img[alt*="logo"]');
    dynamicImages.forEach((img) => {
      img.setAttribute('alt', 'static-logo');
    });
    expect(container).toMatchSnapshot();
  });

  it('should render an ERC20 asset without prices', async () => {
    const address = '0x309375769E79382beFDEc5bdab51063AeBDC4936';

    const { container, queryByTestId } = renderWithProvider(
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

    // Verify loading finishes and we show the empty state (API returned no prices)
    await waitFor(() => {
      const chart = queryByTestId('asset-chart-empty-state');
      expect(chart).toBeInTheDocument();
    });

    const dynamicImages = container.querySelectorAll('img[alt*="logo"]');
    dynamicImages.forEach((img) => {
      img.setAttribute('alt', 'static-logo');
    });
    const elementsWithAria = container.querySelectorAll('[aria-describedby]');
    elementsWithAria.forEach((el) =>
      el.setAttribute('aria-describedby', 'static-tooltip-id'),
    );

    expect(container).toMatchSnapshot();
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

    // Verify chart is rendered
    await waitFor(() => {
      const chart = queryByTestId('asset-price-chart');
      expect(chart).toBeInTheDocument();
    });

    // Verify market data is rendered
    const marketCapElement = queryByTestId('asset-market-cap');
    expect(marketCapElement).toHaveTextContent('$56.09K');

    const dynamicImages = container.querySelectorAll('img[alt*="logo"]');
    dynamicImages.forEach((img) => {
      img.setAttribute('alt', 'static-logo');
    });
    const elementsWithAria = container.querySelectorAll('[aria-describedby]');
    elementsWithAria.forEach((el) =>
      el.setAttribute('aria-describedby', 'static-tooltip-id'),
    );
    expect(container).toMatchSnapshot();
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
      earnMerklCampaignClaiming?: boolean;
    }) => ({
      bridgeConfig: {
        support: true,
      },
      earnMusdConversionFlowEnabled: true,
      earnMerklCampaignClaiming: true,
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
      expect(queryByTestId('musd-bonus-section')).not.toBeInTheDocument();
      expect(queryByTestId('musd-convert-section')).not.toBeInTheDocument();
    });

    it('hides bonus section when Merkl claiming is off but shows position and convert', () => {
      const { queryByTestId } = renderWithProvider(
        <AssetPage asset={musdToken} optionsButton={null} />,
        configureMockStore([thunk])({
          ...mockStore,
          metamask: {
            ...mockStore.metamask,
            remoteFeatureFlags: musdRemoteFlags({
              earnMerklCampaignClaiming: false,
            }),
          },
        }),
      );

      expect(queryByTestId('musd-position-section')).toBeInTheDocument();
      expect(queryByTestId('musd-convert-section')).toBeInTheDocument();
      expect(queryByTestId('musd-bonus-section')).not.toBeInTheDocument();
    });

    it('renders position, bonus, and convert when flow and Merkl claiming are on', () => {
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
      expect(queryByTestId('musd-convert-section')).toBeInTheDocument();
      expect(queryByTestId('musd-bonus-section')).toBeInTheDocument();
    });
  });

  describe('mUSD bonus cross-chain aggregation', () => {
    const musdRemoteFlags = (overrides: {
      earnMusdConversionFlowEnabled?: boolean;
      earnMerklCampaignClaiming?: boolean;
    }) => ({
      bridgeConfig: {
        support: true,
      },
      earnMusdConversionFlowEnabled: true,
      earnMerklCampaignClaiming: true,
      ...overrides,
    });

    const musdBaseAsset = {
      type: AssetType.token,
      chainId: CHAIN_IDS.MAINNET,
      address: MUSD_TOKEN_ADDRESS,
      symbol: 'MUSD',
      decimals: 6,
      image: '',
      balance: {
        value: '0',
        display: '0',
        fiat: '',
      },
    } as const;

    const musdLineaAsset = {
      ...musdBaseAsset,
      chainId: CHAIN_IDS.LINEA_MAINNET,
    };

    const buildMusdAssetsByChain = (options: {
      mainnetFiat: number;
      lineaFiat: number;
      mainnetPositive: boolean;
      lineaPositive: boolean;
    }) => {
      const { mainnetFiat, lineaFiat, mainnetPositive, lineaPositive } =
        options;
      const mainnetRaw = mainnetPositive ? '0x01' : '0x0';
      const lineaRaw = lineaPositive ? '0x01' : '0x0';
      const defaultMainnet =
        mockGetDefaultAssetsBySelectedAccountGroup()['0x1'];
      return {
        [CHAIN_IDS.MAINNET]: [
          ...defaultMainnet.slice(0, 3),
          {
            assetId: MUSD_TOKEN_ADDRESS,
            address: MUSD_TOKEN_ADDRESS,
            rawBalance: mainnetRaw,
            balance: mainnetPositive ? '1' : '0',
            fiat: { balance: mainnetFiat },
          },
        ],
        [CHAIN_IDS.LINEA_MAINNET]: [
          {
            assetId: MUSD_TOKEN_ADDRESS,
            address: MUSD_TOKEN_ADDRESS,
            rawBalance: lineaRaw,
            balance: lineaPositive ? '1' : '0',
            fiat: { balance: lineaFiat },
          },
        ],
      };
    };

    afterEach(() => {
      (
        getAssetsBySelectedAccountGroup as unknown as jest.Mock
      ).mockImplementation(() => mockGetDefaultAssetsBySelectedAccountGroup());
    });

    it('shows estimated annual bonus as 3% of combined Mainnet and Linea fiat when viewing Mainnet mUSD', () => {
      (getAssetsBySelectedAccountGroup as unknown as jest.Mock).mockReturnValue(
        buildMusdAssetsByChain({
          mainnetFiat: 1000,
          lineaFiat: 500,
          mainnetPositive: true,
          lineaPositive: true,
        }),
      );

      const { getByText } = renderWithProvider(
        <AssetPage asset={musdBaseAsset} optionsButton={null} />,
        configureMockStore([thunk])({
          ...mockStore,
          metamask: {
            ...mockStore.metamask,
            remoteFeatureFlags: musdRemoteFlags({}),
          },
        }),
      );

      expect(
        getByText(messages.musdAssetBonusEstimatedAnnual.message),
      ).toBeInTheDocument();
      expect(getByText(/\+\$45\.00/u)).toBeInTheDocument();
    });

    it('shows the same estimated annual bonus when viewing Linea mUSD as when viewing Mainnet', () => {
      (getAssetsBySelectedAccountGroup as unknown as jest.Mock).mockReturnValue(
        buildMusdAssetsByChain({
          mainnetFiat: 1000,
          lineaFiat: 500,
          mainnetPositive: true,
          lineaPositive: true,
        }),
      );

      const { getByText } = renderWithProvider(
        <AssetPage asset={musdLineaAsset} optionsButton={null} />,
        configureMockStore([thunk])({
          ...mockStore,
          metamask: {
            ...mockStore.metamask,
            remoteFeatureFlags: musdRemoteFlags({}),
          },
        }),
      );

      expect(getByText(/\+\$45\.00/u)).toBeInTheDocument();
    });

    it('shows Accruing next bonus on Linea when mUSD is only on Mainnet', () => {
      (getAssetsBySelectedAccountGroup as unknown as jest.Mock).mockReturnValue(
        buildMusdAssetsByChain({
          mainnetFiat: 100,
          lineaFiat: 0,
          mainnetPositive: true,
          lineaPositive: false,
        }),
      );

      const { getByText } = renderWithProvider(
        <AssetPage asset={musdLineaAsset} optionsButton={null} />,
        configureMockStore([thunk])({
          ...mockStore,
          metamask: {
            ...mockStore.metamask,
            remoteFeatureFlags: musdRemoteFlags({}),
          },
        }),
      );

      expect(
        getByText(messages.musdAssetBonusAccruing.message),
      ).toBeInTheDocument();
    });
  });
});
