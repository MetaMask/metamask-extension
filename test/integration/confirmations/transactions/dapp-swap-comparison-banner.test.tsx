/**
 * Integration tests for DappSwapComparisonBanner component.
 *
 * This test suite validates that the DappSwapComparisonBanner displays and functions
 * correctly when a dapp swap transaction is pending approval.
 *
 * The banner is displayed when:
 * - Transaction origin is from an allowlisted dapp or test origin (https://metamask.github.io)
 * - Transaction type is contractInteraction
 * - Feature flag dappSwapMetrics.enabled is true
 * - Feature flag dappSwapUi.enabled is true
 * - Valid swap comparison data (quotes) is available in state
 *
 * Component location: ui/pages/confirmations/components/confirm/dapp-swap-comparison-banner/dapp-swap-comparison-banner.tsx
 */

import { ApprovalType } from '@metamask/controller-utils';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import nock from 'nock';
import * as backgroundConnection from '../../../../ui/store/background-connection';
import { tEn } from '../../../lib/i18n-helpers';
import { integrationTestRender } from '../../../lib/render-helpers';
import mockMetaMaskState from '../../data/integration-init-state.json';
import { createMockImplementation, mock4byte } from '../../helpers';
import {
  getUnapprovedContractInteractionTransaction,
  getUnapprovedDappSwapTransaction,
} from './transactionDataHelpers';

jest.mock('../../../../ui/store/background-connection', () => ({
  ...jest.requireActual('../../../../ui/store/background-connection'),
  submitRequestToBackground: jest.fn(),
  callBackgroundMethod: jest.fn(),
}));

const mockedBackgroundConnection = jest.mocked(backgroundConnection);

const backgroundConnectionMocked = {
  onNotification: jest.fn(),
};

export const pendingTransactionId = 'dapp-swap-test-tx-id';
export const pendingTransactionTime = 1700000000000;
export const securityAlertId = 'dapp-swap-test-alert-id';
export const requestId = 'dapp-swap-request-id';

const getSelectedAccountAddress = () => {
  const account =
    mockMetaMaskState.internalAccounts.accounts[
      mockMetaMaskState.internalAccounts
        .selectedAccount as keyof typeof mockMetaMaskState.internalAccounts.accounts
    ];
  return account.address;
};

const createQuoteResponse = (overrides?: {
  srcTokenAmount?: string;
  destTokenAmount?: string;
  minDestTokenAmount?: string;
}) => ({
  quote: {
    requestId,
    bridgeId: 'kyberswap',
    srcChainId: 11155111,
    destChainId: 11155111,
    aggregator: 'kyberswap',
    aggregatorType: 'AGG',
    srcAsset: {
      address: '0x0000000000000000000000000000000000000000',
      chainId: 11155111,
      symbol: 'ETH',
      decimals: 18,
      name: 'Ether',
    },
    srcTokenAmount: overrides?.srcTokenAmount ?? '299250000000000',
    destAsset: {
      address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      chainId: 11155111,
      symbol: 'USDC',
      decimals: 6,
      name: 'USDC',
    },
    destTokenAmount: overrides?.destTokenAmount ?? '896724',
    minDestTokenAmount: overrides?.minDestTokenAmount ?? '878789',
    walletAddress: '0xed4f01ebD67Bc3642e58B1bf7Dd98E8eDB9339a8',
    destWalletAddress: '0xed4f01ebD67Bc3642e58B1bf7Dd98E8eDB9339a8',
    feeData: {
      metabridge: {
        amount: '750000000000',
        asset: {
          address: '0x0000000000000000000000000000000000000000',
          chainId: 11155111,
          symbol: 'ETH',
          decimals: 18,
        },
      },
    },
    slippage: 2,
    priceData: {
      totalFromAmountUsd: '0.886743',
      totalToAmountUsd: '0.896724',
    },
  },
  trade: {
    chainId: 11155111,
    to: '0x881D40237659C251811CEC9c364ef91dC08D300C',
    from: '0xed4f01ebD67Bc3642e58B1bf7Dd98E8eDB9339a8',
    value: '0x110d9316ec000',
    data: '0x5f575529',
    gasLimit: 380004,
    effectiveGas: 306661,
  },
  estimatedProcessingTimeInSeconds: 0,
});

const advancedDetailsMockedRequests = {
  getGasFeeTimeEstimate: {
    lowerTimeBound: new Date().getTime(),
    upperTimeBound: new Date().getTime(),
  },
  getNextNonce: '9',
};

