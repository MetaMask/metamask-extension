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
export const pendingTransactionTime = new Date().getTime();
export const securityAlertId = 'dapp-swap-test-alert-id';
export const requestId = 'dapp-swap-request-id';

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
  const quotes = includeQuote
    ? [
        {
          quote: {
            requestId:
              '0x2c89709d46cfa5c1297d15f6138abbc6924cc3923b8e9242395211fd019ed54e',
            bridgeId: 'kyberswap',
            srcChainId: 11155111,
            destChainId: 11155111,
            aggregator: 'kyberswap',
            aggregatorType: 'AGG',
            srcAsset: {
              address: '0x0000000000000000000000000000000000000000',
              chainId: 11155111,
              assetId: 'eip155:1/slip44:60',
              symbol: 'ETH',
              decimals: 18,
              name: 'Ether',
              coingeckoId: 'ethereum',
              aggregators: [],
              occurrences: 100,
              iconUrl:
                'https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/1/slip44/60.png',
              metadata: {},
            },
            srcTokenAmount: '299250000000000',
            destAsset: {
              address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
              chainId: 11155111,
              assetId:
                'eip155:1/erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
              symbol: 'USDC',
              decimals: 6,
              name: 'USDC',
              coingeckoId: 'usd-coin',
              aggregators: [
                'metamask',
                'oneInch',
                'liFi',
                'socket',
                'rubic',
                'squid',
                'rango',
                'sonarwatch',
                'sushiSwap',
                'pmm',
                'bancor',
              ],
              occurrences: 13,
              iconUrl:
                'https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/1/erc20/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.png',
              metadata: {
                storage: {
                  balance: 9,
                  approval: 10,
                },
              },
            },
            destTokenAmount: '896724',
            minDestTokenAmount: '878789',
            walletAddress: '0xed4f01ebD67Bc3642e58B1bf7Dd98E8eDB9339a8',
            destWalletAddress: '0xed4f01ebD67Bc3642e58B1bf7Dd98E8eDB9339a8',
            feeData: {
              metabridge: {
                amount: '750000000000',
                asset: {
                  address: '0x0000000000000000000000000000000000000000',
                  chainId: 11155111,
                  assetId: 'eip155:1/slip44:60',
                  symbol: 'ETH',
                  decimals: 18,
                  name: 'Ether',
                  coingeckoId: 'ethereum',
                  aggregators: [],
                  occurrences: 100,
                  iconUrl:
                    'https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/1/slip44/60.png',
                  metadata: {},
                },
                quoteBpsFee: 25,
                baseBpsFee: 87.5,
              },
            },
            bridges: ['kyberswap'],
            protocols: ['kyberswap'],
            steps: [],
            slippage: 2,
            gasSponsored: false,
            gasIncluded7702: false,
            priceData: {
              totalFromAmountUsd: '0.886743',
              totalToAmountUsd: '0.896724',
              priceImpact: '-0.013790273587080577',
              totalFeeAmountUsd: '0.0022168575',
            },
          },
          trade: {
            chainId: 11155111,
            to: '0x881D40237659C251811CEC9c364ef91dC08D300C',
            from: '0xed4f01ebD67Bc3642e58B1bf7Dd98E8eDB9339a8',
            value: '0x110d9316ec000',
            data: '0x5f57552900000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000110d9316ec00000000000000000000000000000000000000000000000000000000000000000c000000000000000000000000000000000000000000000000000000000000000136b796265725377617046656544796e616d6963000000000000000000000000000000000000000000000000000000000000000000000000000000000000000d000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb480000000000000000000000000000000000000000000000000001102a91f2f40000000000000000000000000000000000000000000000000000000000000d68c50000000000000000000000000000000000000000000000000000000000000120000000000000000000000000000000000000000000000000000000ae9f7bcc00000000000000000000000000f326e4de8f66a0bdc0970b79e0924e33c79f191500000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000bc4e21fd0e9000000000000000000000000000000000000000000000000000000000000002000000000000000000000000063242a4ea82847b20e506b63b0e2e2eff0cc6cb0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000007000000000000000000000000000000000000000000000000000000000000000900000000000000000000000000000000000000000000000000000000000000064000000000000000000001102a91f2f40000000000000000000001102a91f2f400000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000e00000000000000000000000000000000000000000000000000000000000000041bd350603366b625f157ed12d958e8e3a08e2fc8c18fcdc2d0ba916882555d9303a918e70def188aeca999a9b74b12657959106734bebaa60331d55c2b8e335a71b00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000054000000000000000000000000074de5d4fcbf63e00296fd95d33236b97940166310000000000000000000000000000000000000000000000000000000000000140000000000000000000000000000000000000000000000000000000000000018000000000000000000001028ed7739b00000000000000000000011dc64c724d0000000000000000000001102a91f2f400000000000000000000000000000daed400000000000000000000000000000000000000000000010000000f42400000000000000000000000000000004f82e73edb06d29ff62c91ec8f5ff06571bdeb29000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000029e8d608000000000000000000000000000000000000000000000000000000000000000520000000000000000000000000000000000000000000000000000000000000000161f598cd000000000000000020f91ab108962d7e3c7dbf97b9179592855ab3d70000000000000000000000000000000000000000000000000000000000000003000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000001a00000000000000000000000000000000000000000000000000000000000000300000000000000000000000000eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee80000000000000000000000011d6315000000000000000000001102a91f2f4000000000000000000000000000000000000000000000000000000000000000060000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000001102a91f2f4000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc280000000000000000000000011d6315000000000000000000001102a91f2f4000000000000000000000000000000000000000000000000000000000000000060000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000001102a91f2f400d843eb3c0000000000010002121b20a953a964a774d7fcf046643ceb87d53cc7000000000000000000000000000000000000000000000000000000000000008000000000000000000000000063242a4ea82847b20e506b63b0e2e2eff0cc6cb00000000000000000000000000000000000000000000000000000000000000020000000000000000000000000476821016b300ed6ec0d30ef95d5a4409c50bb55000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb488000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb480000000000000000000000000000000000000000000000000000000000000160000000000000000000000000000000000000000000000000000000000000018000000000000000000000000000000000000000000000000000000000000001a000000000000000000000000000000000000000000000000000000000000001c000000000000000000000000074de5d4fcbf63e00296fd95d33236b97940166310000000000000000000000000000000000000000000000000001102a91f2f40000000000000000000000000000000000000000000000000000000000000d68c5000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000001e000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000027b7b22536f75726365223a226d6574616d61736b222c22416d6f756e74496e555344223a22302e38383333343533353931313238313831222c22416d6f756e744f7574555344223a22302e38393436323234313536343437333635222c22526566657272616c223a22222c22466c616773223a302c22416d6f756e744f7574223a22383936373234222c2254696d657374616d70223a313736353833393839392c22526f7574654944223a2236353037393066302d393832302d346636662d383431632d3430626639346339363430323a66373938306538362d336265392d343639322d623161612d343138303434356530373039222c22496e74656772697479496e666f223a7b224b65794944223a2231222c225369676e6174757265223a2241554c4645374653424c454d746d624262624e62487934476b4d6775497a36696e4f396d2b4b6f2f3738686b4b3550556d6f4c542b5255483068375262673832387176314564776c62777772415a2b526b6b4b56516c467934454f425a772f4c7343534a4d3548786e5771536c44546f476c76465549596475463232704253764c4347443669736f6157784178363737796e7a6d432b2b75686668726b383673376b5a6476714f4f6f2f6441586e47774a7441516f47623048576166734e71473167435a6267707158304a696978424f5048446a4f6166526a414d61702f6c64484a796f326178486c7a4854556265437565476635464e6c64644b596b735751427736643458784b72677875664f7564674a7164575743447056524d48754d595a5649346a467a56747335732f7a622f53614264326b544e507a79456458456872566364346a6876777968414a724245436c547751773d3d227d7d00000000000000000000000000000000000000000000000000000000000000000051',
            gasLimit: 380004,
            effectiveGas: 306661,
          },
          estimatedProcessingTimeInSeconds: 0,
        },
      ]
    : [];

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

    // Mock 4byte API for swap function signature
    const EXECUTE_SWAP_HEX_SIG = '0x3593564c';
    mock4byte(EXECUTE_SWAP_HEX_SIG);

    // Mock currency rate APIs
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
    const account =
      mockMetaMaskState.internalAccounts.accounts[
        mockMetaMaskState.internalAccounts
          .selectedAccount as keyof typeof mockMetaMaskState.internalAccounts.accounts
      ];

    const mockedMetaMaskState = getMetaMaskStateWithDappSwap({
      accountAddress: account.address,
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

    const banner = document.querySelector('.dapp-swap_callout');
    expect(banner).toBeInTheDocument();
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
    const account =
      mockMetaMaskState.internalAccounts.accounts[
        mockMetaMaskState.internalAccounts
          .selectedAccount as keyof typeof mockMetaMaskState.internalAccounts.accounts
      ];

    const mockedMetaMaskState = getMetaMaskStateWithDappSwap({
      accountAddress: account.address,
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

    // Verify that the banner is not rendered
    const banner = document.querySelector('.dapp-swap_callout');
    expect(banner).not.toBeInTheDocument();
  });

  it('hides the banner when close button is clicked', async () => {
    const account =
      mockMetaMaskState.internalAccounts.accounts[
        mockMetaMaskState.internalAccounts
          .selectedAccount as keyof typeof mockMetaMaskState.internalAccounts.accounts
      ];

    const mockedMetaMaskState = getMetaMaskStateWithDappSwap({
      accountAddress: account.address,
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

    // Verify banner callout is visible
    expect(document.querySelector('.dapp-swap_callout')).toBeInTheDocument();

    // Click the close button
    await act(async () => {
      fireEvent.click(banner);
    });

    // Verify banner is hidden
    await waitFor(() => {
      expect(
        document.querySelector('.dapp-swap_callout'),
      ).not.toBeInTheDocument();
    });

    // Verify tabs are still visible
    expect(screen.getByTestId('market-rate-tab')).toBeInTheDocument();
    expect(screen.getByTestId('metamask-swap-tab')).toBeInTheDocument();
  });

  it('switches between Market Rate and MetaMask Swap tabs', async () => {
    const account =
      mockMetaMaskState.internalAccounts.accounts[
        mockMetaMaskState.internalAccounts
          .selectedAccount as keyof typeof mockMetaMaskState.internalAccounts.accounts
      ];

    const mockedMetaMaskState = getMetaMaskStateWithDappSwap({
      accountAddress: account.address,
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

    // Verify banner is visible on Market Rate tab
    expect(document.querySelector('.dapp-swap_callout')).toBeInTheDocument();

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
    const account =
      mockMetaMaskState.internalAccounts.accounts[
        mockMetaMaskState.internalAccounts
          .selectedAccount as keyof typeof mockMetaMaskState.internalAccounts.accounts
      ];

    // Use a regular contract interaction from a non-allowlisted origin
    const nonSwapTransaction = getUnapprovedContractInteractionTransaction(
      account.address,
      pendingTransactionId,
      pendingTransactionTime,
    );

    const mockedMetaMaskState = {
      ...mockMetaMaskState,
      pendingApprovals: {
        [pendingTransactionId]: {
          id: pendingTransactionId,
          origin: 'local:http://localhost:8086/', // Different origin
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
        dappSwapMetrics: { enabled: true },
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

    // Verify that the banner is not rendered
    expect(
      document.querySelector('.dapp-swap_callout'),
    ).not.toBeInTheDocument();

    // Verify standard confirmation UI is displayed instead
    expect(
      await screen.findByText(tEn('confirmTitleTransaction') as string),
    ).toBeInTheDocument();
  });
});
