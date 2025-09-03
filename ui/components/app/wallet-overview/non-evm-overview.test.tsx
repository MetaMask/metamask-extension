import React from 'react';
import configureMockStore from 'redux-mock-store';
import { fireEvent } from '@testing-library/react';
import thunk from 'redux-thunk';
import { Cryptocurrency } from '@metamask/assets-controllers';
import { BtcAccountType, BtcMethod, BtcScope } from '@metamask/keyring-api';
import { AVAILABLE_MULTICHAIN_NETWORK_CONFIGURATIONS } from '@metamask/multichain-network-controller';
import { MultichainNativeAssets } from '../../../../shared/constants/multichain/assets';
import mockState from '../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../test/jest/rendering';
import { MultichainNetworks } from '../../../../shared/constants/multichain/networks';
import { defaultBuyableChains } from '../../../ducks/ramps/constants';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import useMultiPolling from '../../../hooks/useMultiPolling';
import { BITCOIN_WALLET_SNAP_ID } from '../../../../shared/lib/accounts/bitcoin-wallet-snap';
import NonEvmOverview from './non-evm-overview';

// We need to mock `dispatch` since we use it for `setDefaultHomeActiveTabName`.
const mockDispatch = jest.fn().mockReturnValue(() => jest.fn());
jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => mockDispatch,
}));

jest.mock('../../../store/actions', () => ({
  handleSnapRequest: jest.fn(),
  sendMultichainTransaction: jest.fn(),
  setDefaultHomeActiveTabName: jest.fn(),
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
}));

const BUY_BUTTON = 'coin-overview-buy';
const BTC_OVERVIEW_BRIDGE = 'coin-overview-bridge';
const BTC_OVERVIEW_RECEIVE = 'coin-overview-receive';
const BTC_OVERVIEW_SWAP = 'token-overview-button-swap';
const BTC_OVERVIEW_SEND = 'coin-overview-send';
const BTC_OVERVIEW_PRIMARY_CURRENCY = 'coin-overview__primary-currency';

const mockMetaMetricsId = 'deadbeef';
const mockNonEvmBalance = '1';
const mockNonEvmBalanceUsd = '1.00';
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

const mockBtcChain = {
  active: true,
  chainId: MultichainNetworks.BITCOIN,
  chainName: 'Bitcoin',
  shortName: 'Bitcoin',
  nativeTokenSupported: true,
  isEvm: false,
};

const mockSolanaChain = {
  active: true,
  chainId: MultichainNetworks.SOLANA,
  chainName: 'Solana',
  shortName: 'Solana',
  nativeTokenSupported: true,
  isEvm: false,
};

// default chains do not include BTC
const mockBuyableChainsEvmOnly = defaultBuyableChains.filter(
  (chain) =>
    chain.chainId !== MultichainNetworks.BITCOIN &&
    chain.chainId !== MultichainNetworks.SOLANA,
);

