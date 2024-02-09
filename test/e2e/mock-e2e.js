const { GAS_API_BASE_URL } = require('../../shared/constants/swaps');

const blacklistedHosts = [
  'arbitrum-mainnet.infura.io',
  'goerli.infura.io',
  'mainnet.infura.io',
  'sepolia.infura.io',
];
const {
  mockEmptyStalelistAndHotlist,
} = require('./tests/phishing-controller/mocks');

const emptyHtmlPage = () => `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>E2E Test Page</title>
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
 * @param {(server: Mockttp) => MockedEndpoint} testSpecificMock - A function for setting up test-specific network mocks
 * @param {object} options - Network mock options.
 * @param {string} options.chainId - The chain ID used by the default configured network.
 * @returns {SetupMockReturn}
 */
async function setupMocking(server, testSpecificMock, { chainId }) {
  const privacyReport = new Set();
  await server.forAnyRequest().thenPassThrough({
    beforeRequest: (req) => {
      const { host } = req.headers;
      if (blacklistedHosts.includes(host)) {
        return {
          url: 'http://localhost:8545',
        };
      }
      return {};
    },
  });

  const mockedEndpoint = await testSpecificMock(server);

  // Mocks below this line can be overridden by test-specific mocks

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

  await server
    .forGet(`${GAS_API_BASE_URL}/networks/${chainId}/gasPrices`)
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
    .forGet('https://swap.metaswap.codefi.network/networks/1/token')
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

  await server
    .forGet('https://swap.metaswap.codefi.network/featureFlags')
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: [
          {
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
              extensionActive: false,
            },
            updated_at: '2022-03-17T15:54:00.360Z',
          },
        ],
      };
    });

  await server
    .forGet(`https://token-api.metaswap.codefi.network/tokens/${chainId}`)
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
        ],
      };
    });

  await server
    .forGet('https://swap.metaswap.codefi.network/networks/1/tokens')
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
              'https://token.metaswap.codefi.network/assets/nativeCurrencyLogos/ethereum.svg',
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
              'https://crypto.com/price/coin-data/icon/DAI/color_icon.png',
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
              'https://crypto.com/price/coin-data/icon/USDC/color_icon.png',
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
    .forGet('https://swap.metaswap.codefi.network/networks/1/topAssets')
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
    .forGet(`https://token-api.metaswap.codefi.network/token/${chainId}`)
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: {},
      };
    });

  // It disables loading of token icons, e.g. this URL: https://static.metafi.codefi.network/api/v1/tokenIcons/1337/0x0000000000000000000000000000000000000000.png
  const tokenIconRegex = new RegExp(
    `^https:\\/\\/static\\.metafi\\.codefi\\.network\\/api\\/vi\\/tokenIcons\\/${chainId}\\/.*\\.png`,
    'u',
  );
  await server.forGet(tokenIconRegex).thenCallback(() => {
    return {
      statusCode: 200,
    };
  });

  await server
    .forGet('https://min-api.cryptocompare.com/data/price')
    .withQuery({ fsym: 'ETH', tsyms: 'USD' })
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: {
          USD: '1700',
        },
      };
    });

  await mockEmptyStalelistAndHotlist(server);

  await server
    .forPost('https://customnetwork.com/api/customRPC')
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
   * Listen for requests and add the hostname to the privacy report if it did
   * not previously exist. This is used to track which hosts are requested
   * during the current test suite and used to ask for extra scrutiny when new
   * hosts are added to the privacy-snapshot.json file. We intentionally do not
   * add hosts to the report that are requested as part of the browsers normal
   * operation. See the browserAPIRequestDomains regex above.
   */
  server.on('request-initiated', (request) => {
    if (request.headers.host.match(browserAPIRequestDomains) === null) {
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
      .forGet(/https:\/\/token-api\.metaswap\.codefi\.network\/token\/.*/gu)
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
