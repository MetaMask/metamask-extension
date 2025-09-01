const fs = require('fs');
const path = require('path');
const { escapeRegExp } = require('lodash');

const {
  ACCOUNTS_PROD_API_BASE_URL,
} = require('../../shared/constants/accounts');
const {
  GAS_API_BASE_URL,
  SWAPS_API_V2_BASE_URL,
  TOKEN_API_BASE_URL,
} = require('../../shared/constants/swaps');
const { TX_SENTINEL_URL } = require('../../shared/constants/transaction');
const { DEFAULT_FIXTURE_ACCOUNT_LOWERCASE } = require('./constants');
const { SECURITY_ALERTS_PROD_API_BASE_URL } = require('./tests/ppom/constants');

const { ALLOWLISTED_URLS } = require('./mock-e2e-allowlist');

const CDN_CONFIG_PATH = 'test/e2e/mock-cdn/cdn-config.txt';
const CDN_STALE_DIFF_PATH = 'test/e2e/mock-cdn/cdn-stale-diff.txt';
const CDN_STALE_PATH = 'test/e2e/mock-cdn/cdn-stale.txt';
const PPOM_VERSION_PATH = 'test/e2e/mock-cdn/ppom-version.json';
const PPOM_VERSION_HEADERS_PATH = 'test/e2e/mock-cdn/ppom-version-headers.json';

const CDN_CONFIG_RES_HEADERS_PATH =
  'test/e2e/mock-cdn/cdn-config-res-headers.json';
const CDN_STALE_DIFF_RES_HEADERS_PATH =
  'test/e2e/mock-cdn/cdn-stale-diff-res-headers.json';
const CDN_STALE_RES_HEADERS_PATH =
  'test/e2e/mock-cdn/cdn-stale-res-headers.json';

const ACCOUNTS_API_TOKENS_PATH =
  'test/e2e/mock-response-data/accounts-api-tokens.json';
const AGGREGATOR_METADATA_PATH =
  'test/e2e/mock-response-data/aggregator-metadata.json';
const CHAIN_ID_NETWORKS_PATH =
  'test/e2e/mock-response-data/chain-id-network-chains.json';
const CLIENT_SIDE_DETECTION_BLOCKLIST_PATH =
  'test/e2e/mock-response-data/client-side-detection-blocklist.json';
const ON_RAMP_CONTENT_PATH = 'test/e2e/mock-response-data/on-ramp-content.json';
const TEST_DAPP_STYLES_1_PATH =
  'test/e2e/mock-response-data/test-dapp-styles-1.txt';
const TEST_DAPP_STYLES_2_PATH =
  'test/e2e/mock-response-data/test-dapp-styles-2.txt';
const TOKEN_BLOCKLIST_PATH = 'test/e2e/mock-response-data/token-blocklist.json';

const snapsExecutionEnvBasePath = path.dirname(
  require.resolve('@metamask/snaps-execution-environments/package.json'),
);
const snapsExecutionEnvHtmlPath = path.join(
  snapsExecutionEnvBasePath,
  'dist',
  'webpack',
  'iframe',
  'index.html',
);
const snapsExecutionEnvHtml = fs.readFileSync(
  snapsExecutionEnvHtmlPath,
  'utf-8',
);

const snapsExecutionEnvJsPath = path.join(
  snapsExecutionEnvBasePath,
  'dist',
  'webpack',
  'iframe',
  'bundle.js',
);
const snapsExecutionEnvJs = fs.readFileSync(snapsExecutionEnvJsPath, 'utf-8');

const blocklistedHosts = [
  'arbitrum-mainnet.infura.io',
  'bsc-dataseed.binance.org',
  'linea-mainnet.infura.io',
  'linea-sepolia.infura.io',
  'testnet-rpc.monad.xyz',
  'carrot.megaeth.com',
  'sei-mainnet.infura.io',
  'mainnet.infura.io',
  'sepolia.infura.io',
];
const {
  mockEmptyStalelistAndHotlist,
} = require('./tests/phishing-controller/mocks');
const { mockNotificationServices } = require('./tests/notifications/mocks');
const { mockIdentityServices } = require('./tests/identity/mocks');

const emptyHtmlPage = () => `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>E2E Test Page</title>
    <link rel="icon" href="data:image/png;base64,iVBORw0KGgo=">
  </head>
  <body data-testid="empty-page-body">
    Empty page by MetaMask
  </body>
</html>`;

