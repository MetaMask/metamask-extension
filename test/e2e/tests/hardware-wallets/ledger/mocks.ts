import { MockttpServer } from 'mockttp';
import {
  AGGREGATOR_METADATA_API_MOCK_RESULT,
  GAS_PRICE_API_MOCK_RESULT,
  TOP_ASSETS_API_MOCK_RESULT,
} from '../../../../data/mock-data';
import { mockMultiNetworkBalancePolling } from '../../../mock-balance-polling/mock-balance-polling';

// Simplified ETH->DAI trade mock with only essential data for ledger swap test
const LEDGER_SWAP_ETH_DAI_TRADES_MOCK = [
  {
    // Primary successful trade option (airswapV4)
    trade: {
      data: '0x5f575529', // Simplified swap function selector
      from: '0xF68464152d7289D7eA9a2bEC2E0035c45188223c',
      value: '2000000000000000000', // 2 ETH
      to: '0x881D40237659C251811CEC9c364ef91dC08D300C',
    },
    hasRoute: false,
    sourceAmount: '2000000000000000000',
    destinationAmount: '4650000000000000000000', // ~4650 DAI
    error: null,
    sourceToken: '0x0000000000000000000000000000000000000000', // ETH
    destinationToken: '0x6b175474e89094c44da98b954eedeac495271d0f', // DAI
    maxGas: 300000,
    averageGas: 150000,
    estimatedRefund: 0,
    approvalNeeded: null,
    fetchTime: 500,
    aggregator: 'airswapV4',
    aggType: 'RFQ',
    fee: 0.875,
    quoteRefreshSeconds: 30,
    gasMultiplier: 1,
    sourceTokenRate: 1,
    destinationTokenRate: 0.0004256,
    priceSlippage: {
      ratio: 1.01,
      calculationError: '',
      bucket: 'low',
      sourceAmountInUSD: 4700,
      destinationAmountInUSD: 4650,
      sourceAmountInNativeCurrency: 2,
      destinationAmountInNativeCurrency: 1.98,
      sourceAmountInETH: 2,
      destinationAmountInETH: 1.98,
    },
  },
  {
    // Secondary successful trade option (oneInchV5)
    trade: {
      data: '0x5f575529',
      from: '0xF68464152d7289D7eA9a2bEC2E0035c45188223c',
      value: '2000000000000000000',
      to: '0x881D40237659C251811CEC9c364ef91dC08D300C',
    },
    hasRoute: false,
    sourceAmount: '2000000000000000000',
    destinationAmount: '4640000000000000000000', // ~4640 DAI
    error: null,
    sourceToken: '0x0000000000000000000000000000000000000000',
    destinationToken: '0x6b175474e89094c44da98b954eedeac495271d0f',
    maxGas: 1000000,
    averageGas: 560000,
    estimatedRefund: 0,
    approvalNeeded: null,
    fetchTime: 400,
    aggregator: 'oneInchV5',
    aggType: 'AGG',
    fee: 0.875,
    quoteRefreshSeconds: 30,
    gasMultiplier: 1.06,
    sourceTokenRate: 1,
    destinationTokenRate: 0.0004256,
    priceSlippage: {
      ratio: 1.015,
      calculationError: '',
      bucket: 'low',
      sourceAmountInUSD: 4700,
      destinationAmountInUSD: 4640,
      sourceAmountInNativeCurrency: 2,
      destinationAmountInNativeCurrency: 1.97,
      sourceAmountInETH: 2,
      destinationAmountInETH: 1.97,
    },
  },
  {
    // Failed trade option to show realistic aggregator mix
    trade: null,
    hasRoute: false,
    maxGas: 2750000,
    averageGas: 637198,
    estimatedRefund: 0,
    sourceToken: '0x0000000000000000000000000000000000000000',
    destinationToken: '0x6b175474e89094c44da98b954eedeac495271d0f',
    sourceAmount: '2000000000000000000',
    destinationAmount: null,
    error: 'Request failed with status code 403',
    approvalNeeded: null,
    fetchTime: 25,
    aggregator: 'paraswap',
    aggType: 'AGG',
    fee: 0.875,
    quoteRefreshSeconds: 30,
    gasMultiplier: 1.05,
    sourceTokenRate: 1,
    destinationTokenRate: 0.0004256,
    priceSlippage: {
      ratio: null,
      calculationError: 'No trade data to calculate price slippage',
      bucket: 'high',
      sourceAmountInUSD: null,
      destinationAmountInUSD: null,
      sourceAmountInNativeCurrency: null,
      destinationAmountInNativeCurrency: null,
      sourceAmountInETH: null,
      destinationAmountInETH: null,
    },
  },
];

