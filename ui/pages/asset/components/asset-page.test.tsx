import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { fireEvent, waitFor } from '@testing-library/react';
import { EthAccountType } from '@metamask/keyring-api';
import nock from 'nock';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { renderWithProvider } from '../../../../test/jest/rendering';
import { KeyringType } from '../../../../shared/constants/keyring';
import { AssetType } from '../../../../shared/constants/transaction';
import { ETH_EOA_METHODS } from '../../../../shared/constants/eth-methods';
import { setBackgroundConnection } from '../../../store/background-connection';
import { mockNetworkState } from '../../../../test/stub/networks';
import useMultiPolling from '../../../hooks/useMultiPolling';
import AssetPage from './asset-page';

jest.mock('../../../store/actions', () => ({
  ...jest.requireActual('../../../store/actions'),
  tokenBalancesStartPolling: jest.fn().mockResolvedValue('pollingToken'),
  tokenBalancesStopPollingByPollingToken: jest.fn(),
}));

// Mock the price chart
jest.mock('react-chartjs-2', () => ({ Line: () => null }));

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

jest.mock('../../../hooks/useMultiPolling', () => ({
  __esModule: true,
  default: jest.fn(),
}));

const selectedAccountAddress = 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3';

describe('AssetPage', () => {
  const mockStore = {
    localeMessages: {
      currentLocale: 'en',
    },
    metamask: {
      tokenList: {},
      tokenBalances: {
        [selectedAccountAddress]: {
          [CHAIN_IDS.MAINNET]: {},
        },
      },
      marketData: {},
      allTokens: {},
      accountsByChainId: {
        '0x1': {
          [selectedAccountAddress]: {
            address: selectedAccountAddress,
            balance: '0x00',
          },
        },
      },
      currentCurrency: 'usd',
      accounts: {},
      ...mockNetworkState({ chainId: CHAIN_IDS.MAINNET }),
      currencyRates: {
        TEST: {
          conversionRate: 123,
          ticker: 'ETH',
        },
        ETH: {
          conversionRate: 123,
          ticker: 'ETH',
        },
      },
      useCurrencyRateCheck: true,
      preferences: {},
      internalAccounts: {
        accounts: {
          [selectedAccountAddress]: {
            address: selectedAccountAddress,
            id: selectedAccountAddress,
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
        selectedAccount: selectedAccountAddress,
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
      mmiConfiguration: {
        portfolio: {
          enabled: true,
        },
        url: 'https://metamask-institutional.io',
      },
    },
  };

  const store = configureMockStore([thunk])(mockStore);

  let openTabSpy: jest.SpyInstance;

  beforeAll(() => {
    jest.clearAllMocks();
    Object.defineProperty(global, 'platform', {
      value: {
        openTab: jest.fn(),
      },
    });
    openTabSpy = jest.spyOn(global.platform, 'openTab');
    setBackgroundConnection({
      getTokenSymbol: jest.fn(),
      setBridgeFeatureFlags: jest.fn(),
    } as never);
  });

  beforeEach(() => {
    openTabSpy.mockClear();

    // Mocking Date.now would not be sufficient, since it would render differently
    // depending on the machine's timezone. Mock the formatter instead.
    jest.spyOn(Intl, 'DateTimeFormat').mockImplementation(() => {
      return {
        format: () => 'Jun 9, 8:10 PM',
        resolvedOptions: jest.fn(),
        formatToParts: jest.fn(),
        formatRange: jest.fn(),
        formatRangeToParts: jest.fn(),
      };
    });
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

  afterEach(() => {
    store.clearActions();
    jest.restoreAllMocks();
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
      fiat: '',
    },
    decimals: 18,
  } as const;

  const token = {
    type: AssetType.token,
    chainId: '0x1',
    address: '0xF0906D83c5a0bD6b74bC9b62D7D9F2014c6525C0',
    symbol: 'TEST',
    decimals: 18,
    image: '',
    balance: {
      value: '0',
      display: '0',
      fiat: '',
    },
  } as const;

  it('should not show a modal when token passed in props is not an ERC721', () => {
    renderWithProvider(<AssetPage asset={token} optionsButton={null} />, store);
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
      tokenAddress: token.address,
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
    const { queryByTestId } = renderWithProvider(
      <AssetPage asset={token} optionsButton={null} />,
      configureMockStore([thunk])({
        ...mockStore,
        metamask: {
          ...mockStore.metamask,
          ...mockNetworkState({ chainId: CHAIN_IDS.SEPOLIA }),
        },
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
        ...mockNetworkState({ chainId: CHAIN_IDS.POLYGON }),
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

    fireEvent.click(buyButton as HTMLElement);
    expect(openTabSpy).toHaveBeenCalledTimes(1);

    await waitFor(() =>
      expect(openTabSpy).toHaveBeenCalledWith({
        url: expect.stringContaining(`/buy?metamaskEntry=ext_buy_sell_button`),
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

    fireEvent.click(bridgeButton as HTMLElement);
    expect(openTabSpy).toHaveBeenCalledTimes(1);

    await waitFor(() =>
      expect(openTabSpy).toHaveBeenCalledWith({
        url: `https://portfolio.test/bridge?metamaskEntry=ext_bridge_button&metametricsId=&metricsEnabled=false&marketingEnabled=false&token=${token.address}`,
      }),
    );
  });

  it('should not show the Bridge button if chain id is not supported', async () => {
    const { queryByTestId } = renderWithProvider(
      <AssetPage asset={token} optionsButton={null} />,
      configureMockStore([thunk])({
        ...mockStore,
        metamask: {
          ...mockStore.metamask,
          ...mockNetworkState({ chainId: CHAIN_IDS.SEPOLIA }),
        },
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

  it('should render a native asset', () => {
    const { container } = renderWithProvider(
      <AssetPage asset={native} optionsButton={null} />,
      store,
    );
    const dynamicImages = container.querySelectorAll('img[alt*="logo"]');
    dynamicImages.forEach((img) => {
      img.setAttribute('alt', 'static-logo');
    });
    expect(container).toMatchSnapshot();
  });

  it('should render an ERC20 asset without prices', async () => {
    const address = '0x309375769E79382beFDEc5bdab51063AeBDC4936';

    // Mock no price history
    nock('https://price.api.cx.metamask.io')
      .get(`/v1/chains/${CHAIN_IDS.MAINNET}/historical-prices/${address}`)
      .query(true)
      .reply(200, {});

    const { container, queryByTestId } = renderWithProvider(
      <AssetPage asset={{ ...token, address }} optionsButton={null} />,
      configureMockStore([thunk])({
        ...mockStore,
        metamask: {
          ...mockStore.metamask,
          marketData: {
            [CHAIN_IDS.MAINNET]: {
              [address]: {
                price: 123,
              },
            },
          },
        },
      }),
    );

    // Verify no chart is rendered
    await waitFor(() => {
      const chart = queryByTestId('asset-price-chart');
      expect(chart).toBeNull();
    });

    const dynamicImages = container.querySelectorAll('img[alt*="logo"]');
    dynamicImages.forEach((img) => {
      img.setAttribute('alt', 'static-logo');
    });
    const elementsWithAria = container.querySelectorAll('[aria-describedby]');
    elementsWithAria.forEach((el) =>
      el.setAttribute('aria-describedby', 'static-tooltip-id'),
    );

    expect(container).toMatchSnapshot();
  });

  it('should render an ERC20 token with prices', async () => {
    const address = '0xe4246B1Ac0Ba6839d9efA41a8A30AE3007185f55';
    const marketCap = 456;

    // Mock price history
    nock('https://price.api.cx.metamask.io')
      .get(`/v1/chains/${CHAIN_IDS.MAINNET}/historical-prices/${address}`)
      .query(true)
      .reply(200, { prices: [[1, 1]] });

    const { queryByTestId, container } = renderWithProvider(
      <AssetPage asset={{ ...token, address }} optionsButton={null} />,
      configureMockStore([thunk])({
        ...mockStore,
        metamask: {
          ...mockStore.metamask,
          marketData: {
            [CHAIN_IDS.MAINNET]: {
              [address]: {
                price: 123,
                marketCap,
                currency: 'ETH',
              },
            },
          },
        },
      }),
    );

    // Verify chart is rendered
    await waitFor(() => {
      const chart = queryByTestId('asset-price-chart');
      expect(chart).toHaveClass('mm-box--background-color-transparent');
    });

    // Verify market data is rendered
    const marketCapElement = queryByTestId('asset-market-cap');
    expect(marketCapElement).toHaveTextContent(
      `${marketCap * mockStore.metamask.currencyRates.ETH.conversionRate}`,
    );

    const dynamicImages = container.querySelectorAll('img[alt*="logo"]');
    dynamicImages.forEach((img) => {
      img.setAttribute('alt', 'static-logo');
    });
    const elementsWithAria = container.querySelectorAll('[aria-describedby]');
    elementsWithAria.forEach((el) =>
      el.setAttribute('aria-describedby', 'static-tooltip-id'),
    );
    expect(container).toMatchSnapshot();
  });
});