/**
 * The browser makes requests to domains within its own namespace for
 * functionality specific to the browser. For example when running E2E tests in
 * firefox the act of adding the extension from the firefox settins triggers
 * a series of requests to various mozilla.net or mozilla.com domains. These
 * are not requests that the extension itself makes.
 */
const browserAPIRequestDomains =
  /^.*\.(googleapis\.com|google\.com|mozilla\.net|mozilla\.com|mozilla\.org|gvt1\.com)$/iu;

/**
 * Some third-party providers might use random URLs that we don't want to track
 * in the privacy report "in clear". We identify those private hosts with a
 * `pattern` regexp and replace the original host by a more generic one (`host`).
 * For example, "my-secret-host.provider.com" could be denoted as "*.provider.com" in
 * the privacy report. This would prevent disclosing the "my-secret-host" subdomain
 * in this case.
 */
const privateHostMatchers = [
  // { pattern: RegExp, host: string }
  { pattern: /^.*\.btc.*\.quiknode\.pro$/iu, host: '*.btc*.quiknode.pro' },
  {
    pattern: /^.*-solana.*-.*\.mainnet\.rpcpool\.com/iu,
    host: '*solana*.mainnet.rpcpool.com',
  },
];

/**
 * @typedef {import('mockttp').Mockttp} Mockttp
 * @typedef {import('mockttp').MockedEndpoint} MockedEndpoint
 */

/**
 * @typedef {object} SetupMockReturn
 * @property {MockedEndpoint} mockedEndpoint - If a testSpecificMock was provided, returns the mockedEndpoint
 * @property {() => string[]} getPrivacyReport - A function to get the current privacy report.
 */

/**
 * Setup E2E network mocks.
 *
 * @param {Mockttp} server - The mock server used for network mocks.
 * @param {(server: Mockttp) => Promise<MockedEndpoint[]>} testSpecificMock - A function for setting up test-specific network mocks
 * @param {object} options - Network mock options.
 * @param {string} options.chainId - The chain ID used by the default configured network.
 * @param {string} options.ethConversionInUsd - The USD conversion rate for ETH.
 * @param {boolean} withSolanaWebSocket - If we want to re-route all the ws requests to our Solana Local WS server
 * @returns {Promise<SetupMockReturn>}
 */