export async function mockLedgerEthDaiTrade(mockServer: MockttpServer) {
  return [
    await mockServer
      .forGet('https://bridge.api.cx.metamask.io/networks/1/trades')
      .thenCallback(() => {
        return {
          statusCode: 200,
          json: LEDGER_SWAP_ETH_DAI_TRADES_MOCK,
        };
      }),
  ];
}

export async function mockLedgerTransactionRequests(mockServer: MockttpServer) {
  await mockLedgerTransactionRequestsBase(mockServer);

  await mockLedgerEthDaiTrade(mockServer);

  // Mock essential swap API endpoints
  await mockSwapNetworkInfo(mockServer);
  // Using mockSwapTokens instead of complex mockTokenInfo
  // Removed mockTransactionFees - not needed for basic swap test

  // Mock critical swap API endpoints that are missing
  await mockSwapFeatureFlags(mockServer);
  await mockSwapTokens(mockServer);
  await mockSwapTopAssets(mockServer);
  await mockSwapAggregatorMetadata(mockServer);
  await mockSwapGasPrices(mockServer);
  await mockSuggestedGasFees(mockServer);
  // Using mockLedgerEthDaiTrade instead of complex mockSwapTrades

  // Mock price APIs - critical for swap functionality
  await mockPriceAPIs(mockServer);

  // Mock Ledger iframe bridge - minimal mock to prevent catch-all redirect
  await mockLedgerIframeBridge(mockServer);

  // Note: Smart Transaction APIs are NOT mocked because Smart Transactions are disabled in the test

  // Mock external accounts API for activity list - CRITICAL for activity list display
  await mockExternalAccountsAPI(mockServer);

  // Simplified token icon mocks for localhost chain (1337) and mainnet (1)
  const tokenIconResponse = {
    statusCode: 200,
    body: 'fake-image-data',
    headers: { 'content-type': 'image/png' },
  };

  // Generic catch-all for any token icons on any chain - covers ETH, DAI, and others
  await mockServer
    .forGet(
      /https:\/\/static\.cx\.metamask\.io\/api\/v1\/tokenIcons\/\d+\/0x[a-fA-F0-9]{40}\.png/u,
    )
    .thenCallback(() => tokenIconResponse);

  // Removed Smart Transactions submitTransactions mock since Smart Transactions are disabled
}

// Mock network information for swap API
async function mockSwapNetworkInfo(mockServer: MockttpServer) {
  return await mockServer
    .forGet('https://swap.api.cx.metamask.io/networks/1')
    .thenCallback(() => ({
      statusCode: 200,
      json: {
        active: true,
        networkId: 1,
        chainId: 1,
        chainName: 'Ethereum Mainnet',
        nativeCurrency: {
          name: 'Ether',
          symbol: 'ETH',
          decimals: 18,
          address: '0x0000000000000000000000000000000000000000',
        },
        iconUrl: 'https://s3.amazonaws.com/airswap-token-images/ETH.png',
        blockExplorerUrl: 'https://etherscan.io',
        networkType: 'L1',
        aggregators: [
          'airswapV3',
          'airswapV4',
          'oneInchV4',
          'oneInchV5',
          'paraswap',
          'pmm',
          'zeroEx',
          'openOcean',
          'hashFlow',
          'wrappedNative',
          'kyberSwap',
        ],
        refreshRates: {
          quotes: 30,
          quotesPrefetching: 30,
          stxGetTransactions: 10,
          stxBatchStatus: 1,
          stxStatusDeadline: 160,
          stxMaxFeeMultiplier: 2,
        },
      },
    }));
}

// Removed complex mockTokenInfo function - using simple mockSwapTokens instead

// Removed complex mockTransactionFees function - not needed for basic swap test

