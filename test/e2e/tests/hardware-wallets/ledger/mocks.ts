import { MockttpServer } from 'mockttp';
import {
  AGGREGATOR_METADATA_API_MOCK_RESULT,
  GAS_PRICE_API_MOCK_RESULT,
  SWAP_TEST_ETH_DAI_TRADES_MOCK,
} from '../../../../data/mock-data';
import { mockMultiNetworkBalancePolling } from '../../../mock-balance-polling/mock-balance-polling';
import { mockServerJsonRpc } from '../../ppom/mocks/mock-server-json-rpc';

const TRANSACTION_HASH =
  '0xec9d6214684d6dc191133ae4a7ec97db3e521fff9cfe5c4f48a84cb6c93a5fa6';

const BLOCK_HASH =
  '0xe90b92d004a9c22c32c50c628bbd93f22e3468ec4ffc62422d68cf6370f59f1e';

// Removed Smart Transactions related constants since Smart Transactions are disabled

const GET_TRANSACTION_RECEIPT_RESPONSE = {
  id: 2901696354742565,
  jsonrpc: '2.0',
  result: {
    blockHash: BLOCK_HASH,
    blockNumber: '0x2',
    contractAddress: null,
    cumulativeGasUsed: '0xc138b1',
    effectiveGasPrice: '0x1053fcd93',
    from: '0xF68464152d7289D7eA9a2bEC2E0035c45188223c', // Use consistent Ledger address
    gasUsed: '0x2e93c',
    logs: [
      {
        address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
        blockHash: BLOCK_HASH,
        blockNumber: '0x13c80ce',
        data: '0x00000000000000000000000000000000000000000000000000005af3107a4000',
        logIndex: '0xde',
        removed: false,
        topics: [
          '0xe1fffcc4923d04b559f4d29a8bfc6cda04eb5b0d3c460751c2402c5c5cc9109c',
          '0x00000000000000000000000074de5d4fcbf63e00296fd95d33236b9794016631',
        ],
        transactionHash: TRANSACTION_HASH,
        transactionIndex: '0x2f',
      },
      {
        address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
        blockHash: BLOCK_HASH,
        blockNumber: '0x13c80ce',
        data: '0x00000000000000000000000000000000000000000000000000005a275669d200',
        logIndex: '0xdf',
        removed: false,
        topics: [
          '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
          '0x00000000000000000000000074de5d4fcbf63e00296fd95d33236b9794016631',
          '0x00000000000000000000000051c72848c68a965f66fa7a88855f9f7784502a7f',
        ],
        transactionHash: TRANSACTION_HASH,
        transactionIndex: '0x2f',
      },
      {
        address: '0x6b175474e89094c44da98b954eedeac495271d0f',
        blockHash: BLOCK_HASH,
        blockNumber: '0x13c80ce',
        data: '0x000000000000000000000000000000000000000000000000033dd7a160e2a300',
        logIndex: '0xe0',
        removed: false,
        topics: [
          '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
          '0x00000000000000000000000051c72848c68a965f66fa7a88855f9f7784502a7f',
          '0x00000000000000000000000074de5d4fcbf63e00296fd95d33236b9794016631',
        ],
        transactionHash: TRANSACTION_HASH,
        transactionIndex: '0x2f',
      },
      {
        address: '0x6b175474e89094c44da98b954eedeac495271d0f',
        blockHash: BLOCK_HASH,
        blockNumber: '0x13c80ce',
        data: '0x00000000000000000000000000000000000000000000000000006a3845cef618',
        logIndex: '0xe1',
        removed: false,
        topics: [
          '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
          '0x00000000000000000000000051c72848c68a965f66fa7a88855f9f7784502a7f',
          '0x000000000000000000000000ad30f7eebd9bd5150a256f47da41d4403033cdf0',
        ],
        transactionHash: TRANSACTION_HASH,
        transactionIndex: '0x2f',
      },
      {
        address: '0xd82fa167727a4dc6d6f55830a2c47abbb4b3a0f8',
        blockHash: BLOCK_HASH,
        blockNumber: '0x13c80ce',
        data: '0x0000000000000000000000006b175474e89094c44da98b954eedeac495271d0f000000000000000000000000000000000000000000000000033dd7a160e2a3000000000000000000000000000000000000000000000000000000000000000005000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc200000000000000000000000000000000000000000000000000005a275669d200',
        logIndex: '0xe2',
        removed: false,
        topics: [
          '0xb651f2787ff61b5ab14f3936f2daebdad3d84aeb74438e82870cc3b7aee71e90',
          '0x00000000000000000000000000000000000000000000000000000191e0cc96ac',
          '0x00000000000000000000000051c72848c68a965f66fa7a88855f9f7784502a7f',
          '0x00000000000000000000000074de5d4fcbf63e00296fd95d33236b9794016631',
        ],
        transactionHash: TRANSACTION_HASH,
        transactionIndex: '0x2f',
      },
      {
        address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
        blockHash: BLOCK_HASH,
        blockNumber: '0x13c80ce',
        data: '0x000000000000000000000000000000000000000000000000000000cbba106e00',
        logIndex: '0xe3',
        removed: false,
        topics: [
          '0x7fcf532c15f0a6db0bd6d0e038bea71d30d808c7d98cb3bf7268a95bf5081b65',
          '0x00000000000000000000000074de5d4fcbf63e00296fd95d33236b9794016631',
        ],
        transactionHash: TRANSACTION_HASH,
        transactionIndex: '0x2f',
      },
      {
        address: '0xf326e4de8f66a0bdc0970b79e0924e33c79f1915',
        blockHash: BLOCK_HASH,
        blockNumber: '0x13c80ce',
        data: '0x000000000000000000000000000000000000000000000000000000cbba106e00',
        logIndex: '0xe4',
        removed: false,
        topics: [
          '0x3d0ce9bfc3ed7d6862dbb28b2dea94561fe714a1b4d019aa8af39730d1ad7c3d',
          '0x00000000000000000000000074de5d4fcbf63e00296fd95d33236b9794016631',
        ],
        transactionHash: TRANSACTION_HASH,
        transactionIndex: '0x2f',
      },
      {
        address: '0x6b175474e89094c44da98b954eedeac495271d0f',
        blockHash: BLOCK_HASH,
        blockNumber: '0x13c80ce',
        data: '0x000000000000000000000000000000000000000000000000033dd7a160e2a300',
        logIndex: '0xe5',
        removed: false,
        topics: [
          '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
          '0x00000000000000000000000074de5d4fcbf63e00296fd95d33236b9794016631',
          '0x0000000000000000000000005cfe73b6021e818b776b421b1c4db2474086a7e1',
        ],
        transactionHash: TRANSACTION_HASH,
        transactionIndex: '0x2f',
      },
      {
        address: '0x881d40237659c251811cec9c364ef91dc08d300c',
        blockHash: BLOCK_HASH,
        blockNumber: '0x13c80ce',
        data: '0x',
        logIndex: '0xe6',
        removed: false,
        topics: [
          '0xbeee1e6e7fe307ddcf84b0a16137a4430ad5e2480fc4f4a8e250ab56ccd7630d',
          '0x015123c6e2552626efe611b6c48de60d080a6650860a38f237bc2b6f651f79d1',
          '0x0000000000000000000000005cfe73b6021e818b776b421b1c4db2474086a7e1',
        ],
        transactionHash: TRANSACTION_HASH,
        transactionIndex: '0x2f',
      },
    ],
    logsBloom:
      '0x00000000000000001000000000000000000000000000000000000001000000000000010000000000000010000000000002000000080008000000040000000000a00000000000000000020008000000000000000000540000000004008020000010000000000000000000000000000801000000000000040000000010004010000000021000000000000000000000000000020041000100004020000000000000000000000200000000000040000000000000000000000000000000000000000000000002000400000000000000000000001002000400000000000002000000000020200000000400000000800000000000000000020200400000000000001000',
    status: '0x1',
    to: '0x881d40237659c251811cec9c364ef91dc08d300c',
    transactionHash: TRANSACTION_HASH,
    transactionIndex: '0x2f',
    type: '0x2',
  },
};

