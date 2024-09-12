import React from 'react';
import configureMockStore from 'redux-mock-store';
import { fireEvent } from '@testing-library/react';
import thunk from 'redux-thunk';
import { Cryptocurrency } from '@metamask/assets-controllers';
import { BtcAccountType, BtcMethod } from '@metamask/keyring-api';
import { MultichainNativeAssets } from '../../../../shared/constants/multichain/assets';
import mockState from '../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../test/jest/rendering';
import { MultichainNetworks } from '../../../../shared/constants/multichain/networks';
import { RampsMetaMaskEntry } from '../../../hooks/ramps/useRamps/useRamps';
import { defaultBuyableChains } from '../../../ducks/ramps/constants';
import { setBackgroundConnection } from '../../../store/background-connection';
import BtcOverview from './btc-overview';

const PORTOFOLIO_URL = 'https://portfolio.test';

const BTC_OVERVIEW_BUY = 'coin-overview-buy';
const BTC_OVERVIEW_BRIDGE = 'coin-overview-bridge';
const BTC_OVERVIEW_RECEIVE = 'coin-overview-receive';
const BTC_OVERVIEW_SWAP = 'token-overview-button-swap';
const BTC_OVERVIEW_SEND = 'coin-overview-send';
const BTC_OVERVIEW_PRIMARY_CURRENCY = 'coin-overview__primary-currency';

const mockMetaMetricsId = 'deadbeef';
const mockNonEvmBalance = '1';
const mockNonEvmAccount = {
  address: 'bc1qwl8399fz829uqvqly9tcatgrgtwp3udnhxfq4k',
  id: '542490c8-d178-433b-9f31-f680b11f45a5',
  metadata: {
    name: 'Bitcoin Account',
    keyring: {
      type: 'Snap Keyring',
    },
    snap: {
      id: 'btc-snap-id',
      name: 'btc-snap-name',
    },
  },
  options: {},
  methods: [BtcMethod.SendMany],
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
// default chains do not include BTC
const mockBuyableChainsWithoutBtc = defaultBuyableChains.filter(
  (chain) => chain.chainId !== MultichainNetworks.BITCOIN,
);
const mockBuyableChainsWithBtc = [...mockBuyableChainsWithoutBtc, mockBtcChain];

const mockMetamaskStore = {
  ...mockState.metamask,
  internalAccounts: {
    accounts: {
      [mockNonEvmAccount.id]: mockNonEvmAccount,
    },
    selectedAccount: mockNonEvmAccount.id,
  },
  // (Multichain) BalancesController
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
  rates: {
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
};
const mockRampsStore = {
  buyableChains: mockBuyableChainsWithoutBtc,
};

function getStore(state?: Record<string, unknown>) {
  return configureMockStore([thunk])({
    metamask: mockMetamaskStore,
    ramps: mockRampsStore,
    ...state,
  });
}

function makePortfolioUrl(path: string, getParams: Record<string, string>) {
  const params = new URLSearchParams(getParams);
  return `${PORTOFOLIO_URL}/${path}?${params.toString()}`;
}

describe('BtcOverview', () => {
  beforeEach(() => {
    setBackgroundConnection({ setBridgeFeatureFlags: jest.fn() } as never);
  });

  it('shows the primary balance', async () => {
    const { queryByTestId, queryByText } = renderWithProvider(
      <BtcOverview />,
      getStore(),
    );

    const primaryBalance = queryByTestId(BTC_OVERVIEW_PRIMARY_CURRENCY);
    expect(primaryBalance).toBeInTheDocument();
    expect(primaryBalance).toHaveTextContent(`${mockNonEvmBalance}BTC`);
    // For now we consider balance to be always cached
    expect(queryByText('*')).toBeInTheDocument();
  });

  it('shows a spinner if balance is not available', async () => {
    const { container } = renderWithProvider(
      <BtcOverview />,
      getStore({
        metamask: {
          ...mockMetamaskStore,
          // The balances won't be available
          balances: {},
        },
      }),
    );

    const spinner = container.querySelector(
      '.coin-overview__balance .coin-overview__primary-container .spinner',
    );
    expect(spinner).toBeInTheDocument();
  });

  it('buttons Send/Swap/Bridge are disabled', () => {
    const { queryByTestId } = renderWithProvider(<BtcOverview />, getStore());

    for (const buttonTestId of [
      BTC_OVERVIEW_SEND,
      BTC_OVERVIEW_SWAP,
      BTC_OVERVIEW_BRIDGE,
    ]) {
      const button = queryByTestId(buttonTestId);
      expect(button).toBeInTheDocument();
      expect(button).toBeDisabled();
    }
  });

  it('shows the "Buy & Sell" button', () => {
    const { queryByTestId } = renderWithProvider(<BtcOverview />, getStore());
    const buyButton = queryByTestId(BTC_OVERVIEW_BUY);
    expect(buyButton).toBeInTheDocument();
  });

  it('"Buy & Sell" button is disabled if BTC is not buyable', () => {
    const { queryByTestId } = renderWithProvider(<BtcOverview />, getStore());
    const buyButton = queryByTestId(BTC_OVERVIEW_BUY);

    expect(buyButton).toBeInTheDocument();
    expect(buyButton).toBeDisabled();
  });

  it('"Buy & Sell" button is enabled if BTC is buyable', () => {
    const storeWithBtcBuyable = getStore({
      ramps: {
        buyableChains: mockBuyableChainsWithBtc,
      },
    });

    const { queryByTestId } = renderWithProvider(
      <BtcOverview />,
      storeWithBtcBuyable,
    );

    const buyButton = queryByTestId(BTC_OVERVIEW_BUY);

    expect(buyButton).toBeInTheDocument();
    expect(buyButton).not.toBeDisabled();
  });

  it('opens the Portfolio "Buy & Sell" URI when clicking on "Buy & Sell" button', async () => {
    const storeWithBtcBuyable = getStore({
      ramps: {
        buyableChains: mockBuyableChainsWithBtc,
      },
    });

    const { queryByTestId } = renderWithProvider(
      <BtcOverview />,
      storeWithBtcBuyable,
    );

    const openTabSpy = jest.spyOn(global.platform, 'openTab');

    const buyButton = queryByTestId(BTC_OVERVIEW_BUY);
    expect(buyButton).toBeInTheDocument();
    fireEvent.click(buyButton as HTMLElement);

    expect(openTabSpy).toHaveBeenCalledTimes(1);
    expect(openTabSpy).toHaveBeenCalledWith({
      url: makePortfolioUrl('buy', {
        metamaskEntry: RampsMetaMaskEntry.BuySellButton,
        chainId: MultichainNetworks.BITCOIN,
        metametricsId: mockMetaMetricsId,
        metricsEnabled: String(false),
      }),
    });
  });

  it('always show the Receive button', () => {
    const { queryByTestId } = renderWithProvider(<BtcOverview />, getStore());
    const receiveButton = queryByTestId(BTC_OVERVIEW_RECEIVE);
    expect(receiveButton).toBeInTheDocument();
  });
});
