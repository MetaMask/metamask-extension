import React from 'react';
import configureMockStore from 'redux-mock-store';
import { fireEvent, waitFor } from '@testing-library/react';
import thunk from 'redux-thunk';
import { Cryptocurrency } from '@metamask/assets-controllers';
import { BtcAccountType, BtcMethod, BtcScope } from '@metamask/keyring-api';
import { AVAILABLE_MULTICHAIN_NETWORK_CONFIGURATIONS } from '@metamask/multichain-network-controller';
import { MultichainNativeAssets } from '../../../../shared/constants/multichain/assets';
import mockState from '../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { MultichainNetworks } from '../../../../shared/constants/multichain/networks';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import useMultiPolling from '../../../hooks/useMultiPolling';
import { BITCOIN_WALLET_SNAP_ID } from '../../../../shared/lib/accounts/bitcoin-wallet-snap';
import NonEvmOverview from './non-evm-overview';

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

// After BIP-44 refactor, CoinOverview always uses AccountGroupBalance and shows
// BalanceEmptyState when selectAccountGroupBalanceForEmptyState is false. Mock
// it so the balance section renders and we can assert on primary balance/skeleton.
jest.mock('../../../selectors/assets', () => ({
  ...jest.requireActual('../../../selectors/assets'),
  selectAccountGroupBalanceForEmptyState: () => true,
}));