const GET_TRANSACTION_BY_HASH_RESPONSE = {
  id: 2901696354742565,
  jsonrpc: '2.0',
  result: {
    accessList: [],
    blockHash: BLOCK_HASH,
    blockNumber: '0x2',
    chainId: '0x539',
    from: '0xF68464152d7289D7eA9a2bEC2E0035c45188223c', // Use consistent Ledger address
    gas: '0x3a73c',
    gasPrice: '0x1053fcd93',
    hash: TRANSACTION_HASH,
    input:
      '0x5f5755290000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005af3107a400000000000000000000000000000000000000000000000000000000000000000c0000000000000000000000000000000000000000000000000000000000000001c616972737761704c696768743446656544796e616d696346697865640000000000000000000000000000000000000000000000000000000000000000000001a000000000000000000000000000000000000000000000000000000191e0cc96ac0000000000000000000000000000000000000000000000000000000066e44f2c00000000000000000000000051c72848c68a965f66fa7a88855f9f7784502a7f0000000000000000000000006b175474e89094c44da98b954eedeac495271d0f000000000000000000000000000000000000000000000000033dd7a160e2a300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005a275669d200000000000000000000000000000000000000000000000000000000000000001bc1acb8a206598705baeb494a479a8af9dc3a9f9b7bd1ce9818360fd6f603cf0766e7bdc77f9f72e90dcd9157e007291adc6d3947e9b6d89ff412c5b54f9a17f1000000000000000000000000000000000000000000000000000000cbba106e00000000000000000000000000f326e4de8f66a0bdc0970b79e0924e33c79f1915000000000000000000000000000000000000000000000000000000000000000000d7',
    maxFeePerGas: '0x14bdcd619',
    maxPriorityFeePerGas: '0x3b9aca04',
    nonce: '0x127',
    r: '0x5a5463bfe8e587ee1211be74580c74fa759f8292f37f970033df4b782f5e097d',
    s: '0x50e403a70000b106e9f598b1b3f55b6ea9d2ec21d9fc67de63eb1d07df2767dd',
    to: '0x881d40237659c251811cec9c364ef91dc08d300c',
    transactionIndex: '0x2f',
    type: '0x2',
    v: '0x0',
    value: '0x5af3107a4000',
    yParity: '0x0',
  },
};

