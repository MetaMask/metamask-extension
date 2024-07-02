import React from 'react';
import configureMockStore from 'redux-mock-store';
import { fireEvent } from '@testing-library/react';
import thunk from 'redux-thunk';
import { Cryptocurrency } from '@metamask/assets-controllers';
import { BtcAccountType, BtcMethod } from '@metamask/keyring-api';
import nock from 'nock';
import { MultichainNativeAssets } from '../../../../shared/constants/multichain/assets';
import mockState from '../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../test/jest/rendering';
import { MultichainNetworks } from '../../../../shared/constants/multichain/networks';
import { RampsMetaMaskEntry } from '../../../hooks/ramps/useRamps/useRamps';
import { BRIDGE_API_BASE_URL } from '../../../../shared/constants/bridge';
import BtcOverview from './btc-overview';

jest.mock('../../../store/actions.ts', () => ({
  ...jest.requireActual('../../../store/actions.ts'),
  setBridgeFeatureFlags: jest.fn(() => ({
    type: 'setBridgeFeatureFlags',
    payload: {},
  })),
}));

const PORTOFOLIO_URL = 'https://portfolio.test';

const BTC_OVERVIEW_BUY = 'coin-overview-buy';
const BTC_OVERVIEW_BRIDGE = 'coin-overview-bridge';
const BTC_OVERVIEW_PORTFOLIO = 'coin-overview-portfolio';
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

function getStore(state?: Record<string, unknown>) {
  return configureMockStore([thunk])({
    metamask: {
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
      ...state,
    },
  });
}

function makePortfolioUrl(path: string, getParams: Record<string, string>) {
  const params = new URLSearchParams(getParams);
  return `${PORTOFOLIO_URL}/${path}?${params.toString()}`;
}

describe('BtcOverview', () => {
  beforeEach(() => {
    nock(BRIDGE_API_BASE_URL)
      .get('/getAllFeatureFlags')
      .reply(200, { 'extension-support': false });
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
        // The balances won't be available
        balances: {},
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

  it('opens the Portfolio "Buy & Sell" URI when clicking on "Buy & Sell" button', async () => {
    const { queryByTestId } = renderWithProvider(<BtcOverview />, getStore());
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
      }),
    });
  });

  it('always show the Portfolio button', () => {
    const { queryByTestId } = renderWithProvider(<BtcOverview />, getStore());
    const portfolioButton = queryByTestId(BTC_OVERVIEW_PORTFOLIO);
    expect(portfolioButton).toBeInTheDocument();
  });

  it('open the Portfolio URI when clicking on Portfolio button', async () => {
    const { queryByTestId } = renderWithProvider(<BtcOverview />, getStore());
    const openTabSpy = jest.spyOn(global.platform, 'openTab');

    const portfolioButton = queryByTestId(BTC_OVERVIEW_PORTFOLIO);
    expect(portfolioButton).toBeInTheDocument();
    fireEvent.click(portfolioButton as HTMLElement);

    expect(openTabSpy).toHaveBeenCalledTimes(1);
    expect(openTabSpy).toHaveBeenCalledWith({
      url: makePortfolioUrl('', {
        metamaskEntry: 'ext_portfolio_button',
        metametricsId: mockMetaMetricsId,
      }),
    });
  });
});
