import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { fireEvent, waitFor } from '@testing-library/react';
import { EthAccountType, EthMethod } from '@metamask/keyring-api';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { renderWithProvider } from '../../../../test/jest/rendering';
import { KeyringType } from '../../../../shared/constants/keyring';
import TokenOverview from './token-overview';

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
let openTabSpy;

describe('TokenOverview', () => {
  const mockStore = {
    metamask: {
      providerConfig: {
        type: 'test',
        chainId: CHAIN_IDS.MAINNET,
      },
      currencyRates: {},
      preferences: {
        useNativeCurrencyAsPrimaryCurrency: true,
      },
      identities: {
        '0x1': {
          address: '0x1',
        },
      },
      selectedAddress: '0x1',
      internalAccounts: {
        accounts: {
          'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3': {
            address: '0x1',
            id: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
            metadata: {
              name: 'Test Account',
              keyring: {
                type: 'HD Key Tree',
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
          type: KeyringType.hdKeyTree,
          accounts: ['0x1', '0x2'],
        },
        {
          type: KeyringType.ledger,
          accounts: [],
        },
      ],
      contractExchangeRates: {},
      mmiConfiguration: {
        portfolio: {
          enabled: true,
        },
        url: 'https://metamask-institutional.io',
      },
    },
  };

  const store = configureMockStore([thunk])(mockStore);

  afterEach(() => {
    store.clearActions();
  });

  describe('TokenOverview', () => {
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

    const token = {
      name: 'test',
      isERC721: false,
      address: '0x01',
      symbol: 'test',
    };

    it('should not show a modal when token passed in props is not an ERC721', () => {
      renderWithProvider(<TokenOverview token={token} />, store);

      const actions = store.getActions();
      expect(actions).toHaveLength(0);
    });

    it('should show ConvertTokenToNFT modal when token passed in props is an ERC721', () => {
      const nftToken = {
        ...token,
        isERC721: true,
      };
      renderWithProvider(<TokenOverview token={nftToken} />, store);

      const actions = store.getActions();
      expect(actions).toHaveLength(1);
      expect(actions[0].type).toBe('UI_MODAL_OPEN');
      expect(actions[0].payload).toStrictEqual({
        name: 'CONVERT_TOKEN_TO_NFT',
        tokenAddress: '0x01',
      });
    });

    it('should always show the Buy button regardless of chain Id', () => {
      const mockedStoreWithUnbuyableChainId = {
        metamask: {
          ...mockStore.metamask,
          providerConfig: { type: 'test', chainId: CHAIN_IDS.PALM },
        },
      };
      const mockedStore = configureMockStore([thunk])(
        mockedStoreWithUnbuyableChainId,
      );

      const { queryByTestId } = renderWithProvider(
        <TokenOverview token={token} />,
        mockedStore,
      );
      const buyButton = queryByTestId('token-overview-buy');
      expect(buyButton).toBeInTheDocument();
    });

    it('should always show the Buy button regardless of token type', () => {
      const nftToken = {
        ...token,
        isERC721: true,
      };

      const { queryByTestId } = renderWithProvider(
        <TokenOverview token={nftToken} />,
        store,
      );
      const buyButton = queryByTestId('token-overview-buy');
      expect(buyButton).toBeInTheDocument();
    });

    it('should have the Buy token button disabled if chain id is not part of supported buyable chains', () => {
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
        <TokenOverview token={token} />,
        mockedStore,
      );
      const buyButton = queryByTestId('token-overview-buy');
      expect(buyButton).toBeInTheDocument();
      expect(buyButton).toBeDisabled();
    });

    it('should have the Buy token button enabled if chain id is part of supported buyable chains', () => {
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
        <TokenOverview token={token} />,
        mockedStore,
      );
      const buyButton = queryByTestId('token-overview-buy');
      expect(buyButton).toBeInTheDocument();
      expect(buyButton).not.toBeDisabled();
    });

    it('should have the Buy token button disabled for ERC721 tokens', () => {
      const nftToken = {
        ...token,
        isERC721: true,
      };

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
        <TokenOverview token={nftToken} />,
        mockedStore,
      );
      const buyButton = queryByTestId('token-overview-buy');
      expect(buyButton).toBeInTheDocument();
      expect(buyButton).toBeDisabled();
    });

    it('should open the buy crypto URL for a buyable chain ID', async () => {
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
        <TokenOverview token={token} />,
        mockedStore,
      );
      const buyButton = queryByTestId('token-overview-buy');
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

    it('should show the Bridge button if chain id is supported', async () => {
      const mockToken = {
        name: 'test',
        isERC721: false,
        address: '0x7ceb23fd6bc0add59e62ac25578270cff1B9f619',
        symbol: 'test',
      };

      const mockedStoreWithBridgeableChainId = {
        metamask: {
          ...mockStore.metamask,
          providerConfig: { type: 'test', chainId: CHAIN_IDS.POLYGON },
        },
      };
      const mockedStore = configureMockStore([thunk])(
        mockedStoreWithBridgeableChainId,
      );

      const { queryByTestId } = renderWithProvider(
        <TokenOverview token={mockToken} />,
        mockedStore,
      );
      const bridgeButton = queryByTestId('token-overview-bridge');
      expect(bridgeButton).toBeInTheDocument();
      expect(bridgeButton).not.toBeDisabled();

      fireEvent.click(bridgeButton);
      expect(openTabSpy).toHaveBeenCalledTimes(1);

      await waitFor(() =>
        expect(openTabSpy).toHaveBeenCalledWith({
          url: expect.stringContaining(
            '/bridge?metamaskEntry=ext_bridge_button&metametricsId=&token=0x7ceb23fd6bc0add59e62ac25578270cff1B9f619',
          ),
        }),
      );
    });

    it('should not show the Bridge button if chain id is not supported', async () => {
      const mockToken = {
        name: 'test',
        isERC721: false,
        address: '0x7ceb23fd6bc0add59e62ac25578270cff1B9f619',
        symbol: 'test',
      };

      const mockedStoreWithBridgeableChainId = {
        metamask: {
          ...mockStore.metamask,
          providerConfig: { type: 'test', chainId: CHAIN_IDS.FANTOM },
        },
      };
      const mockedStore = configureMockStore([thunk])(
        mockedStoreWithBridgeableChainId,
      );

      const { queryByTestId } = renderWithProvider(
        <TokenOverview token={mockToken} />,
        mockedStore,
      );
      const bridgeButton = queryByTestId('token-overview-bridge');
      expect(bridgeButton).not.toBeInTheDocument();
    });

    it('should show the MMI Portfolio and Stake buttons', () => {
      const { queryByTestId } = renderWithProvider(
        <TokenOverview token={token} />,
        store,
      );
      const mmiStakeButton = queryByTestId('token-overview-mmi-stake');
      const mmiPortfolioButton = queryByTestId('token-overview-mmi-portfolio');

      expect(mmiStakeButton).toBeInTheDocument();
      expect(mmiPortfolioButton).toBeInTheDocument();
    });
  });
});