jest.mock('../../../hooks/rewards/useRewardsModal', () => ({
  useRewardsModal: jest.fn(),
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

jest.mock('../../../store/actions', () => ({
  handleSnapRequest: jest.fn(),
  sendMultichainTransaction: jest.fn(),
  tokenBalancesStartPolling: jest.fn().mockResolvedValue('pollingToken'),
  tokenBalancesStopPollingByPollingToken: jest.fn(),
}));

jest.mock('../../../hooks/useMultiPolling', () => ({
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __esModule: true,
  default: jest.fn(),
}));

const mockOpenBuyCryptoInPdapp = jest.fn();
jest.mock('../../../hooks/ramps/useRamps/useRamps', () => ({
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __esModule: true,
  default: jest.fn(() => ({
    openBuyCryptoInPdapp: mockOpenBuyCryptoInPdapp,
  })),
  RampsMetaMaskEntry: {
    BuySellButton: 'ext_buy_sell_button',
    NftBanner: 'ext_buy_banner_nfts',
    TokensBanner: 'ext_buy_banner_tokens',
    ActivityBanner: 'ext_buy_banner_activity',
    BtcBanner: 'ext_buy_banner_btc',
  },
}));

const BUY_BUTTON = 'coin-overview-buy';
const BTC_OVERVIEW_BRIDGE = 'coin-overview-bridge';
const BTC_OVERVIEW_RECEIVE = 'coin-overview-receive';
const BTC_OVERVIEW_SWAP = 'coin-overview-swap';
const BTC_OVERVIEW_SEND = 'coin-overview-send';
const BTC_OVERVIEW_PRIMARY_CURRENCY = 'coin-overview__primary-currency';

const mockAnalyticsId = 'deadbeef';
const mockNonEvmBalance = '1';
const mockNonEvmAccount = {
  address: 'bc1qwl8399fz829uqvqly9tcatgrgtwp3udnhxfq4k',
  id: '542490c8-d178-433b-9f31-f680b11f45a5',
  scopes: [BtcScope.Mainnet],
  metadata: {
    name: 'Bitcoin Account',
    keyring: {
      type: 'Snap Keyring',
    },
    snap: {
      id: BITCOIN_WALLET_SNAP_ID,
      name: 'btc-snap-name',
    },
  },
  options: {},
  methods: Object.values(BtcMethod),
  type: BtcAccountType.P2wpkh,
};

const mockMetamaskStore = {
  ...mockState.metamask,
  remoteFeatureFlags: {
    batchSell: { enabled: true },
    bitcoinAccounts: { enabled: true, minimumVersion: '13.6.0' },
    bridgeConfig: {
      support: true,
    },
  },
  useExternalServices: true,
  accountsAssets: {
    [mockNonEvmAccount.id]: [MultichainNativeAssets.BITCOIN],
  },
  internalAccounts: {
    accounts: {
      [mockNonEvmAccount.id]: mockNonEvmAccount,
    },
    selectedAccount: mockNonEvmAccount.id,
  },
  // Account tree required by CoinOverview/AccountGroupBalance after BIP-44 refactor
  selectedAccountGroup: 'entropy:wallet1/group1',
  accountTree: {
    wallets: {
      'entropy:wallet1': {
        id: 'entropy:wallet1',
        groups: {
          'entropy:wallet1/group1': {
            id: 'entropy:wallet1/group1',
            type: 'multichain-account',
            accounts: [mockNonEvmAccount.id],
            metadata: {
              name: 'Account',
              hidden: false,
              pinned: false,
              lastSelected: 0,
            },
          },
        },
      },
    },
  },
  // MultichainBalancesController
  balances: {
    [mockNonEvmAccount.id]: {
      [MultichainNativeAssets.BITCOIN]: {
        amount: mockNonEvmBalance,
        unit: 'BTC',
      },
    },
  },
  // (Multichain) RatesController
  fiatCurrency: 'usd',
  conversionRates: {
    [Cryptocurrency.Btc]: {
      conversionRate: '1.000',
      conversionDate: 0,
    },
  },
  cryptocurrencies: [Cryptocurrency.Btc],
  // Required, during onboarding, the extension will assume we're in an "EVM context", meaning
  // most multichain selectors will not use non-EVM logic despite having a non-EVM
  // selected account
  completedOnboarding: true,
  // Used when clicking on some buttons
  analyticsId: mockAnalyticsId,
  // Override state if provided
  multichainNetworkConfigurationsByChainId:
    AVAILABLE_MULTICHAIN_NETWORK_CONFIGURATIONS,
  selectedMultichainNetworkChainId: BtcScope.Mainnet,
  isEvmSelected: false,
  enabledNetworkMap: {
    bip122: {
      [MultichainNetworks.BITCOIN]: true,
    },
  },
};

function getStore(state?: Record<string, unknown>) {
  return configureMockStore([thunk])({
    metamask: mockMetamaskStore,
    localeMessages: {
      currentLocale: 'en-US',
    },
    ...state,
  });
}

describe('NonEvmOverview', () => {
  beforeEach(() => {
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

  it('shows the primary balance using the native token when showNativeTokenAsMainBalance if true', async () => {
    const { queryByTestId } = renderWithProvider(
      <NonEvmOverview />,
      getStore(),
    );

    const primaryBalance = queryByTestId(BTC_OVERVIEW_PRIMARY_CURRENCY);
    expect(primaryBalance).toBeInTheDocument();
    // AccountGroupBalance formats via formatTokenQuantity (e.g. "1 BTC" with space)
    expect(primaryBalance).toHaveTextContent(`${mockNonEvmBalance} BTC`);
  });

  it('shows the primary balance as fiat when showNativeTokenAsMainBalance if false', async () => {
    const { queryByTestId } = renderWithProvider(
      <NonEvmOverview />,
      getStore({
        metamask: {
          ...mockMetamaskStore,
          // The balances won't be available
          preferences: {
            showNativeTokenAsMainBalance: false,
            privacyMode: false,
          },
          enabledNetworkMap: {
            bip122: {
              [MultichainNetworks.BITCOIN]: true,
            },
          },
          currentCurrency: 'usd',
          conversionRates: {
            [MultichainNativeAssets.BITCOIN]: {
              rate: '1',
            },
          },
        },
      }),
    );

    const primaryBalance = queryByTestId(BTC_OVERVIEW_PRIMARY_CURRENCY);
    expect(primaryBalance).toBeInTheDocument();
    // AccountGroupBalance shows fiat via formatCurrency when showNativeTokenAsMainBalance is false.
    expect(primaryBalance).toHaveTextContent(/\$\d+\.\d+/u);
  });

  it('shows balance section when balance is not available (displays zero)', () => {
    const { queryByTestId } = renderWithProvider(
      <NonEvmOverview />,
      getStore({
        metamask: {
          ...mockMetamaskStore,
          balances: {},
          accountsAssets: {
            [mockNonEvmAccount.id]: [],
          },
        },
      }),
    );

    // After BIP-44 refactor, balance section always renders; empty balances show as zero
    const primaryBalance = queryByTestId(BTC_OVERVIEW_PRIMARY_CURRENCY);
    expect(primaryBalance).toBeInTheDocument();
    expect(primaryBalance).toHaveTextContent(/0\s*BTC/u);
  });

  it.skip('buttons Swap/Bridge are disabled', () => {
    const { queryByTestId } = renderWithProvider(
      <NonEvmOverview />,
      getStore(),
    );

    for (const buttonTestId of [BTC_OVERVIEW_SWAP, BTC_OVERVIEW_BRIDGE]) {
      const button = queryByTestId(buttonTestId);
      expect(button).toBeInTheDocument();
      expect(button).toBeDisabled();
    }
  });

  it('shows the "Buy & Sell" button', () => {
    const { queryByTestId } = renderWithProvider(
      <NonEvmOverview />,
      getStore(),
    );
    const buyButton = queryByTestId(BUY_BUTTON);
    expect(buyButton).toBeInTheDocument();
  });

  it('keeps the "Buy & Sell" button enabled regardless of buyable chain state', () => {
    const { queryByTestId } = renderWithProvider(
      <NonEvmOverview />,
      getStore(),
    );
    const buyButton = queryByTestId(BUY_BUTTON);

    expect(buyButton).toBeInTheDocument();
    expect(buyButton).not.toBeDisabled();
  });

  it('calls openBuyInPdapp when clicking on "Buy & Sell" button', async () => {
    const { queryByTestId } = renderWithProvider(
      <NonEvmOverview />,
      getStore(),
    );

    const buyButton = queryByTestId(BUY_BUTTON);
    expect(buyButton).toBeInTheDocument();
    fireEvent.click(buyButton as HTMLElement);
    await waitFor(() =>
      expect(mockOpenBuyCryptoInPdapp).toHaveBeenCalledTimes(1),
    );
  });

  it('sends an event when clicking the Buy button', async () => {
    mockTrackEvent.mockClear();
    const storeWithBtcBuyable = getStore();

    const { queryByTestId } = renderWithProvider(
      <NonEvmOverview />,
      storeWithBtcBuyable,
    );

    const buyButton = queryByTestId(BUY_BUTTON);
    expect(buyButton).toBeInTheDocument();
    expect(buyButton).not.toBeDisabled();
    fireEvent.click(buyButton as HTMLElement);

    // handleBuyAndSellOnClick awaits the async goToBuy gate before tracking.
    await waitFor(() => expect(mockTrackEvent).toHaveBeenCalled());
    expect(mockTrackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        name: MetaMetricsEventName.NavBuyButtonClicked,
        properties: expect.objectContaining({
          category: MetaMetricsEventCategory.Navigation,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          account_type: mockNonEvmAccount.type,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          chain_id: MultichainNetworks.BITCOIN,
          location: 'Home',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          snap_id: mockNonEvmAccount.metadata.snap.id,
          text: 'Buy',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          token_symbol: expect.any(Object),
        }),
      }),
    );
  });

  it('shows the Receive button inside the more-options dropdown', () => {
    const { queryByTestId } = renderWithProvider(
      <NonEvmOverview />,
      getStore(),
    );

    // Receive moved into the "More" dropdown – it is hidden until the dropdown is opened
    expect(queryByTestId(BTC_OVERVIEW_RECEIVE)).not.toBeInTheDocument();

    fireEvent.click(queryByTestId('coin-overview-more') as HTMLElement);

    expect(queryByTestId(BTC_OVERVIEW_RECEIVE)).toBeInTheDocument();
  });

  it('always show the Send button', () => {
    const { queryByTestId } = renderWithProvider(
      <NonEvmOverview />,
      getStore(),
    );
    const sendButton = queryByTestId(BTC_OVERVIEW_SEND);
    expect(sendButton).toBeInTheDocument();
    expect(sendButton).not.toBeDisabled();
  });

  it('sends an event when clicking the Send button', () => {
    mockTrackEvent.mockClear();
    const { queryByTestId } = renderWithProvider(
      <NonEvmOverview />,
      getStore(),
    );

    const sendButton = queryByTestId(BTC_OVERVIEW_SEND);
    expect(sendButton).toBeInTheDocument();
    expect(sendButton).not.toBeDisabled();
    fireEvent.click(sendButton as HTMLElement);

    expect(mockTrackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        name: MetaMetricsEventName.SendStarted,
        properties: expect.objectContaining({
          category: MetaMetricsEventCategory.Navigation,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          account_type: mockNonEvmAccount.type,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          chain_id: MultichainNetworks.BITCOIN,
          location: 'Home',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          snap_id: mockNonEvmAccount.metadata.snap.id,
          text: 'Send',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          token_symbol: 'BTC',
        }),
      }),
    );
  });

  it('does not disable the Send button when external services are disabled (filtering happens upstream)', () => {
    const { queryByTestId } = renderWithProvider(
      <NonEvmOverview />,
      getStore({
        metamask: {
          ...mockMetamaskStore,
          useExternalServices: false,
        },
      }),
    );

    const sendButton = queryByTestId(BTC_OVERVIEW_SEND);
    const bridgeButton = queryByTestId(BTC_OVERVIEW_BRIDGE);
    expect(sendButton).toBeInTheDocument();
    // Send button is no longer disabled - non-EVM filtering happens upstream in token/network lists
    expect(sendButton).not.toBeDisabled();
    expect(bridgeButton).not.toBeInTheDocument();
  });
});