async function setupMocking(
  server,
  testSpecificMock,
  { chainId, ethConversionInUsd = 1700 },
  withSolanaWebSocket,
) {
  const privacyReport = new Set();
  await server.forAnyRequest().thenPassThrough({
    beforeRequest: ({ headers: { host }, url }) => {
      if (blocklistedHosts.includes(host)) {
        return {
          url: 'http://localhost:8545',
        };
      } else if (ALLOWLISTED_URLS.includes(url)) {
        // If the URL or the host is in the allowlist, we pass the request as it is, to the live server.
        console.log('Request going to a live server ============', url);
        return {};
      }
      console.log('Request redirected to the catch all mock ============', url);
      return {
        // If the URL or the host is not in the allowlsit nor blocklisted, we return a 200.
        response: {
          statusCode: 200,
        },
      };
    },
  });

  const mockedEndpoint = await testSpecificMock(server);
  // Mocks below this line can be overridden by test-specific mocks

  // User Profile Lineage
  await server
    .forGet('https://authentication.api.cx.metamask.io/api/v2/profile/lineage')
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: {
          lineage: [
            {
              agent: 'mobile',
              metametrics_id: '0xdeadbeef',
              created_at: '2021-01-01',
              updated_at: '2021-01-01',
              counter: 1,
            },
          ],
          created_at: '2025-07-16T10:03:57Z',
          profile_id: '0deaba86-4b9d-4137-87d7-18bc5bf7708d',
        },
      };
    });

  // Account link
  const accountLinkRegex =
    /^https:\/\/etherscan.io\/address\/0x[a-fA-F0-9]{40}$/u;
  await server.forGet(accountLinkRegex).thenCallback(() => {
    return {
      statusCode: 200,
      body: emptyHtmlPage(),
    };
  });

  // Token tracker link
  const tokenTrackerRegex =
    /^https:\/\/etherscan.io\/token\/0x[a-fA-F0-9]{40}$/u;
  await server.forGet(tokenTrackerRegex).thenCallback(() => {
    return {
      statusCode: 200,
      body: emptyHtmlPage(),
    };
  });

  // Explorer link
  const explorerLinkRegex = /^https:\/\/etherscan.io\/tx\/0x[a-fA-F0-9]{64}$/u;
  await server.forGet(explorerLinkRegex).thenCallback(() => {
    return {
      statusCode: 200,
      body: emptyHtmlPage(),
    };
  });

  await server
    .forPost(
      `${SECURITY_ALERTS_PROD_API_BASE_URL}/validate/0x${chainId.toString(16)}`,
    )
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: {
          block: 20733513,
          result_type: 'Benign',
          reason: '',
          description: '',
          features: [],
        },
      };
    });

  await server
    .forPost(
      'https://arbitrum-mainnet.infura.io/v3/00000000000000000000000000000000',
    )
    .withJsonBodyIncluding({
      method: 'eth_chainId',
    })
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: {
          jsonrpc: '2.0',
          id: '1675864782845',
          result: '0xa4b1',
        },
      };
    });

  await server.forPost('https://api.segment.io/v1/batch').thenCallback(() => {
    return {
      statusCode: 200,
    };
  });

  await server
    .forPost('https://sentry.io/api/0000000/envelope/')
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: {},
      };
    });

  await server
    .forPost('https://sentry.io/api/0000000/store/')
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: {},
      };
    });

  await server
    .forGet('https://www.4byte.directory/api/v1/signatures/')
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: {
          count: 1,
          next: null,
          previous: null,
          results: [
            {
              id: 1,
              created_at: null,
              text_signature: 'deposit()',
              hex_signature: null,
              bytes_signature: null,
            },
          ],
        },
      };
    });

  const targetChainId = chainId === 1337 ? 1 : chainId;
  await server
    .forGet(`${GAS_API_BASE_URL}/networks/${targetChainId}/gasPrices`)
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: {
          SafeGasPrice: '1',
          ProposeGasPrice: '2',
          FastGasPrice: '3',
        },
      };
    });

  await server
    .forGet(`${SWAPS_API_V2_BASE_URL}/networks/1/token`)
    .withQuery({ address: '0x72c9Fb7ED19D3ce51cea5C56B3e023cd918baaDf' })
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: {
          symbol: 'AGLT',
          type: 'erc20',
          decimals: '18',
          address: '0x72c9fb7ed19d3ce51cea5c56b3e023cd918baadf',
          occurences: 1,
          aggregators: ['dynamic'],
        },
      };
    });

  await server
    .forGet(`${GAS_API_BASE_URL}/networks/${chainId}/suggestedGasFees`)
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: {
          low: {
            suggestedMaxPriorityFeePerGas: '1',
            suggestedMaxFeePerGas: '20.44436136',
            minWaitTimeEstimate: 15000,
            maxWaitTimeEstimate: 30000,
          },
          medium: {
            suggestedMaxPriorityFeePerGas: '1.5',
            suggestedMaxFeePerGas: '25.80554517',
            minWaitTimeEstimate: 15000,
            maxWaitTimeEstimate: 45000,
          },
          high: {
            suggestedMaxPriorityFeePerGas: '2',
            suggestedMaxFeePerGas: '27.277766977',
            minWaitTimeEstimate: 15000,
            maxWaitTimeEstimate: 60000,
          },
          estimatedBaseFee: '19.444436136',
          networkCongestion: 0.14685,
          latestPriorityFeeRange: ['0.378818859', '6.555563864'],
          historicalPriorityFeeRange: ['0.1', '248.262969261'],
          historicalBaseFeeRange: ['14.146999781', '28.825256275'],
          priorityFeeTrend: 'down',
          baseFeeTrend: 'up',
        },
      };
    });

  // This endpoint returns metadata for "transaction simulation" supported networks.
  await server.forGet(`${TX_SENTINEL_URL}/networks`).thenJson(200, {
    1: {
      name: 'Mainnet',
      group: 'ethereum',
      chainID: 1,
      nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
      network: 'ethereum-mainnet',
      explorer: 'https://etherscan.io',
      confirmations: true,
      smartTransactions: true,
      hidden: false,
    },
  });
  await server.forGet(`${TX_SENTINEL_URL}/network`).thenJson(200, {
    name: 'Mainnet',
    group: 'ethereum',
    chainID: 1,
    nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
    network: 'ethereum-mainnet',
    explorer: 'https://etherscan.io',
    confirmations: true,
    smartTransactions: true,
    hidden: false,
  });

  await server
    .forGet(`${SWAPS_API_V2_BASE_URL}/featureFlags`)
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: {
          ethereum: {
            fallbackToV1: false,
            mobileActive: true,
            extensionActive: true,
          },
          bsc: {
            fallbackToV1: false,
            mobileActive: true,
            extensionActive: true,
          },
          polygon: {
            fallbackToV1: false,
            mobileActive: true,
            extensionActive: true,
          },
          avalanche: {
            fallbackToV1: false,
            mobileActive: true,
            extensionActive: true,
          },
          smartTransactions: {
            mobileActive: false,
            extensionActive: true,
          },
          updated_at: '2022-03-17T15:54:00.360Z',
        },
      };
    });

  // Surveys
  await server
    .forGet(
      new RegExp(
        `${escapeRegExp(ACCOUNTS_PROD_API_BASE_URL)}/v1/users/[^/]+/surveys`,
        'u',
      ),
    )
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: {
          userId: '0x123',
          surveys: {},
        },
      };
    });

  await server
    .forGet(`https://token.api.cx.metamask.io/tokens/${chainId}`)
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: [
          {
            address: '0x0d8775f648430679a709e98d2b0cb6250d2887ef',
            symbol: 'BAT',
            decimals: 18,
            name: 'Basic Attention Token',
            iconUrl:
              'https://assets.coingecko.com/coins/images/677/thumb/basic-attention-token.png?1547034427',
            aggregators: [
              'aave',
              'bancor',
              'coinGecko',
              'oneInch',
              'paraswap',
              'pmm',
              'zapper',
              'zerion',
              'zeroEx',
            ],
            occurrences: 9,
          },
          {
            address: '0x6b175474e89094c44da98b954eedeac495271d0f',
            symbol: 'DAI',
            decimals: 18,
            name: 'Dai Stablecoin',
            iconUrl:
              'https://raw.githubusercontent.com/MetaMask/contract-metadata/master/images/dai.svg',
            type: 'erc20',
            aggregators: [
              'metamask',
              'aave',
              'bancor',
              'cmc',
              'cryptocom',
              'coinGecko',
              'oneInch',
              'pmm',
              'sushiswap',
              'zerion',
              'lifi',
              'socket',
              'squid',
              'openswap',
              'sonarwatch',
              'uniswapLabs',
              'coinmarketcap',
            ],
            occurrences: 17,
            erc20Permit: true,
            fees: { '0xb0da5965d43369968574d399dbe6374683773a65': 0 },
            storage: { balance: 2 },
          },
        ],
      };
    });

  const TOKEN_BLOCKLIST = fs.readFileSync(TOKEN_BLOCKLIST_PATH);
  await server
    .forGet(`${TOKEN_API_BASE_URL}/blocklist`)
    .withQuery({ chainId: '1', region: 'global' })
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: JSON.parse(TOKEN_BLOCKLIST),
      };
    });

  const AGGREGATOR_METADATA = fs.readFileSync(AGGREGATOR_METADATA_PATH);
  await server
    .forGet(`${SWAPS_API_V2_BASE_URL}/networks/1/aggregatorMetadata`)
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: JSON.parse(AGGREGATOR_METADATA),
      };
    });

  await server
    .forGet(`${SWAPS_API_V2_BASE_URL}/networks/1/tokens`)
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: [
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
            iconUrl:
              'https://static.cx.metamask.io/api/v1/tokenIcons/1/0x6b175474e89094c44da98b954eedeac495271d0f.png',
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
          },
          {
            address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            symbol: 'USDC',
            decimals: 6,
            name: 'USD Coin',
            iconUrl:
              'https://static.cx.metamask.io/api/v1/tokenIcons/1/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.png',
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
          },
        ],
      };
    });

  await server
    .forGet(`${SWAPS_API_V2_BASE_URL}/networks/1/topAssets`)
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: [
          {
            address: '0x0000000000000000000000000000000000000000',
            symbol: 'ETH',
          },
          {
            address: '0x6b175474e89094c44da98b954eedeac495271d0f',
            symbol: 'DAI',
          },
          {
            address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            symbol: 'USDC',
          },
          {
            address: '0xdac17f958d2ee523a2206206994597c13d831ec7',
            symbol: 'USDT',
          },
        ],
      };
    });

  await server
    .forGet(`https://token.api.cx.metamask.io/token/${chainId}`)
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: {},
      };
    });

  // It disables loading of token icons, e.g. this URL: https://static.cx.metamask.io/api/v1/tokenIcons/1337/0x0000000000000000000000000000000000000000.png
  const tokenIconRegex = new RegExp(
    `^https:\\/\\/static\\.cx\\.metamask\\.io\\/api\\/vi\\/tokenIcons\\/${chainId}\\/.*\\.png`,
    'u',
  );
  await server.forGet(tokenIconRegex).thenCallback(() => {
    return {
      statusCode: 200,
    };
  });

  await server
    .forGet('https://min-api.cryptocompare.com/data/pricemulti')
    .withQuery({ fsyms: 'ETH', tsyms: 'usd' })
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: {
          ETH: {
            USD: ethConversionInUsd,
          },
        },
      };
    });

  const PPOM_VERSION = fs.readFileSync(PPOM_VERSION_PATH);
  const PPOM_VERSION_HEADERS = fs.readFileSync(PPOM_VERSION_HEADERS_PATH);
  const CDN_CONFIG = fs.readFileSync(CDN_CONFIG_PATH);
  const CDN_STALE = fs.readFileSync(CDN_STALE_PATH);
  const CDN_STALE_DIFF = fs.readFileSync(CDN_STALE_DIFF_PATH);
  const CDN_CONFIG_RES_HEADERS = fs.readFileSync(CDN_CONFIG_RES_HEADERS_PATH);
  const CDN_STALE_RES_HEADERS = fs.readFileSync(CDN_STALE_RES_HEADERS_PATH);
  const CDN_STALE_DIFF_RES_HEADERS = fs.readFileSync(
    CDN_STALE_DIFF_RES_HEADERS_PATH,
  );

  await server
    .forHead(
      'https://static.cx.metamask.io/api/v1/confirmations/ppom/ppom_version.json',
    )
    .thenCallback(() => {
      return {
        statusCode: 200,
      };
    });

  await server
    .forGet(
      'https://static.cx.metamask.io/api/v1/confirmations/ppom/ppom_version.json',
    )
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: JSON.parse(PPOM_VERSION),
        headers: JSON.parse(PPOM_VERSION_HEADERS),
      };
    });

  await server
    .forGet(
      /^https:\/\/static.cx.metamask.io\/api\/v1\/confirmations\/ppom\/config\/0x1\/(.*)/u,
    )
    .thenCallback(() => {
      return {
        statusCode: 200,
        rawBody: CDN_CONFIG,
        headers: JSON.parse(CDN_CONFIG_RES_HEADERS),
      };
    });

  await server
    .forGet(
      /^https:\/\/static.cx.metamask.io\/api\/v1\/confirmations\/ppom\/stale_diff\/0x1\/(.*)/u,
    )
    .thenCallback(() => {
      return {
        statusCode: 200,
        rawBody: CDN_STALE_DIFF,
        headers: JSON.parse(CDN_STALE_DIFF_RES_HEADERS),
      };
    });

  await server
    .forGet(
      /^https:\/\/static.cx.metamask.io\/api\/v1\/confirmations\/ppom\/stale\/0x1\/(.*)/u,
    )
    .thenCallback(() => {
      return {
        statusCode: 200,
        rawBody: CDN_STALE,
        headers: JSON.parse(CDN_STALE_RES_HEADERS),
      };
    });

  await mockEmptyStalelistAndHotlist(server);

  await server
    .forPost('https://customnetwork.test/api/customRPC')
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: {
          jsonrpc: '2.0',
          id: '1675864782845',
          result: '0x122',
        },
      };
    });

  await mockLensNameProvider(server);
  await mockTokenNameProvider(server, chainId);

  // IPFS endpoint for NFT metadata
  await server
    .forGet(
      'https://bafybeidxfmwycgzcp4v2togflpqh2gnibuexjy4m4qqwxp7nh3jx5zlh4y.ipfs.dweb.link/1.json',
    )
    .thenCallback(() => {
      return {
        statusCode: 200,
      };
    });

  // Notification APIs
  await mockNotificationServices(server);

  // Identity APIs
  await mockIdentityServices(server);

  await server.forGet(/^https:\/\/sourcify.dev\/(.*)/u).thenCallback(() => {
    return {
      statusCode: 404,
    };
  });

  // remote feature flags
  await server
    .forGet('https://client-config.api.cx.metamask.io/v1/flags')
    .withQuery({
      client: 'extension',
      distribution: 'main',
      environment: 'dev',
    })
    .thenCallback(() => {
      return {
        ok: true,
        statusCode: 200,
        json: [
          { feature1: true },
          { feature2: false },
          {
            feature3: [
              {
                value: 'valueA',
                name: 'groupA',
                scope: { type: 'threshold', value: 0.3 },
              },
              {
                value: 'valueB',
                name: 'groupB',
                scope: { type: 'threshold', value: 0.5 },
              },
              {
                scope: { type: 'threshold', value: 1 },
                value: 'valueC',
                name: 'groupC',
              },
            ],
          },
        ],
      };
    });

  // On Ramp Content
  const ON_RAMP_CONTENT = fs.readFileSync(ON_RAMP_CONTENT_PATH);
  await server
    .forGet('https://on-ramp-content.api.cx.metamask.io/regions/networks')
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: JSON.parse(ON_RAMP_CONTENT),
      };
    });

  // Chains Metadata
  const CHAIN_ID_NETWORKS = fs.readFileSync(CHAIN_ID_NETWORKS_PATH);
  await server
    .forGet('https://chainid.network/chains.json')
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: JSON.parse(CHAIN_ID_NETWORKS),
      };
    });

  // Accounts API: supported networks
  await server
    .forGet('https://accounts.api.cx.metamask.io/v1/supportedNetworks')
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: {
          fullSupport: [1, 137, 56, 59144, 8453, 10, 42161, 534352],
          partialSupport: {
            balances: [42220, 43114],
          },
        },
      };
    });

  // Accounts API: tokens
  const ACCOUNTS_API_TOKENS = fs.readFileSync(ACCOUNTS_API_TOKENS_PATH);
  await server
    .forGet('https://account.api.cx.metamask.io/networks')
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: JSON.parse(ACCOUNTS_API_TOKENS),
      };
    });

  // Client Side Detection: Request Blocklist
  const CLIENT_SIDE_DETECTION_BLOCKLIST = fs.readFileSync(
    CLIENT_SIDE_DETECTION_BLOCKLIST_PATH,
  );
  await server
    .forGet(
      'https://client-side-detection.api.cx.metamask.io/v1/request-blocklist',
    )
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: JSON.parse(CLIENT_SIDE_DETECTION_BLOCKLIST),
      };
    });

  // Nft API: tokens
  await server
    .forGet(
      `https://nft.api.cx.metamask.io/users/${DEFAULT_FIXTURE_ACCOUNT_LOWERCASE}/tokens`,
    )
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: {
          tokens: [],
          continuation: null,
        },
      };
    });

  // On Ramp: Eligibility MetaMask Card
  await server
    .forGet('https://on-ramp.api.cx.metamask.io/eligibility/mm-card')
    .thenCallback(() => {
      return {
        statusCode: 200,
        body: true,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
        },
      };
    });

  // Snaps: Execution environment html
  await server
    .forGet(/^https:\/\/execution\.metamask\.io\/iframe\/[^/]+\/index\.html$/u)
    .thenCallback(() => {
      return {
        statusCode: 200,
        body: snapsExecutionEnvHtml,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      };
    });

  // Snaps: Execution environment js
  await server
    .forGet(/^https:\/\/execution\.metamask\.io\/iframe\/[^/]+\/bundle\.js$/u)
    .thenCallback(() => {
      return {
        statusCode: 200,
        body: snapsExecutionEnvJs,
        headers: { 'Content-Type': 'application/javascript; charset=utf-8' },
      };
    });

  /**
   * Solana Websocket
   * Setup HTTP intercept for WebSocket handshake requests
   */
  if (withSolanaWebSocket) {
    await server
      .forAnyWebSocket()
      .matching((req) =>
        /^wss:\/\/solana-(mainnet|devnet)\.infura\.io\//u.test(req.url),
      )
      .thenForwardTo('ws://localhost:8088');
  }

  // Test Dapp Styles
  const TEST_DAPP_STYLES_1 = fs.readFileSync(TEST_DAPP_STYLES_1_PATH);
  const TEST_DAPP_STYLES_2 = fs.readFileSync(TEST_DAPP_STYLES_2_PATH);
  await server
    .forGet(
      'https://cdnjs.cloudflare.com/ajax/libs/mdbootstrap/4.14.1/css/mdb.min.css',
    )
    .thenCallback(() => {
      return {
        statusCode: 200,
        body: TEST_DAPP_STYLES_1,
      };
    });

  await server
    .forGet(
      'https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/4.4.1/css/bootstrap.min.css',
    )
    .thenCallback(() => {
      return {
        statusCode: 200,
        body: TEST_DAPP_STYLES_2,
      };
    });

  // Token Icons
  await server
    .forGet('https://static.cx.metamask.io/api/v1/tokenIcons')
    .thenCallback(() => {
      return {
        statusCode: 200,
      };
    });

  // Dynamic Banner Content
  await server
    .forGet(/^https:\/\/(cdn|preview)\.contentful\.com\/.*$/u)
    .withQuery({
      content_type: 'promotionalBanner',
    })
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: {
          items: [],
          includes: { Asset: [] },
        },
      };
    });

  /**
   * Returns an array of alphanumerically sorted hostnames that were requested
   * during the current test suite.
   *
   * @returns {string[]} privacy report for the current test suite.
   */
  function getPrivacyReport() {
    return [...privacyReport].sort();
  }

  /**
   * Excludes hosts from the privacyReport if they are refered to by the MetaMask Portfolio
   * in a different tab. This is because the Portfolio is a separate application
   *
   * @param request
   */
  const portfolioRequestsMatcher = (request) =>
    request.headers.referer === 'https://app.metamask.io/';

  /**
   * Tests a request against private domains and returns a set of generic hostnames that
   * match.
   *
   * @param request
   * @returns A set of matched results.
   */
  const matchPrivateHosts = (request) => {
    const privateHosts = new Set();

    for (const { pattern, host: privateHost } of privateHostMatchers) {
      if (request.headers.host.match(pattern)) {
        privateHosts.add(privateHost);
      }
    }

    return privateHosts;
  };

  /**
   * Listen for requests and add the hostname to the privacy report if it did
   * not previously exist. This is used to track which hosts are requested
   * during the current test suite and used to ask for extra scrutiny when new
   * hosts are added to the privacy-snapshot.json file. We intentionally do not
   * add hosts to the report that are requested as part of the browsers normal
   * operation. See the browserAPIRequestDomains regex above.
   */
  server.on('request-initiated', (request) => {
    const privateHosts = matchPrivateHosts(request);
    if (privateHosts.size) {
      for (const privateHost of privateHosts) {
        privacyReport.add(privateHost);
      }
      // At this point, we know the request at least one private doamin, so we just stops here to avoid
      // using the request any further.
      return;
    }

    if (
      request.headers.host.match(browserAPIRequestDomains) === null &&
      !portfolioRequestsMatcher(request)
    ) {
      privacyReport.add(request.headers.host);
    }
  });

  return { mockedEndpoint, getPrivacyReport };
}

