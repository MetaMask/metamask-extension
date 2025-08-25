import { act, fireEvent, screen } from '@testing-library/react';
import * as backgroundConnection from '../../../ui/store/background-connection';
import mockMetaMaskState from '../data/integration-init-state.json';
import { integrationTestRender } from '../../lib/render-helpers';
import { createMockImplementation } from '../helpers';
import {
  mockSwapsToken,
  mockSwapsAggregatorMetadata,
  mockSwapsGasPrices,
  mockSwapsTokens,
  mockSwapsTopAssets,
  mockSwapsTrades,
  mockSwapsNetworks,
  mockSwapsFeatureFlags,
} from './swaps-mocks';
import {
  FEATURE_FLAGS_API_MOCK_RESULT,
  TOKENS_API_MOCK_RESULT,
} from './mock-data';

jest.mock('../../../ui/store/background-connection', () => ({
  ...jest.requireActual('../../../ui/store/background-connection'),
  submitRequestToBackground: jest.fn(),
  callBackgroundMethod: jest.fn(),
}));

const mockedBackgroundConnection = jest.mocked(backgroundConnection);

const backgroundConnectionMocked = {
  onNotification: jest.fn(),
};

const mockedBackgroundRequests = {
  setSwapsTokens: TOKENS_API_MOCK_RESULT,
  setSwapsFeatureFlags: FEATURE_FLAGS_API_MOCK_RESULT,
  fetchSmartTransactionsLiveness: true,
  getTransactions: [],
};

const setupSubmitRequestToBackgroundMocks = (
  mockRequests?: Record<string, unknown>,
) => {
  mockedBackgroundConnection.submitRequestToBackground.mockImplementation(
    createMockImplementation({
      ...mockedBackgroundRequests,
      ...(mockRequests ?? {}),
    }),
  );
};

const mockStateWithTokens = {
  ...mockMetaMaskState,
  useExternalServices: true,
  selectedNetworkClientId: 'testNetworkConfigurationId',
  swapsState: {
    ...mockMetaMaskState.swapsState,
    tokens: [
      {
        name: 'Ethereum',
        symbol: 'ETH',
        decimals: 18,
        type: 'native',
        iconUrl:
          'https://token.api.cx.metamask.io/assets/nativeCurrencyLogos/ethereum.svg',
        coingeckoId: 'ethereum',
        address: '0x0000000000000000000000000000000000000000',
        occurrences: 100,
        aggregators: [],
      },
      {
        address: '0x6b175474e89094c44da98b954eedeac495271d0f',
        symbol: 'DAI',
        decimals: 18,
        name: 'Dai Stablecoin',
        iconUrl: 'https://crypto.com/price/coin-data/icon/DAI/color_icon.png',
        type: 'erc20',
        aggregators: [
          'aave',
          'bancor',
          'cmc',
          'cryptocom',
          'coinGecko',
          'oneInch',
          'pmm',
          'zerion',
          'lifi',
        ],
        occurrences: 9,
        fees: {
          '0xb0da5965d43369968574d399dbe6374683773a65': 0,
        },
        storage: {
          balance: 2,
        },
        blocked: false,
      },
      {
        address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        symbol: 'USDC',
        decimals: 6,
        name: 'USD Coin',
        iconUrl: 'https://crypto.com/price/coin-data/icon/USDC/color_icon.png',
        type: 'erc20',
        aggregators: [
          'aave',
          'bancor',
          'cryptocom',
          'coinGecko',
          'oneInch',
          'pmm',
          'zerion',
          'lifi',
        ],
        occurrences: 8,
        fees: {},
        storage: {
          balance: 9,
        },
        blocked: false,
      },
      {
        address: '0xc6bdb96e29c38dc43f014eed44de4106a6a8eb5f',
        symbol: 'INUINU',
        decimals: 18,
        name: 'Inu Inu',
        iconUrl:
          'https://assets.coingecko.com/coins/images/26391/thumb/logo_square_200.png?1657752596',
        type: 'erc20',
        aggregators: ['coinGecko'],
        occurrences: 1,
        blocked: false,
      },
    ],
  },
};

describe.skip('Swaps Alert', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    setupSubmitRequestToBackgroundMocks();
    mockSwapsTokens();
    setupSubmitRequestToBackgroundMocks();
    mockSwapsFeatureFlags();
    mockSwapsAggregatorMetadata();
    mockSwapsTopAssets();
    mockSwapsToken();
    mockSwapsGasPrices();
    mockSwapsTrades();
    mockSwapsNetworks();
  });

  it('displays the potentially inauthentic token alert', async () => {
    const account =
      mockMetaMaskState.internalAccounts.accounts[
        mockMetaMaskState.internalAccounts
          .selectedAccount as keyof typeof mockMetaMaskState.internalAccounts.accounts
      ];

    const accountName = account.metadata.name;

    await act(async () => {
      await integrationTestRender({
        preloadedState: mockStateWithTokens,
        backgroundConnection: backgroundConnectionMocked,
      });
    });
    await screen.findByText(accountName);

    await act(async () => {
      fireEvent.click(await screen.findByTestId('token-overview-button-swap'));
    });

    await act(async () => {
      fireEvent.change(
        await screen.findByTestId('prepare-swap-page-from-token-amount'),
        { target: { value: '2' } },
      );
    });

    await act(async () => {
      fireEvent.click(await screen.findByTestId('prepare-swap-page-swap-to'));
    });

    await act(async () => {
      fireEvent.click(await screen.findByText('INUINU'));
    });

    const alert = await screen.findByTestId('swaps-banner-title');
    expect(alert).toBeInTheDocument();

    expect(
      await screen.findByText('Potentially inauthentic token'),
    ).toBeInTheDocument();
  });
});
