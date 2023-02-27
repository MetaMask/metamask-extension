import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { renderWithProvider } from '../../../../test/jest/rendering';
import { HardwareKeyringTypes } from '../../../../shared/constants/hardware-wallets';
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

describe('TokenOverview', () => {
  const mockStore = {
    metamask: {
      provider: {
        type: 'test',
        chainId: CHAIN_IDS.MAINNET,
      },
      preferences: {
        useNativeCurrencyAsPrimaryCurrency: true,
      },
      identities: {
        '0x1': {
          address: '0x1',
        },
      },
      selectedAddress: '0x1',
      keyrings: [
        {
          type: HardwareKeyringTypes.hdKeyTree,
          accounts: ['0x1', '0x2'],
        },
        {
          type: HardwareKeyringTypes.ledger,
          accounts: [],
        },
      ],
      contractExchangeRates: {},
    },
  };

  const store = configureMockStore([thunk])(mockStore);

  afterEach(() => {
    store.clearActions();
  });

  describe('TokenOverview', () => {
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
      process.env.NFTS_V1 = true;
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
      process.env.NFTS_V1 = false;
    });

    it('should always show the Buy button regardless of chain Id', () => {
      const mockedStoreWithUnbuyableChainId = {
        metamask: {
          ...mockStore.metamask,
          provider: { type: 'test', chainId: CHAIN_IDS.PALM },
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

    it('should have Buy button disabled if chain id is not part of supported buyable chains', () => {
      const mockedStoreWithUnbuyableChainId = {
        metamask: {
          ...mockStore.metamask,
          provider: { type: 'test', chainId: CHAIN_IDS.FANTOM },
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

    it('should have Buy button enabled if chain id is part of supported buyable chains', () => {
      const mockedStoreWithBuyableChainId = {
        metamask: {
          ...mockStore.metamask,
          provider: { type: 'test', chainId: CHAIN_IDS.POLYGON },
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

    it('should have Buy button disabled for ERC721 tokens', () => {
      process.env.NFTS_V1 = true;
      const nftToken = {
        ...token,
        isERC721: true,
      };

      const mockedStoreWithBuyableChainId = {
        metamask: {
          ...mockStore.metamask,
          provider: { type: 'test', chainId: CHAIN_IDS.POLYGON },
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
  });
});