async function mockLensNameProvider(server) {
  const handlesByAddress = {
    '0xcd2a3d9f938e13cd947ec05abc7fe734df8dd826': 'test.lens',
    '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb': 'test2.lens',
    '0xcccccccccccccccccccccccccccccccccccccccc': 'test3.lens',
    '0x0c54fccd2e384b4bb6f2e405bf5cbc15a017aafb': 'test4.lens',
  };

  await server.forPost('https://api.lens.dev').thenCallback(async (request) => {
    const json = await request.body?.getJson();
    const address = json?.variables?.address;
    const handle = handlesByAddress[address];

    return {
      statusCode: 200,
      json: {
        data: {
          profiles: {
            items: [
              {
                handle,
              },
            ],
          },
        },
      },
    };
  });
}

async function mockTokenNameProvider(server) {
  const namesByAddress = {
    '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef': 'Test Token',
    '0xb0bdabea57b0bdabea57b0bdabea57b0bdabea57': 'Test Token 2',
  };

  for (const address of Object.keys(namesByAddress)) {
    const name = namesByAddress[address];

    await server
      .forGet(/https:\/\/token\.api\.cx\.metamask\.io\/token\/.*/gu)
      .withQuery({ address })
      .thenCallback(() => {
        return {
          statusCode: 200,
          json: {
            name,
          },
        };
      });
  }
}

module.exports = { setupMocking, emptyHtmlPage };
