import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { fireEvent, waitFor } from '@testing-library/react';
import {
  CHAIN_IDS,
  MAINNET_DISPLAY_NAME,
  NETWORK_TYPES,
} from '../../../../shared/constants/network';
import { renderWithProvider } from '../../../../test/jest/rendering';
import { KeyringType } from '../../../../shared/constants/keyring';
import { useIsOriginalNativeTokenSymbol } from '../../../hooks/useIsOriginalNativeTokenSymbol';
import EthOverview from './eth-overview';

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

jest.mock('../../../hooks/useIsOriginalNativeTokenSymbol', () => {
  return {
    useIsOriginalNativeTokenSymbol: jest.fn(),
  };
});

let openTabSpy;

describe('EthOverview', () => {
  useIsOriginalNativeTokenSymbol.mockReturnValue(true);

  const mockStore = {
    metamask: {
      providerConfig: {
        chainId: CHAIN_IDS.MAINNET,
        nickname: MAINNET_DISPLAY_NAME,
        type: NETWORK_TYPES.MAINNET,
        ticker: 'ETH',
      },
      cachedBalances: {
        '0x1': {
          '0x1': '0x1F4',
        },
      },
      preferences: {
        useNativeCurrencyAsPrimaryCurrency: true,
      },
      useCurrencyRateCheck: true,
      currentCurrency: 'usd',
      currencyRates: {
        ETH: {
          conversionRate: 2,
        },
      },
      identities: {
        '0x1': {
          address: '0x1',
        },
      },
      accounts: {
        '0x1': {
          address: '0x1',
          balance: '0x1F4',
        },
      },
      selectedAddress: '0x1',
      keyrings: [
        {
          type: KeyringType.imported,
          accounts: ['0x1', '0x2'],
        },
        {
          type: KeyringType.ledger,
          accounts: [],
        },
      ],
      contractExchangeRates: {},
    },
  };

  const store = configureMockStore([thunk])(mockStore);
  const ETH_OVERVIEW_BUY = 'eth-overview-buy';
  const ETH_OVERVIEW_BRIDGE = 'eth-overview-bridge';
  const ETH_OVERVIEW_PORTFOLIO = 'eth-overview-portfolio';
  const ETH_OVERVIEW_SWAP = 'token-overview-button-swap';
  const ETH_OVERVIEW_PRIMARY_CURRENCY = 'eth-overview__primary-currency';
  const ETH_OVERVIEW_SECONDARY_CURRENCY = 'eth-overview__secondary-currency';

  afterEach(() => {
    store.clearActions();
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
    });

    it('should show the primary balance', async () => {
      const { queryByTestId, queryByText } = renderWithProvider(
        <EthOverview />,
        store,
      );

      const primaryBalance = queryByTestId(ETH_OVERVIEW_PRIMARY_CURRENCY);
      expect(primaryBalance).toBeInTheDocument();
      expect(primaryBalance).toHaveTextContent('0ETH');
      expect(queryByText('*')).not.toBeInTheDocument();
    });

    it('should show the cached primary balance', async () => {
      const mockedStoreWithCachedBalance = {
        metamask: {
          ...mockStore.metamask,
          accounts: {
            '0x1': {
              address: '0x1',
            },
          },
          cachedBalances: {
            '0x1': {
              '0x1': '0x24da51d247e8b8',
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
      expect(primaryBalance).toHaveTextContent('0.0104ETH');
      expect(queryByText('*')).toBeInTheDocument();
    });

    it('should show the secondary balance', async () => {
      const { queryByTestId } = renderWithProvider(<EthOverview />, store);

      const secondaryBalance = queryByTestId(ETH_OVERVIEW_SECONDARY_CURRENCY);
      expect(secondaryBalance).toBeInTheDocument();
      expect(secondaryBalance).toHaveTextContent('0');
    });

    it('should have the Bridge button enabled if chain id is part of supported chains', () => {
      const mockedAvalancheStore = {
        ...mockStore,
        metamask: {
          ...mockStore.metamask,
          providerConfig: {
            ...mockStore.metamask.providerConfig,
            chainId: '0xa86a',
          },
        },
      };
      const mockedStore = configureMockStore([thunk])(mockedAvalancheStore);

      const { queryByTestId, queryByText } = renderWithProvider(
        <EthOverview />,
        mockedStore,
      );
      const bridgeButton = queryByTestId(ETH_OVERVIEW_BRIDGE);
      expect(bridgeButton).toBeInTheDocument();
      expect(bridgeButton).toBeEnabled();
      expect(queryByText('Bridge').parentElement).not.toHaveAttribute(
        'data-original-title',
        'Unavailable on this network',
      );
    });

    it('should open the Bridge URI when clicking on Bridge button on supported network', async () => {
      const { queryByTestId } = renderWithProvider(<EthOverview />, store);

      const bridgeButton = queryByTestId(ETH_OVERVIEW_BRIDGE);

      expect(bridgeButton).toBeInTheDocument();
      expect(bridgeButton).not.toBeDisabled();

      fireEvent.click(bridgeButton);
      expect(openTabSpy).toHaveBeenCalledTimes(1);

      await waitFor(() =>
        expect(openTabSpy).toHaveBeenCalledWith({
          url: expect.stringContaining(
            '/bridge?metamaskEntry=ext_bridge_button',
          ),
        }),
      );
    });

    it('should open the MMI PD Swaps URI when clicking on Swap button with a Custody account', async () => {
      const mockedStoreWithCustodyKeyring = {
        metamask: {
          ...mockStore.metamask,
          mmiConfiguration: {
            portfolio: {
              enabled: true,
              url: 'https://metamask-institutional.io',
            },
          },
          keyrings: [
            {
              type: 'Custody',
              accounts: ['0x1'],
            },
          ],
        },
      };

      const mockedStore = configureMockStore([thunk])(
        mockedStoreWithCustodyKeyring,
      );

      const { queryByTestId } = renderWithProvider(
        <EthOverview />,
        mockedStore,
      );

      const swapButton = queryByTestId(ETH_OVERVIEW_SWAP);

      expect(swapButton).toBeInTheDocument();
      expect(swapButton).not.toBeDisabled();

      fireEvent.click(swapButton);
      expect(openTabSpy).toHaveBeenCalledTimes(1);

      await waitFor(() =>
        expect(openTabSpy).toHaveBeenCalledWith({
          url: 'https://metamask-institutional.io/swap',
        }),
      );
    });

    it('should have the Bridge button disabled if chain id is not part of supported chains', () => {
      const mockedFantomStore = {
        ...mockStore,
        metamask: {
          ...mockStore.metamask,
          providerConfig: {
            ...mockStore.metamask.providerConfig,
            chainId: '0xfa',
          },
        },
      };
      const mockedStore = configureMockStore([thunk])(mockedFantomStore);

      const { queryByTestId, queryByText } = renderWithProvider(
        <EthOverview />,
        mockedStore,
      );
      const bridgeButton = queryByTestId(ETH_OVERVIEW_BRIDGE);
      expect(bridgeButton).toBeInTheDocument();
      expect(bridgeButton).toBeDisabled();
      expect(queryByText('Bridge').parentElement).toHaveAttribute(
        'data-original-title',
        'Unavailable on this network',
      );
    });

    it('should always show the Portfolio button', () => {
      const { queryByTestId } = renderWithProvider(<EthOverview />, store);
      const portfolioButton = queryByTestId(ETH_OVERVIEW_PORTFOLIO);
      expect(portfolioButton).toBeInTheDocument();
    });

    it('should open the Portfolio URI when clicking on Portfolio button', async () => {
      const { queryByTestId } = renderWithProvider(<EthOverview />, store);

      const portfolioButton = queryByTestId(ETH_OVERVIEW_PORTFOLIO);

      expect(portfolioButton).toBeInTheDocument();
      expect(portfolioButton).not.toBeDisabled();

      fireEvent.click(portfolioButton);
      expect(openTabSpy).toHaveBeenCalledTimes(1);

      await waitFor(() =>
        expect(openTabSpy).toHaveBeenCalledWith({
          url: expect.stringContaining(`?metamaskEntry=ext`),
        }),
      );
    });

    it('should always show the Buy button regardless of current chain Id', () => {
      const { queryByTestId } = renderWithProvider(<EthOverview />, store);
      const buyButton = queryByTestId(ETH_OVERVIEW_BUY);
      expect(buyButton).toBeInTheDocument();
    });

    it('should have the Buy native token button disabled if chain id is not part of supported buyable chains', () => {
      const mockedStoreWithUnbuyableChainId = {
        metamask: {
          ...mockStore.metamask,
          providerConfig: { type: 'test', chainId: CHAIN_IDS.FANTOM },
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
      expect(buyButton).toBeDisabled();
    });

    it('should have the Buy native token enabled if chain id is part of supported buyable chains', () => {
      const mockedStoreWithUnbuyableChainId = {
        metamask: {
          ...mockStore.metamask,
          providerConfig: { type: 'test', chainId: CHAIN_IDS.POLYGON },
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

    it('should open the Buy native token URI when clicking on Buy button for a buyable chain ID', async () => {
      const mockedStoreWithBuyableChainId = {
        metamask: {
          ...mockStore.metamask,
          providerConfig: { type: 'test', chainId: CHAIN_IDS.POLYGON },
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
      expect(openTabSpy).toHaveBeenCalledTimes(1);

      await waitFor(() =>
        expect(openTabSpy).toHaveBeenCalledWith({
          url: expect.stringContaining(
            `/buy?metamaskEntry=ext_buy_sell_button`,
          ),
        }),
      );
    });
  });
});