// Mock price APIs - essential for swap page to load
async function mockPriceAPIs(mockServer: MockttpServer) {
  // Mock empty spot prices for mainnet
  await mockServer
    .forGet('https://price.api.cx.metamask.io/v2/chains/1/spot-prices')
    .thenCallback(() => ({
      statusCode: 200,
      json: {},
    }));

  // Mock historical prices for ETH (0x000...000)
  await mockServer
    .forGet(
      'https://price.api.cx.metamask.io/v1/1/historical-prices/0x0000000000000000000000000000000000000000',
    )
    .thenCallback(() => ({
      statusCode: 200,
      json: {},
    }));

  // Mock historical prices for DAI
  await mockServer
    .forGet(
      'https://price.api.cx.metamask.io/v1/1/historical-prices/0x6B175474E89094C44Da98b954EedeAC495271d0F',
    )
    .thenCallback(() => ({
      statusCode: 200,
      json: {},
    }));

  // Generic spot-prices with query params
  await mockServer
    .forGet(
      /https:\/\/price\.api\.cx\.metamask\.io\/v2\/chains\/1\/spot-prices\?.*/u,
    )
    .thenCallback(() => ({
      statusCode: 200,
      json: {},
    }));

  // Generic historical prices for any token
  await mockServer
    .forGet(
      /https:\/\/price\.api\.cx\.metamask\.io\/v1\/1\/historical-prices\/0x[a-fA-F0-9]{40}/u,
    )
    .thenCallback(() => ({
      statusCode: 200,
      json: {},
    }));
}

// Minimal Ledger iframe bridge mock - just to prevent catch-all redirect
// The actual signing is handled by FakeLedgerBridge in background.js
async function mockLedgerIframeBridge(mockServer: MockttpServer) {
  await mockServer
    .forGet('https://metamask.github.io/ledger-iframe-bridge/9.0.1/')
    .thenCallback(() => ({
      statusCode: 200,
      headers: {
        'Content-Type': 'text/html',
      },
      body: `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Ledger Bridge Mock</title>
        </head>
        <body>
          <script>
            // Minimal mock - just signal ready
            // Actual transaction signing is handled by FakeLedgerBridge
            window.parent.postMessage({
              type: 'ledger-bridge-ready'
            }, '*');
          </script>
        </body>
        </html>
      `,
    }));
}

// Mock swap feature flags API
async function mockSwapFeatureFlags(mockServer: MockttpServer) {
  return await mockServer
    .forGet('https://swap.api.cx.metamask.io/featureFlags')
    .thenCallback(() => ({
      statusCode: 200,
      json: {
        ethereum: {
          mobileActive: true,
          extensionActive: true,
          smartTransactions: {
            expectedDeadline: 45,
            maxDeadline: 150,
            returnTxHashAsap: false,
          },
        },
        smartTransactions: {
          expectedDeadline: 45,
          maxDeadline: 150,
          returnTxHashAsap: false,
        },
      },
    }));
}

// Mock swap tokens API
async function mockSwapTokens(mockServer: MockttpServer) {
  return await mockServer
    .forGet('https://swap.api.cx.metamask.io/networks/1/tokens')
    .thenCallback(() => ({
      statusCode: 200,
      json: [
        {
          symbol: 'ETH',
          name: 'Ether',
          address: '0x0000000000000000000000000000000000000000',
          decimals: 18,
          iconUrl:
            'https://raw.githubusercontent.com/MetaMask/contract-metadata/master/images/eth_28.png',
          aggregators: [
            'metamask',
            'aave',
            'coinGecko',
            'oneInch',
            'pmm',
            'zerion',
          ],
          occurrences: 6,
        },
        {
          symbol: 'DAI',
          name: 'Dai Stablecoin',
          address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
          decimals: 18,
          iconUrl:
            'https://raw.githubusercontent.com/MetaMask/contract-metadata/master/images/dai.svg',
          aggregators: [
            'metamask',
            'aave',
            'coinGecko',
            'oneInch',
            'pmm',
            'zerion',
          ],
          occurrences: 6,
        },
      ],
    }));
}

// Mock swap top assets API
async function mockSwapTopAssets(mockServer: MockttpServer) {
  return await mockServer
    .forGet('https://swap.api.cx.metamask.io/networks/1/topAssets')
    .thenCallback(() => ({
      statusCode: 200,
      json: TOP_ASSETS_API_MOCK_RESULT,
    }));
}

// Mock swap aggregator metadata API
async function mockSwapAggregatorMetadata(mockServer: MockttpServer) {
  return await mockServer
    .forGet('https://swap.api.cx.metamask.io/networks/1/aggregatorMetadata')
    .thenCallback(() => ({
      statusCode: 200,
      json: AGGREGATOR_METADATA_API_MOCK_RESULT,
    }));
}

