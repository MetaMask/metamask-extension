import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { fireEvent, waitFor } from '@testing-library/react';
import { EthAccountType, EthMethod, BtcScope } from '@metamask/keyring-api';
import { AVAILABLE_MULTICHAIN_NETWORK_CONFIGURATIONS } from '@metamask/multichain-network-controller';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { KeyringType } from '../../../../shared/constants/keyring';
import { useIsOriginalNativeTokenSymbol } from '../../../hooks/useIsOriginalNativeTokenSymbol';
import useMultiPolling from '../../../hooks/useMultiPolling';
import { ETH_EOA_METHODS } from '../../../../shared/constants/eth-methods';
import { getIntlLocale } from '../../../ducks/locale/locale';
import { mockNetworkState } from '../../../../test/stub/networks';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import EthOverview from './eth-overview';

const mockTrackEvent = jest.fn();

jest.mock('../../../hooks/useAnalytics', () => {
  const { createEventBuilder } = jest.requireActual(
    '../../../../shared/lib/analytics/create-event-builder',
  );

  return {
    useAnalytics: () => ({
      trackEvent: mockTrackEvent,
      createEventBuilder,
    }),
  };
});

const mockOpenBatchSellExperience = jest.fn();

jest.mock('../../../hooks/batch-sell/useBatchSell', () => ({
  useBatchSell: () => ({
    openBatchSellExperience: mockOpenBatchSellExperience,
  }),
}));

// TODO: Remove this mock when multichain accounts feature flag is entirely removed.
// TODO: Convert any old tests (UI/UX state 1) to its state 2 equivalent (if possible).
jest.mock(
  '../../../../shared/lib/multichain-accounts/remote-feature-flag',
  () => ({
    ...jest.requireActual(
      '../../../../shared/lib/multichain-accounts/remote-feature-flag',
    ),
    isMultichainAccountsFeatureEnabled: () => false,
  }),
);

jest.mock('../../../hooks/useIsOriginalNativeTokenSymbol', () => {
  return {
    useIsOriginalNativeTokenSymbol: jest.fn(),
  };
});

jest.mock('../../../hooks/rewards/useRewardsModal', () => ({
  useRewardsModal: jest.fn(),
}));

jest.mock('../../../ducks/locale/locale', () => ({
  ...jest.requireActual('../../../ducks/locale/locale'),
  getIntlLocale: jest.fn(),
}));

jest.mock('../../../store/actions', () => ({
  startNewDraftTransaction: jest.fn(),
  tokenBalancesStartPolling: jest.fn().mockResolvedValue('pollingToken'),
  tokenBalancesStopPollingByPollingToken: jest.fn(),
}));

jest.mock('../../../hooks/useMultiPolling', () => ({
  __esModule: true,
  default: jest.fn(),
}));

const mockOpenBuyCryptoInPdapp = jest.fn();
jest.mock('../../../hooks/ramps/useRamps/useRamps', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    openBuyCryptoInPdapp: mockOpenBuyCryptoInPdapp,
  })),
  RampsMetaMaskEntry: {
    BuySellButton: 'ext_buy_sell_button',
  },
}));

const mockGetIntlLocale = getIntlLocale;

let openTabSpy;

