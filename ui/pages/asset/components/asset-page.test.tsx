import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { fireEvent, waitFor } from '@testing-library/react';
import { EthAccountType } from '@metamask/keyring-api';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { renderWithProvider } from '../../../../test/jest/rendering';
import { KeyringType } from '../../../../shared/constants/keyring';
import { AssetType } from '../../../../shared/constants/transaction';
import { ETH_EOA_METHODS } from '../../../../shared/constants/eth-methods';
import AssetPage from './asset-page';

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

describe('AssetPage', () => {
  const mockStore = {
    localeMessages: {
      currentLocale: 'en',
    },
    metamask: {
      tokenList: {},
      currentCurrency: 'usd',
      accounts: {},
      networkConfigurations: {
        test: {
          id: 'test',
          chainId: CHAIN_IDS.MAINNET,
        },
      },
      providerConfig: {
        id: '1',
        type: 'test',
        chainId: CHAIN_IDS.MAINNET,
      },
      currencyRates: {},
      preferences: {
        useNativeCurrencyAsPrimaryCurrency: true,
      },
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
            methods: ETH_EOA_METHODS,
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

    const native = {
      type: AssetType.native,
      chainId: '0x1',
      symbol: 'TEST',
      image: '',
      isOriginalNativeSymbol: true,
      balance: {
        value: '0',
        display: '0',
      },
    } as const;

    const token = {
      type: AssetType.token,
      chainId: '0x1',
      address: '0x123',
      symbol: 'TEST',
      decimals: 18,
      image: '',
      balance: {
        value: '0',
        display: '0',
      },
    } as const;

    it('should render a native asset', () => {
      const { container } = renderWithProvider(
        <AssetPage asset={native} optionsButton={null} />,
        store,
      );
      expect(container).toMatchSnapshot();
    });

    it('should render a token asset', () => {
      const { container } = renderWithProvider(
        <AssetPage asset={token} optionsButton={null} />,
        store,
      );
      expect(container).toMatchSnapshot();
    });

    it('should not show a modal when token passed in props is not an ERC721', () => {
      renderWithProvider(
        <AssetPage asset={token} optionsButton={null} />,
        store,
      );
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
        tokenAddress: '0x123',
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
      const chainId = CHAIN_IDS.SEPOLIA;
      const { queryByTestId } = renderWithProvider(
        <AssetPage asset={token} optionsButton={null} />,
        configureMockStore([thunk])({
          ...mockStore,
          metamask: { ...mockStore.metamask, providerConfig: { chainId } },
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
          providerConfig: { type: 'test', chainId: CHAIN_IDS.POLYGON },
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
      const { queryByTestId } = renderWithProvider(
        <AssetPage asset={token} optionsButton={null} />,
        store,
      );
      const bridgeButton = queryByTestId('token-overview-bridge');
      expect(bridgeButton).toBeInTheDocument();
      expect(bridgeButton).not.toBeDisabled();

      fireEvent.click(bridgeButton);
      expect(openTabSpy).toHaveBeenCalledTimes(1);

      await waitFor(() =>
        expect(openTabSpy).toHaveBeenCalledWith({
          url: expect.stringContaining(
            '/bridge?metamaskEntry=ext_bridge_button&metametricsId=&token=0x123',
          ),
        }),
      );
    });

    it('should not show the Bridge button if chain id is not supported', async () => {
      const chainId = CHAIN_IDS.SEPOLIA;
      const { queryByTestId } = renderWithProvider(
        <AssetPage asset={token} optionsButton={null} />,
        configureMockStore([thunk])({
          ...mockStore,
          metamask: { ...mockStore.metamask, providerConfig: { chainId } },
        }),
      );
      const bridgeButton = queryByTestId('token-overview-bridge');
      expect(bridgeButton).not.toBeInTheDocument();
    });

    it('should show the MMI Portfolio and Stake buttons', () => {
      const { queryByTestId } = renderWithProvider(
        <AssetPage asset={token} optionsButton={null} />,
        store,
      );
      const mmiStakeButton = queryByTestId('token-overview-mmi-stake');
      const mmiPortfolioButton = queryByTestId('token-overview-mmi-portfolio');

      expect(mmiStakeButton).toBeInTheDocument();
      expect(mmiPortfolioButton).toBeInTheDocument();
    });

    // TODO more unit tests, click buttons, chart, verify market data on page, etc
  });
});