// Mock swap gas prices API
async function mockSwapGasPrices(mockServer: MockttpServer) {
  return await mockServer
    .forGet('https://gas.api.cx.metamask.io/networks/1/gasPrices')
    .thenCallback(() => ({
      statusCode: 200,
      json: GAS_PRICE_API_MOCK_RESULT,
    }));
}

// Mock suggested gas fees API for chainId 1337 (localhost)
async function mockSuggestedGasFees(mockServer: MockttpServer) {
  return await mockServer
    .forGet('https://gas.api.cx.metamask.io/networks/1337/suggestedGasFees')
    .thenCallback(() => ({
      statusCode: 200,
      json: {
        low: {
          suggestedMaxPriorityFeePerGas: '1',
          suggestedMaxFeePerGas: '20',
          minWaitTimeEstimate: 15000,
          maxWaitTimeEstimate: 30000,
        },
        medium: {
          suggestedMaxPriorityFeePerGas: '1.5',
          suggestedMaxFeePerGas: '25',
          minWaitTimeEstimate: 15000,
          maxWaitTimeEstimate: 30000,
        },
        high: {
          suggestedMaxPriorityFeePerGas: '2',
          suggestedMaxFeePerGas: '30',
          minWaitTimeEstimate: 15000,
          maxWaitTimeEstimate: 30000,
        },
        estimatedBaseFee: '18',
        networkCongestion: 0.5,
        latestPriorityFeeRange: ['1', '2'],
        historicalPriorityFeeRange: ['1', '3'],
        historicalBaseFeeRange: ['15', '25'],
        priorityFeeTrend: 'stable',
        baseFeeTrend: 'stable',
      },
    }));
}

async function mockLedgerTransactionRequestsBase(mockServer: MockttpServer) {
  await mockMultiNetworkBalancePolling(mockServer);
}

// Mock external accounts API for activity list display
async function mockExternalAccountsAPI(mockServer: MockttpServer) {
  // Mock the external accounts API that provides transaction history for activity list
  // This API is called when user clicks on Activity tab
  // Use the ACTUAL address that the test is using (from the API call logs)
  await mockServer
    .forGet(
      'https://accounts.api.cx.metamask.io/v1/accounts/0xF68464152d7289D7eA9a2bEC2E0035c45188223c/transactions',
    )
    .withQuery({
      networks: '0x1,0x89,0x38,0xe708,0x2105,0xa,0xa4b1,0x82750,0x531',
      sortDirection: 'DESC',
    })
    .thenJson(200, {
      data: [
        {
          hash: '0xe3e223b9725765a7de557effdb2b507ace3534bcff2c1fe3a857e0791e56a518',
          chainId: 1337, // localhost chainId
          from: '0xF68464152d7289D7eA9a2bEC2E0035c45188223c',
          to: '0x881d40237659c251811cec9c364ef91dc08d300c',
          value: '2000000000000000000', // 2 ETH
          blockNumber: 1,
          blockHash:
            '0x1111111111111111111111111111111111111111111111111111111111111111',
          transactionIndex: 0,
          gasUsed: '21000',
          gasPrice: '10000000000',
          status: 'confirmed',
          timestamp: Date.now(),
          type: 'swap',
        },
      ],
    });

  // Also mock without query parameters as fallback
  await mockServer
    .forGet(
      'https://accounts.api.cx.metamask.io/v1/accounts/0xF68464152d7289D7eA9a2bEC2E0035c45188223c/transactions',
    )
    .thenJson(200, [
      {
        hash: '0xe3e223b9725765a7de557effdb2b507ace3534bcff2c1fe3a857e0791e56a518',
        chainId: 1337,
        from: '0xF68464152d7289D7eA9a2bEC2E0035c45188223c',
        to: '0x881d40237659c251811cec9c364ef91dc08d300c',
        value: '2000000000000000000',
        blockNumber: 1,
        blockHash:
          '0x1111111111111111111111111111111111111111111111111111111111111111',
        transactionIndex: 0,
        gasUsed: '21000',
        gasPrice: '10000000000',
        status: 'confirmed',
        timestamp: Date.now(),
        type: 'swap',
      },
    ]);
}