describe('EthOverview', () => {
  useIsOriginalNativeTokenSymbol.mockReturnValue(true);
  mockGetIntlLocale.mockReturnValue('en-US');

  const mockEvmAccount1 = {
    address: '0x1',
    id: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
    metadata: {
      name: 'Account 1',
      keyring: {
        type: KeyringType.imported,
      },
    },
    options: {},
    methods: ETH_EOA_METHODS,
    type: EthAccountType.Eoa,
    scopes: ['eip155:0'],
  };

  const mockEvmAccount2 = {
    address: '0x2',
    id: 'e9b992f9-e151-4317-b8b7-c771bb73dd02',
    metadata: {
      name: 'Account 2',
      keyring: {
        type: KeyringType.imported,
      },
    },
    options: {},
    methods: ETH_EOA_METHODS,
    type: EthAccountType.Eoa,
    scopes: ['eip155:0'],
  };

  const mockStore = {
    appState: {
      confirmationExchangeRates: {},
    },
    localeMessages: {
      currentLocale: 'en-US',
    },
    metamask: {
      ...mockNetworkState({ chainId: CHAIN_IDS.MAINNET }),
      selectedAccountGroup: 'entropy:wallet1/group1',
      accountTree: {
        wallets: {
          'entropy:wallet1': {
            id: 'entropy:wallet1',
            groups: {
              'entropy:wallet1/group1': {
                id: 'entropy:wallet1/group1',
                type: 'multichain-account',
                accounts: [mockEvmAccount1.id],
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
      },
      tokenBalances: {
        [CHAIN_IDS.MAINNET]: {},
      },
      remoteFeatureFlags: {
        batchSell: { enabled: true },
        bridgeConfig: {
          support: true,
        },
      },
      accountsByChainId: {
        [CHAIN_IDS.MAINNET]: {
          '0x1': { address: mockEvmAccount1.address, balance: '0x1F4' },
        },
        [CHAIN_IDS.SEPOLIA]: {
          '0x1': {
            address: mockEvmAccount1.address,
            balance: '0x24da51d247e8b8',
          },
        },
      },
      tokenList: [],
      cachedBalances: {
        '0x1': {
          [mockEvmAccount1.address]: '0x1F4',
        },
      },
      preferences: {
        showNativeTokenAsMainBalance: true,
        tokenNetworkFilter: {},
      },
      enabledNetworkMap: {
        eip155: {
          [CHAIN_IDS.MAINNET]: true,
        },
      },
      useExternalServices: true,
      useCurrencyRateCheck: true,
      currentCurrency: 'usd',
      currencyRates: {
        ETH: {
          conversionRate: 2,
        },
      },
      accounts: {
        [mockEvmAccount1.address]: {
          address: mockEvmAccount1.address,
          balance: '0x1F4',
        },
      },
      internalAccounts: {
        accounts: {
          [mockEvmAccount1.id]: mockEvmAccount1,
          [mockEvmAccount2.id]: mockEvmAccount2,
        },
        selectedAccount: mockEvmAccount1.id,
      },
      keyrings: [
        {
          type: KeyringType.imported,
          accounts: [mockEvmAccount1.address, mockEvmAccount2.address],
        },
        {
          type: KeyringType.ledger,
          accounts: [],
        },
      ],
      balances: {},
      isEvmSelected: true,
      multichainNetworkConfigurationsByChainId:
        AVAILABLE_MULTICHAIN_NETWORK_CONFIGURATIONS,
      selectedMultichainNetworkChainId: BtcScope.Mainnet,
    },
  };

  const store = configureMockStore([thunk])(mockStore);
  const ETH_OVERVIEW_BUY = 'eth-overview-buy';
  const ETH_OVERVIEW_BRIDGE = 'eth-overview-bridge';
  const ETH_OVERVIEW_RECEIVE = 'eth-overview-receive';
  const ETH_OVERVIEW_SWAP = 'eth-overview-swap';
  const ETH_OVERVIEW_SEND = 'eth-overview-send';
  const ETH_OVERVIEW_PRIMARY_CURRENCY = 'eth-overview__primary-currency';
  const ETH_OVERVIEW_BALANCE_EMPTY_STATE = 'coin-overview-balance-empty-state';
  const ETH_OVERVIEW_BALANCE_SKELETON = 'coin-overview-balance-skeleton';

  afterEach(() => {
    store.clearActions();
    mockOpenBatchSellExperience.mockClear();
  });

  describe('EthOverview', () => {
    beforeAll(() => {
      jest.clearAllMocks();
      Object.defineProperty(global, 'platform', {
        value: {
          openTab: jest.fn(),
        },
      });
      openTabSpy = jest.spyOn(global.platform, 'openTab');
    });

    beforeEach(() => {
      openTabSpy.mockClear();
      // Clear previous mock implementations
      useMultiPolling.mockClear();

      // Mock implementation for useMultiPolling
      useMultiPolling.mockImplementation(({ input }) => {
        // Mock startPolling and stopPollingByPollingToken for each input
        const startPolling = jest.fn().mockResolvedValue('mockPollingToken');
        const stopPollingByPollingToken = jest.fn();

        input.forEach((inputItem) => {
          const key = JSON.stringify(inputItem);
          // Simulate returning a unique token for each input
          startPolling.mockResolvedValueOnce(`mockToken-${key}`);
        });

        return { startPolling, stopPollingByPollingToken };
      });
    });

    it('should show the primary balance', async () => {
      const { queryByTestId, queryByText } = renderWithProvider(
        <EthOverview />,
        store,
      );

      const primaryBalance = queryByTestId(ETH_OVERVIEW_PRIMARY_CURRENCY);
      expect(primaryBalance).toBeInTheDocument();
      expect(primaryBalance).toHaveTextContent('0 ETH');
      expect(queryByText('*')).not.toBeInTheDocument();
    });

    it('should show a balance skeleton instead of the empty state while balance records are loading', async () => {
      const mockedStoreWithLoadingBalance = {
        ...mockStore,
        metamask: {
          ...mockStore.metamask,
          accountsByChainId: {},
          tokenBalances: {},
          balances: {},
        },
      };
      const mockedStore = configureMockStore([thunk])(
        mockedStoreWithLoadingBalance,
      );

      const { queryByTestId } = renderWithProvider(
        <EthOverview />,
        mockedStore,
      );

      expect(queryByTestId(ETH_OVERVIEW_BALANCE_SKELETON)).toBeInTheDocument();
      expect(
        queryByTestId(ETH_OVERVIEW_BALANCE_EMPTY_STATE),
      ).not.toBeInTheDocument();
    });

    it('should show the empty state when mainnet balance records loaded and confirm zero balance', async () => {
      const mockedStoreWithZeroBalance = {
        ...mockStore,
        metamask: {
          ...mockStore.metamask,
          accountsByChainId: {
            [CHAIN_IDS.MAINNET]: {
              '0x1': { address: mockEvmAccount1.address, balance: '0x0' },
            },
          },
          tokenBalances: {},
          balances: {},
        },
      };
      const mockedStore = configureMockStore([thunk])(
        mockedStoreWithZeroBalance,
      );

      const { queryByTestId } = renderWithProvider(
        <EthOverview />,
        mockedStore,
      );

      expect(
        queryByTestId(ETH_OVERVIEW_BALANCE_EMPTY_STATE),
      ).toBeInTheDocument();
      expect(
        queryByTestId(ETH_OVERVIEW_BALANCE_SKELETON),
      ).not.toBeInTheDocument();
    });

    it('should show the cached primary balance', async () => {
      const mockedStoreWithCachedBalance = {
        ...mockStore,
        metamask: {
          ...mockStore.metamask,
          accounts: {
            '0x1': {
              address: '0x1',
            },
          },
          accountsByChainId: {
            [CHAIN_IDS.MAINNET]: {
              '0x1': { address: '0x1', balance: '0x24da51d247e8b8' },
            },
          },
        },
      };
      const mockedStore = configureMockStore([thunk])(
        mockedStoreWithCachedBalance,
      );

      const { queryByTestId, queryByText } = renderWithProvider(
        <EthOverview />,
        mockedStore,
      );

      const primaryBalance = queryByTestId(ETH_OVERVIEW_PRIMARY_CURRENCY);
      expect(primaryBalance).toBeInTheDocument();
      expect(primaryBalance).toHaveTextContent('0.0104 ETH');
      expect(queryByText('*')).not.toBeInTheDocument();
    });

    it('should have the Swap button enabled if chain id is part of supported chains', () => {
      const mockedAvalancheStore = {
        ...mockStore,
        metamask: {
          ...mockStore.metamask,
          ...mockNetworkState({ chainId: '0xa86a' }),
          accountsByChainId: {
            [CHAIN_IDS.AVALANCHE]: {
              '0x1': { address: '0x1', balance: '0x24da51d247e8b8' },
            },
          },
        },
      };
      const mockedStore = configureMockStore([thunk])(mockedAvalancheStore);

      const { queryByTestId } = renderWithProvider(
        <EthOverview />,
        mockedStore,
      );
      const bridgeButton = queryByTestId(ETH_OVERVIEW_SWAP);
      expect(bridgeButton).toBeInTheDocument();
      expect(bridgeButton).toBeEnabled();
      expect(bridgeButton.parentElement).not.toHaveAttribute(
        'data-original-title',
        'Unavailable on this network',
      );
    });

    it('should not render the Bridge button on testnet chains', () => {
      const mockedFantomStore = {
        ...mockStore,
        metamask: {
          ...mockStore.metamask,
          ...mockNetworkState({ chainId: CHAIN_IDS.SEPOLIA }),
        },
      };
      const mockedStore = configureMockStore([thunk])(mockedFantomStore);

      const { queryByTestId } = renderWithProvider(
        <EthOverview />,
        mockedStore,
      );
      const bridgeButton = queryByTestId(ETH_OVERVIEW_BRIDGE);
      expect(bridgeButton).not.toBeInTheDocument();
    });

    it('should show the Receive button inside the more-options dropdown', () => {
      const { queryByTestId } = renderWithProvider(<EthOverview />, store);

      // Receive moved into the "More" dropdown – it is hidden until the dropdown is opened
      expect(queryByTestId(ETH_OVERVIEW_RECEIVE)).not.toBeInTheDocument();

      fireEvent.click(queryByTestId('eth-overview-more'));

      expect(queryByTestId(ETH_OVERVIEW_RECEIVE)).toBeInTheDocument();
    });

    it('should show the Batch Sell button inside the more-options dropdown', () => {
      const { queryByTestId } = renderWithProvider(<EthOverview />, store);

      expect(queryByTestId('eth-overview-batchSell')).not.toBeInTheDocument();

      fireEvent.click(queryByTestId('eth-overview-more'));

      expect(queryByTestId('eth-overview-batchSell')).toBeInTheDocument();
    });

    it('should call openBatchSellExperience when Batch Sell button is clicked', () => {
      const { queryByTestId } = renderWithProvider(<EthOverview />, store);

      fireEvent.click(queryByTestId('eth-overview-more'));
      fireEvent.click(queryByTestId('eth-overview-batchSell'));

      expect(mockOpenBatchSellExperience).toHaveBeenCalledTimes(1);
    });

    it('should show Receive as a direct button when Batch Sell is disabled', () => {
      const disabledBatchSellStore = configureMockStore([thunk])({
        ...mockStore,
        metamask: {
          ...mockStore.metamask,
          remoteFeatureFlags: {
            ...mockStore.metamask.remoteFeatureFlags,
            batchSell: { enabled: false },
          },
        },
      });

      const { queryByTestId } = renderWithProvider(
        <EthOverview />,
        disabledBatchSellStore,
      );

      // Only one action enabled → renders as a direct button, not a dropdown
      expect(queryByTestId('eth-overview-more')).not.toBeInTheDocument();
      expect(queryByTestId('eth-overview-default')).toBeInTheDocument();
      expect(queryByTestId('eth-overview-batchSell')).not.toBeInTheDocument();
    });

    it('should always show the Portfolio button', () => {
      const { queryByTestId } = renderWithProvider(<EthOverview />, store);
      const portfolioButton = queryByTestId('portfolio-link');
      expect(portfolioButton).toBeInTheDocument();
    });

    it('should always show the Buy button regardless of current chain Id', () => {
      const { queryByTestId } = renderWithProvider(<EthOverview />, store);
      const buyButton = queryByTestId(ETH_OVERVIEW_BUY);
      expect(buyButton).toBeInTheDocument();
    });

    it('should keep the Buy native token button enabled on unsupported chains', () => {
      const mockedStoreWithUnbuyableChainId = {
        ...mockStore,
        metamask: {
          ...mockStore.metamask,
          ...mockNetworkState({ chainId: CHAIN_IDS.GOERLI }),
          accountsByChainId: {
            [CHAIN_IDS.GOERLI]: {
              '0x1': { address: '0x1', balance: '0x24da51d247e8b8' },
            },
          },
        },
      };
      const mockedStore = configureMockStore([thunk])(
        mockedStoreWithUnbuyableChainId,
      );

      const { queryByTestId } = renderWithProvider(
        <EthOverview />,
        mockedStore,
      );
      const buyButton = queryByTestId(ETH_OVERVIEW_BUY);
      expect(buyButton).toBeInTheDocument();
      expect(buyButton).not.toBeDisabled();
    });

    it('should open the in-extension buy flow when clicking on Buy button', async () => {
      const mockedStoreWithBuyableChainId = {
        ...mockStore,
        metamask: {
          ...mockStore.metamask,
          ...mockNetworkState({ chainId: CHAIN_IDS.POLYGON }),
          accountsByChainId: {
            [CHAIN_IDS.POLYGON]: {
              '0x1': { address: '0x1', balance: '0x24da51d247e8b8' },
            },
          },
        },
      };
      const mockedStore = configureMockStore([thunk])(
        mockedStoreWithBuyableChainId,
      );

      const { queryByTestId } = renderWithProvider(
        <EthOverview />,
        mockedStore,
      );
      const buyButton = queryByTestId(ETH_OVERVIEW_BUY);

      expect(buyButton).toBeInTheDocument();
      expect(buyButton).not.toBeDisabled();

      fireEvent.click(buyButton);
      await waitFor(() =>
        expect(mockOpenBuyCryptoInPdapp).toHaveBeenCalledTimes(1),
      );
    });
  });

  it('sends an event when clicking the Buy button: %s', async () => {
    mockTrackEvent.mockClear();

    const mockedStore = configureMockStore([thunk])(mockStore);
    const { queryByTestId } = renderWithProvider(<EthOverview />, mockedStore);

    const buyButton = queryByTestId(ETH_OVERVIEW_BUY);
    expect(buyButton).toBeInTheDocument();
    expect(buyButton).not.toBeDisabled();
    fireEvent.click(buyButton);

    // handleBuyAndSellOnClick awaits the async goToBuy gate before tracking.
    await waitFor(() => expect(mockTrackEvent).toHaveBeenCalledTimes(1));
    expect(mockTrackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        name: MetaMetricsEventName.NavBuyButtonClicked,
        properties: expect.objectContaining({
          category: MetaMetricsEventCategory.Navigation,
          account_type: mockEvmAccount1.type,
          chain_id: CHAIN_IDS.MAINNET,
          location: 'Home',
          text: 'Buy',
          token_symbol: expect.any(Object),
        }),
      }),
    );
  });

  it('sends an event when clicking the Batch Sell button', () => {
    mockTrackEvent.mockClear();

    const mockedStore = configureMockStore([thunk])(mockStore);
    const { queryByTestId } = renderWithProvider(<EthOverview />, mockedStore);

    fireEvent.click(queryByTestId('eth-overview-more'));
    fireEvent.click(queryByTestId('eth-overview-batchSell'));

    expect(mockTrackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        name: MetaMetricsEventName.NavBatchSellButtonClicked,
        properties: expect.objectContaining({
          category: MetaMetricsEventCategory.Navigation,
          text: 'Batch Sell',
          location: 'home',
          chain_id: CHAIN_IDS.MAINNET,
        }),
      }),
    );
  });

  describe('Disabled buttons when an account cannot sign transactions', () => {
    const buttonTestCases = [
      { testId: ETH_OVERVIEW_SEND, buttonText: 'Send' },
      { testId: ETH_OVERVIEW_SWAP, buttonText: 'Swap' },
    ];

    it.each(buttonTestCases)(
      'should have the $buttonText button disabled when an account cannot sign transactions or user operations',
      ({ testId }) => {
        const mockedStoreWithoutSigningMethods = {
          ...mockStore,
          metamask: {
            ...mockStore.metamask,
            internalAccounts: {
              ...mockStore.metamask.internalAccounts,
              accounts: {
                [mockEvmAccount1.id]: {
                  ...mockEvmAccount1,
                  // Filter out all methods used for signing transactions.
                  methods: Object.values(EthMethod).filter(
                    (method) =>
                      method !== EthMethod.SignTransaction &&
                      method !== EthMethod.SignUserOperation,
                  ),
                },
              },
            },
          },
        };

        const mockedStore = configureMockStore([thunk])(
          mockedStoreWithoutSigningMethods,
        );
        const { queryByTestId } = renderWithProvider(
          <EthOverview />,
          mockedStore,
        );

        const button = queryByTestId(testId);
        expect(button).toBeInTheDocument();
        expect(button).toBeDisabled();
        expect(button.parentElement).toHaveAttribute(
          'data-original-title',
          'Not supported with this account.',
        );
      },
    );
  });

  it.each([
    CHAIN_IDS.MAINNET,
    // We want to test with a different chain ID than mainnet to make sure the events are still using
    // the right `token_symbol`.
    CHAIN_IDS.SEPOLIA,
  ])('sends an event when clicking the Send button: %s', (chainId) => {
    mockTrackEvent.mockClear();
    const mockedStoreWithSpecificChainId = {
      ...mockStore,
      metamask: {
        ...mockStore.metamask,
        ...mockNetworkState({ chainId }),
      },
    };

    const mockedStore = configureMockStore([thunk])(
      mockedStoreWithSpecificChainId,
    );
    const { queryByTestId } = renderWithProvider(<EthOverview />, mockedStore);

    const sendButton = queryByTestId(ETH_OVERVIEW_SEND);
    expect(sendButton).toBeInTheDocument();
    expect(sendButton).not.toBeDisabled();
    fireEvent.click(sendButton);

    expect(mockTrackEvent).toHaveBeenCalledTimes(1);
    expect(mockTrackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        name: MetaMetricsEventName.SendStarted,
        properties: expect.objectContaining({
          category: MetaMetricsEventCategory.Navigation,
          account_type: mockEvmAccount1.type,
          chain_id: chainId,
          location: 'Home',
          text: 'Send',
          token_symbol: 'ETH',
        }),
      }),
    );
  });
});