const setupSubmitRequestToBackgroundMocks = (
  mockRequests?: Record<string, unknown>,
) => {
  mockedBackgroundConnection.submitRequestToBackground.mockImplementation(
    createMockImplementation({
      ...advancedDetailsMockedRequests,
      ...mockRequests,
    }),
  );
};

/**
 * Mocks currency conversion rate APIs for token USD value calculations
 */
const mockCurrencyRateApis = () => {
  // Mock currency rate API for ETH/USD conversion
  nock('https://price.api.cx.metamask.io')
    .persist()
    .get(/.*/u)
    .reply(200, {
      '0x0000000000000000000000000000000000000000': {
        id: 'ethereum',
        price: 2730.24,
        marketCap: 329678433494,
        allTimeHigh: 4946.05,
        allTimeLow: 0.432979,
        totalVolume: 23925948413,
        high1d: 2799.63,
        low1d: 2685.25,
        circulatingSupply: 120695669.494059,
        dilutedMarketCap: 329678433494,
        marketCapPercentChange1d: 1.36566,
        priceChange1d: 26.88,
        pricePercentChange1h: -0.5425352178933467,
        pricePercentChange1d: 0.9944574763044559,
        pricePercentChange7d: -14.030924354922892,
        pricePercentChange14d: -19.7377982116456,
        pricePercentChange30d: -28.901634472469368,
        pricePercentChange200d: 54.32598126235607,
        pricePercentChange1y: -17.108064795265342,
      },
      '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': {
        id: 'usd-coin',
        price: 0.999785,
        marketCap: 74007175357,
        allTimeHigh: 1.17,
        allTimeLow: 0.877647,
        totalVolume: 14301720919,
        high1d: 0.999898,
        low1d: 0.999555,
        circulatingSupply: 74029154549.94743,
        dilutedMarketCap: 74012455114,
        marketCapPercentChange1d: 0.4778,
        priceChange1d: 0.00007832,
        pricePercentChange1h: 0.0004963926674733863,
        pricePercentChange1d: 0.007833846013513994,
        pricePercentChange7d: 0.006671342904959285,
        pricePercentChange14d: 0.00409688905149591,
        pricePercentChange30d: -0.002580601833367036,
        pricePercentChange200d: -0.0180751208005741,
        pricePercentChange1y: 0.05852769489782135,
      },
    });
};

/**
 * Creates a MetaMask state with a pending dapp swap transaction.
 * This state includes the necessary feature flags and dapp swap comparison data
 * for the DappSwapComparisonBanner to display.
 *
 * @param options - Configuration options
 * @param options.accountAddress - The account address for the transaction
 * @param options.dappSwapMetricsEnabled - Whether dappSwapMetrics feature flag is enabled
 * @param options.dappSwapUiEnabled - Whether dappSwapUi feature flag is enabled
 * @param options.includeQuote - Whether to include a valid quote in dappSwapComparison state
 * @returns MetaMask state with Dapp swap transaction
 */
const getMetaMaskStateWithDappSwap = ({
  accountAddress,
  dappSwapMetricsEnabled = true,
  dappSwapUiEnabled = true,
  includeQuote = false,
}: {
  accountAddress: string;
  dappSwapMetricsEnabled?: boolean;
  dappSwapUiEnabled?: boolean;
  includeQuote?: boolean;
}) => {
  const quotes = includeQuote ? [createQuoteResponse()] : [];

  return {
    ...mockMetaMaskState,
    pendingApprovals: {
      [pendingTransactionId]: {
        id: pendingTransactionId,
        origin: 'https://metamask.github.io',
        time: pendingTransactionTime,
        type: ApprovalType.Transaction,
        requestData: {
          txId: pendingTransactionId,
        },
        requestState: null,
        expectsResult: false,
      },
    },
    pendingApprovalCount: 1,
    knownMethodData: {
      '0x3593564c': {
        name: 'Execute',
        params: [
          {
            type: 'bytes',
          },
          {
            type: 'bytes[]',
          },
          {
            name: 'deadline',
            type: 'uint256',
          },
        ],
      },
    },
    transactions: [
      getUnapprovedDappSwapTransaction(
        accountAddress,
        pendingTransactionId,
        pendingTransactionTime,
        requestId,
      ),
    ],
    currentCurrency: 'usd',
    remoteFeatureFlags: {
      dappSwapMetrics: {
        enabled: dappSwapMetricsEnabled,
        origins: ['https://metamask.github.io'],
      },
      dappSwapUi: {
        enabled: dappSwapUiEnabled,
        threshold: 0.01,
      },
      dappSwapQa: { enabled: true },
    },
    dappSwapComparisonData: {
      [requestId]: {
        quotes,
        latency: 1000,
        swapInfo: {
          srcTokenAddress: '0x0000000000000000000000000000000000000000',
          destTokenAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          srcTokenAmount: '0x110d9316ec000',
          destTokenAmountMin: '0xd68c5',
        },
      },
    },
  };
};