const mockMetamaskStore = {
  ...mockState.metamask,
  remoteFeatureFlags: {
    addBitcoinAccount: true,
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
  metaMetricsId: mockMetaMetricsId,
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
const mockRampsStore = {
  buyableChains: mockBuyableChainsEvmOnly,
};

function getStore(state?: Record<string, unknown>) {
  return configureMockStore([thunk])({
    metamask: mockMetamaskStore,
    localeMessages: {
      currentLocale: 'en',
    },
    ramps: mockRampsStore,
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
    expect(primaryBalance).toHaveTextContent(`${mockNonEvmBalance}BTC`);
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
    expect(primaryBalance).toHaveTextContent(`$${mockNonEvmBalanceUsd}USD`);
  });

  it('shows a spinner if balance is not available', async () => {
    const { container } = renderWithProvider(
      <NonEvmOverview />,
      getStore({
        metamask: {
          ...mockMetamaskStore,
          // The balances won't be available
          balances: {},
          accountsAssets: {
            [mockNonEvmAccount.id]: [],
          },
        },
      }),
    );

    const spinner = container.querySelector(
      '.coin-overview__balance .coin-overview__primary-container .spinner',
    );
    expect(spinner).toBeInTheDocument();
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

  it('"Buy & Sell" button is disabled if BTC is not buyable and SOL is not buyable', () => {
    const { queryByTestId } = renderWithProvider(
      <NonEvmOverview />,
      getStore(),
    );
    const buyButton = queryByTestId(BUY_BUTTON);

    expect(buyButton).toBeInTheDocument();
    expect(buyButton).toBeDisabled();
  });

  it('"Buy & Sell" button is enabled if BTC is buyable', () => {
    const storeWithBtcBuyable = getStore({
      ramps: {
        buyableChains: [...mockBuyableChainsEvmOnly, mockBtcChain],
      },
    });

    const { queryByTestId } = renderWithProvider(
      <NonEvmOverview />,
      storeWithBtcBuyable,
    );

    const buyButton = queryByTestId(BUY_BUTTON);

    expect(buyButton).toBeInTheDocument();
    expect(buyButton).not.toBeDisabled();
  });

  // TODO: Add solana buyable test
  it.skip('"Buy & Sell" button is enabled if SOL is buyable', () => {
    const storeWithSolanaBuyable = getStore({
      ramps: {
        buyableChains: [...mockBuyableChainsEvmOnly, mockSolanaChain],
      },
    });

    const { queryByTestId } = renderWithProvider(
      <NonEvmOverview />,
      storeWithSolanaBuyable,
    );

    const buyButton = queryByTestId(BUY_BUTTON);

    expect(buyButton).toBeInTheDocument();
    expect(buyButton).not.toBeDisabled();
  });

  it('calls openBuyInPdapp when clicking on "Buy & Sell" button', async () => {
    const storeWithBtcBuyable = getStore({
      ramps: {
        buyableChains: [...mockBuyableChainsEvmOnly, mockBtcChain],
      },
    });

    const { queryByTestId } = renderWithProvider(
      <NonEvmOverview />,
      storeWithBtcBuyable,
    );

    const buyButton = queryByTestId(BUY_BUTTON);
    expect(buyButton).toBeInTheDocument();
    fireEvent.click(buyButton as HTMLElement);
    expect(mockOpenBuyCryptoInPdapp).toHaveBeenCalledTimes(1);
  });

  it('sends an event when clicking the Buy button', () => {
    const storeWithBtcBuyable = getStore({
      ramps: {
        buyableChains: [...mockBuyableChainsEvmOnly, mockBtcChain],
      },
    });

    const mockTrackEvent = jest.fn();
    const { queryByTestId } = renderWithProvider(
      <MetaMetricsContext.Provider value={{ trackEvent: mockTrackEvent }}>
        <NonEvmOverview />
      </MetaMetricsContext.Provider>,
      storeWithBtcBuyable,
    );

    const buyButton = queryByTestId(BUY_BUTTON);
    expect(buyButton).toBeInTheDocument();
    expect(buyButton).not.toBeDisabled();
    fireEvent.click(buyButton as HTMLElement);

    expect(mockTrackEvent).toHaveBeenCalledTimes(1);
    expect(mockTrackEvent).toHaveBeenCalledWith({
      event: MetaMetricsEventName.NavBuyButtonClicked,
      category: MetaMetricsEventCategory.Navigation,
      properties: {
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        account_type: mockNonEvmAccount.type,
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        chain_id: MultichainNetworks.BITCOIN,
        location: 'Home',
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        snap_id: mockNonEvmAccount.metadata.snap.id,
        text: 'Buy',
        // We use a `SwapsEthToken` in this case, so we're expecting an entire object here.
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        token_symbol: expect.any(Object),
      },
    });
  });

  it('always show the Receive button', () => {
    const { queryByTestId } = renderWithProvider(
      <NonEvmOverview />,
      getStore(),
    );
    const receiveButton = queryByTestId(BTC_OVERVIEW_RECEIVE);
    expect(receiveButton).toBeInTheDocument();
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
    const mockTrackEvent = jest.fn();
    const { queryByTestId } = renderWithProvider(
      <MetaMetricsContext.Provider value={{ trackEvent: mockTrackEvent }}>
        <NonEvmOverview />
      </MetaMetricsContext.Provider>,
      getStore(),
    );

    const sendButton = queryByTestId(BTC_OVERVIEW_SEND);
    expect(sendButton).toBeInTheDocument();
    expect(sendButton).not.toBeDisabled();
    fireEvent.click(sendButton as HTMLElement);

    expect(mockTrackEvent).toHaveBeenCalledTimes(1);
    expect(mockTrackEvent).toHaveBeenCalledWith(
      {
        event: MetaMetricsEventName.NavSendButtonClicked,
        category: MetaMetricsEventCategory.Navigation,
        properties: {
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          account_type: mockNonEvmAccount.type,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          chain_id: MultichainNetworks.BITCOIN,
          location: 'Home',
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          snap_id: mockNonEvmAccount.metadata.snap.id,
          text: 'Send',
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          token_symbol: 'BTC',
        },
      },
      expect.any(Object),
    );
  });

  it('disables the Send and Bridge buttons if external services are disabled', () => {
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
    expect(sendButton).toBeDisabled();
    expect(bridgeButton).not.toBeInTheDocument();
  });
});
