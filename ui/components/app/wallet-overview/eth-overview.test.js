import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { fireEvent, waitFor } from '@testing-library/react';
import { EthAccountType, EthMethod } from '@metamask/keyring-api';
import {
  CHAIN_IDS,
  GOERLI_DISPLAY_NAME,
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
      networkConfigurations: {
        testNetworkConfigurationId: {
          rpcUrl: 'https://testrpc.com',
          chainId: '0x89',
          nickname: 'Custom Mainnet RPC',
          type: 'rpc',
          id: 'custom-mainnet',
        },
      },
      accountsByChainId: {
        [CHAIN_IDS.MAINNET]: {
          '0x1': { address: '0x1', balance: '0x1F4' },
        },
      },
      tokenList: [],
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
      internalAccounts: {
        accounts: {
          'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3': {
            address: '0x1',
            id: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
            metadata: {
              name: 'Account 1',
              keyring: {
                type: KeyringType.imported,
              },
            },
            options: {},
            methods: [...Object.values(EthMethod)],
            type: EthAccountType.Eoa,
          },
          'e9b992f9-e151-4317-b8b7-c771bb73dd02': {
            address: '0x2',
            id: 'e9b992f9-e151-4317-b8b7-c771bb73dd02',
            metadata: {
              name: 'Account 2',
              keyring: {
                type: KeyringType.imported,
              },
            },
            options: {},
            methods: [...Object.values(EthMethod)],
            type: EthAccountType.Eoa,
          },
        },
        selectedAccount: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
      },
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
  const ETH_OVERVIEW_SEND = 'eth-overview-send';
  const ETH_OVERVIEW_PRIMARY_CURRENCY = 'eth-overview__primary-currency';

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
      expect(primaryBalance).toHaveTextContent('$0.00USD');
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
      expect(primaryBalance).toHaveTextContent('$0.02USD');
      expect(queryByText('*')).toBeInTheDocument();
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
          networkConfigurations: {
            testNetworkConfigurationId: {
              rpcUrl: 'https://testrpc.com',
              chainId: '0x89',
              nickname: 'Custom Mainnet RPC',
              type: 'rpc',
              id: 'custom-mainnet',
            },
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
          networkConfigurations: {
            testNetworkConfigurationId: {
              rpcUrl: 'https://testrpc.com',
              chainId: '0x89',
              nickname: 'Custom Mainnet RPC',
              type: 'rpc',
              id: 'custom-mainnet',
            },
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
          providerConfig: {
            type: 'test',
            chainId: CHAIN_IDS.GOERLI,
            nickname: GOERLI_DISPLAY_NAME,
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
      expect(buyButton).toBeDisabled();
    });

    it('should have the Buy native token enabled if chain id is part of supported buyable chains', () => {
      const mockedStoreWithUnbuyableChainId = {
        metamask: {
          ...mockStore.metamask,
          providerConfig: {
            chainId: '0x89',
            type: 'rpc',
            id: 'custom-mainnet',
          },
          networkConfigurations: {
            testNetworkConfigurationId: {
              rpcUrl: 'https://testrpc.com',
              chainId: '0x89',
              nickname: 'Custom Mainnet RPC',
              type: 'rpc',
              id: 'custom-mainnet',
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

    it('should open the Buy native token URI when clicking on Buy button for a buyable chain ID', async () => {
      const mockedStoreWithBuyableChainId = {
        metamask: {
          ...mockStore.metamask,
          providerConfig: {
            chainId: '0x89',
            type: 'rpc',
            id: 'custom-mainnet',
          },
          networkConfigurations: {
            testNetworkConfigurationId: {
              rpcUrl: 'https://testrpc.com',
              chainId: '0x89',
              nickname: 'Custom Mainnet RPC',
              type: 'rpc',
              id: 'custom-mainnet',
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

  describe('Disabled buttons when an account cannot sign transactions', () => {
    const buttonTestCases = [
      { testId: ETH_OVERVIEW_BUY, buttonText: 'Buy & Sell' },
      { testId: ETH_OVERVIEW_SEND, buttonText: 'Send' },
      { testId: ETH_OVERVIEW_SWAP, buttonText: 'Swap' },
      { testId: ETH_OVERVIEW_BRIDGE, buttonText: 'Bridge' },
    ];

    it.each(buttonTestCases)(
      'should have the $buttonText button disabled when an account cannot sign transactions or user operations',
      ({ testId, buttonText }) => {
        mockStore.metamask.internalAccounts.accounts[
          'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3'
        ].methods = Object.values(EthMethod).filter(
          (method) =>
            method !== EthMethod.SignTransaction &&
            method !== EthMethod.SignUserOperation,
        );

        const mockedStore = configureMockStore([thunk])(mockStore);
        const { queryByTestId, queryByText } = renderWithProvider(
          <EthOverview />,
          mockedStore,
        );

        const button = queryByTestId(testId);
        expect(button).toBeInTheDocument();
        expect(button).toBeDisabled();
        expect(queryByText(buttonText).parentElement).toHaveAttribute(
          'data-original-title',
          'Not supported with this account.',
        );
      },
    );
  });
});