describe('DappSwapComparisonBanner', () => {
  beforeAll(() => {
    global.ethereumProvider = {
      request: jest.fn(),

      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;
  });

  beforeEach(() => {
    jest.resetAllMocks();
    setupSubmitRequestToBackgroundMocks();

    const EXECUTE_SWAP_HEX_SIG = '0x3593564c';
    const MINT_NFT_HEX_SIG = '0x3b4b1381';
    mock4byte(EXECUTE_SWAP_HEX_SIG);
    mock4byte(MINT_NFT_HEX_SIG);

    mockCurrencyRateApis();
  });

  afterEach(() => {
    nock.cleanAll();
  });

  afterAll(() => {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (global as any).ethereumProvider;
  });

  it('displays the DappSwapComparisonBanner when dapp swap transaction is pending', async () => {
    const mockedMetaMaskState = getMetaMaskStateWithDappSwap({
      accountAddress: getSelectedAccountAddress(),
      includeQuote: true,
    });

    await act(async () => {
      await integrationTestRender({
        preloadedState: mockedMetaMaskState,
        backgroundConnection: backgroundConnectionMocked,
      });
    });

    const marketRateTab = await screen.findByTestId('market-rate-tab');
    expect(marketRateTab).toBeInTheDocument();
    const metamaskSwapTab = await screen.findByTestId('metamask-swap-tab');
    expect(metamaskSwapTab).toBeInTheDocument();

    expect(screen.getByTestId('dapp-swap-banner')).toBeInTheDocument();
    expect(
      await screen.findByText(tEn('dappSwapAdvantageSaveOnly') as string),
    ).toBeInTheDocument();

    // Verify metrics: swap_mm_cta_displayed should be tracked via updateEventFragment
    await waitFor(() => {
      const metricsCall =
        mockedBackgroundConnection.submitRequestToBackground.mock.calls?.find(
          (call) =>
            call[0] === 'updateEventFragment' &&
            call[1]?.[1]?.properties?.swap_mm_cta_displayed === 'true',
        );

      expect(metricsCall).toBeDefined();
    });

    await act(async () => {
      fireEvent.click(metamaskSwapTab);
    });

    await waitFor(() => {
      const metricsCallSwapOpened =
        mockedBackgroundConnection.submitRequestToBackground.mock.calls?.find(
          (call) =>
            call[0] === 'updateEventFragment' &&
            call[1]?.[1]?.properties?.swap_mm_opened === 'true',
        );
      expect(metricsCallSwapOpened).toBeDefined();
    });
  });

  it('does not display the banner when dappSwapMetrics feature flag is disabled', async () => {
    const mockedMetaMaskState = getMetaMaskStateWithDappSwap({
      accountAddress: getSelectedAccountAddress(),
      dappSwapMetricsEnabled: false,
      includeQuote: true,
    });

    await act(async () => {
      await integrationTestRender({
        preloadedState: mockedMetaMaskState,
        backgroundConnection: backgroundConnectionMocked,
      });
    });

    // Verify that tabs are not rendered
    expect(screen.queryByTestId('market-rate-tab')).not.toBeInTheDocument();
    expect(screen.queryByTestId('metamask-swap-tab')).not.toBeInTheDocument();

    expect(screen.queryByTestId('dapp-swap-banner')).not.toBeInTheDocument();
  });

  it('hides the banner when close button is clicked', async () => {
    const mockedMetaMaskState = getMetaMaskStateWithDappSwap({
      accountAddress: getSelectedAccountAddress(),
      includeQuote: true,
    });

    await act(async () => {
      await integrationTestRender({
        preloadedState: mockedMetaMaskState,
        backgroundConnection: backgroundConnectionMocked,
      });
    });

    // Wait for banner to appear
    const banner = await screen.findByRole('button', {
      name: /close-dapp-swap-comparison-banner/iu,
    });
    expect(banner).toBeInTheDocument();

    expect(screen.getByTestId('dapp-swap-banner')).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(banner);
    });

    await waitFor(() => {
      expect(screen.queryByTestId('dapp-swap-banner')).not.toBeInTheDocument();
    });

    // Verify tabs are still visible
    expect(screen.getByTestId('market-rate-tab')).toBeInTheDocument();
    expect(screen.getByTestId('metamask-swap-tab')).toBeInTheDocument();
  });

  it('switches between Market Rate and MetaMask Swap tabs', async () => {
    const mockedMetaMaskState = getMetaMaskStateWithDappSwap({
      accountAddress: getSelectedAccountAddress(),
      includeQuote: true,
    });

    await act(async () => {
      await integrationTestRender({
        preloadedState: mockedMetaMaskState,
        backgroundConnection: backgroundConnectionMocked,
      });
    });

    // Verify Market Rate tab is active by default
    const marketRateTab = await screen.findByTestId('market-rate-tab');
    const metamaskSwapTab = await screen.findByTestId('metamask-swap-tab');

    expect(marketRateTab).toBeInTheDocument();
    expect(metamaskSwapTab).toBeInTheDocument();

    expect(screen.getByTestId('dapp-swap-banner')).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(metamaskSwapTab);
    });

    await waitFor(() => {
      const metricsCall =
        mockedBackgroundConnection.submitRequestToBackground.mock.calls?.find(
          (call) =>
            call[0] === 'updateEventFragment' &&
            call[1]?.[1]?.properties?.swap_mm_opened === 'true',
        );

      expect(metricsCall).toBeDefined();
    });

    await act(async () => {
      fireEvent.click(marketRateTab);
    });

    expect(screen.getByTestId('market-rate-tab')).toBeInTheDocument();
    expect(screen.getByTestId('metamask-swap-tab')).toBeInTheDocument();
  });

  it('does not display for contract interactions from other origins', async () => {
    // Use a regular contract interaction from a non-allowlisted origin
    const nonSwapTransaction = getUnapprovedContractInteractionTransaction(
      getSelectedAccountAddress(),
      pendingTransactionId,
      pendingTransactionTime,
    );

    const mockedMetaMaskState = {
      ...mockMetaMaskState,
      pendingApprovals: {
        [pendingTransactionId]: {
          id: pendingTransactionId,
          origin: 'https://example.com',
          time: pendingTransactionTime,
          type: ApprovalType.Transaction,
          requestData: {
            txId: pendingTransactionId,
          },
          requestState: null,
          expectsResult: false,
        },
      },
      pendingApprovalCount: 1,
      transactions: [nonSwapTransaction],
      remoteFeatureFlags: {
        dappSwapMetrics: {
          enabled: true,
          origins: ['https://metamask.github.io'],
        },
        dappSwapUi: { enabled: true, threshold: 0.01 },
        dappSwapQa: { enabled: false },
      },
    };

    await act(async () => {
      await integrationTestRender({
        preloadedState: mockedMetaMaskState,
        backgroundConnection: backgroundConnectionMocked,
      });
    });

    // Verify that tabs are not rendered (banner component not shown)
    expect(screen.queryByTestId('market-rate-tab')).not.toBeInTheDocument();
    expect(screen.queryByTestId('metamask-swap-tab')).not.toBeInTheDocument();

    expect(screen.queryByTestId('dapp-swap-banner')).not.toBeInTheDocument();

    // Verify standard confirmation UI is displayed instead
    expect(
      await screen.findByText(tEn('confirmTitleTransaction') as string),
    ).toBeInTheDocument();
  });

  it('does not display the banner when dappSwapUi feature flag is disabled', async () => {
    const mockedMetaMaskState = getMetaMaskStateWithDappSwap({
      accountAddress: getSelectedAccountAddress(),
      dappSwapUiEnabled: false,
      includeQuote: true,
    });

    await act(async () => {
      await integrationTestRender({
        preloadedState: mockedMetaMaskState,
        backgroundConnection: backgroundConnectionMocked,
      });
    });

    // Verify that tabs are not rendered
    expect(screen.queryByTestId('market-rate-tab')).not.toBeInTheDocument();
    expect(screen.queryByTestId('metamask-swap-tab')).not.toBeInTheDocument();

    expect(screen.queryByTestId('dapp-swap-banner')).not.toBeInTheDocument();
  });

  it('does not display the banner when no quotes are available', async () => {
    const mockedMetaMaskState = getMetaMaskStateWithDappSwap({
      accountAddress: getSelectedAccountAddress(),
      includeQuote: false,
    });

    await act(async () => {
      await integrationTestRender({
        preloadedState: mockedMetaMaskState,
        backgroundConnection: backgroundConnectionMocked,
      });
    });

    // Verify that tabs are not rendered when no quotes available
    expect(screen.queryByTestId('market-rate-tab')).not.toBeInTheDocument();
    expect(screen.queryByTestId('metamask-swap-tab')).not.toBeInTheDocument();

    expect(screen.queryByTestId('dapp-swap-banner')).not.toBeInTheDocument();
  });
});