// Removed SWAP_TEST_GAS_INCLUDED_TRADES_MOCK since it's not used in our test

const GET_BLOCK_BY_HASH_RESPONSE = {
  id: 2901696354742565,
  jsonrpc: '2.0',
  result: {
    baseFeePerGas: '0x123',
    timestamp: '123456789',
  },
};

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

  // Mock token icon APIs for localhost chain (1337) and mainnet (1)
  const tokenIconResponse = {
    statusCode: 200,
    body: 'fake-image-data',
    headers: { 'content-type': 'image/png' },
  };

  // ETH token icon for localhost chain (1337)
  await mockServer
    .forGet(
      'https://static.cx.metamask.io/api/v1/tokenIcons/1337/0x0000000000000000000000000000000000000000.png',
    )
    .thenCallback(() => tokenIconResponse);

  // DAI token icon for localhost chain (1337)
  await mockServer
    .forGet(
      'https://static.cx.metamask.io/api/v1/tokenIcons/1337/0x6B175474E89094C44Da98b954EedeAC495271d0F.png',
    )
    .thenCallback(() => tokenIconResponse);

  // Generic catch-all for any other token icons on any chain
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

export async function mockLedgerEthDaiTrade(mockServer: MockttpServer) {
  return [
    await mockServer
      .forGet('https://swap.api.cx.metamask.io/networks/1/trades')
      .thenCallback(() => {
        return {
          statusCode: 200,
          json: SWAP_TEST_ETH_DAI_TRADES_MOCK,
        };
      }),
  ];
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
      json: [
        {
          symbol: 'ETH',
          address: '0x0000000000000000000000000000000000000000',
        },
        {
          symbol: 'DAI',
          address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
        },
        {
          symbol: 'USDC',
          address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        },
      ],
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

// Removed complex mockSwapTrades function - using simple mockLedgerEthDaiTrade instead

// Removed mockSmartTransactionAPIs function since Smart Transactions are disabled in the test

async function mockLedgerTransactionRequestsBase(mockServer: MockttpServer) {
  await mockMultiNetworkBalancePolling(mockServer);

  await mockServerJsonRpc(mockServer, [
    ['eth_blockNumber'],
    ['eth_getBlockByNumber'],
    ['eth_chainId', { result: `0x539` }], // localhost chainId
    // Mock eth_sendTransaction for regular transaction submission (when Smart Transactions are disabled)
    [
      'eth_sendTransaction',
      {
        result:
          '0xe3e223b9725765a7de557effdb2b507ace3534bcff2c1fe3a857e0791e56a518',
      },
    ],
    // Mock eth_getTransactionReceipt for transaction status checking
    [
      'eth_getTransactionReceipt',
      {
        result: {
          transactionHash:
            '0xe3e223b9725765a7de557effdb2b507ace3534bcff2c1fe3a857e0791e56a518',
          transactionIndex: '0x0',
          blockHash:
            '0x1111111111111111111111111111111111111111111111111111111111111111',
          blockNumber: '0x1',
          from: '0xF68464152d7289D7eA9a2bEC2E0035c45188223c',
          to: '0x881d40237659c251811cec9c364ef91dc08d300c',
          gasUsed: '0x5208',
          cumulativeGasUsed: '0x5208',
          contractAddress: null,
          logs: [],
          status: '0x1', // Success
        },
      },
    ],
    // Mock eth_getBalance for account balance checking
    ['eth_getBalance', { result: '0x1158e460913d00000' }], // 20 ETH in wei
    // Mock eth_gasPrice for gas price fallback
    ['eth_gasPrice', { result: '0x174876e800' }], // 100 gwei
    // Mock eth_estimateGas for gas estimation
    ['eth_estimateGas', { result: '0x5208' }], // 21000 gas
  ]);

  // Removed Smart Transactions API mocks since Smart Transactions are disabled

  await mockServer
    .forJsonRpcRequest({
      method: 'eth_getTransactionReceipt',
      params: [TRANSACTION_HASH],
    })
    .thenJson(200, GET_TRANSACTION_RECEIPT_RESPONSE);

  await mockServer
    .forJsonRpcRequest({
      method: 'eth_getTransactionByHash',
      params: [TRANSACTION_HASH],
    })
    .thenJson(200, GET_TRANSACTION_BY_HASH_RESPONSE);

  await mockServer
    .forJsonRpcRequest({
      method: 'eth_getBlockByHash',
      params: [BLOCK_HASH],
    })
    .thenJson(200, GET_BLOCK_BY_HASH_RESPONSE);
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
    .thenJson(200, [
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
    ]);

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
