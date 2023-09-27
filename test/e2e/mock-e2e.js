const blacklistedHosts = [
  'arbitrum-mainnet.infura.io',
  'goerli.infura.io',
  'mainnet.infura.io',
  'sepolia.infura.io',
];
const {
  mockEmptyStalelistAndHotlist,
} = require('./tests/phishing-controller/mocks');

/**
 * Setup E2E network mocks.
 *
 * @param {object} server - The mock server used for network mocks.
 * @param {Function} testSpecificMock - A function for setting up test-specific network mocks
 * @param {object} options - Network mock options.
 * @param {string} options.chainId - The chain ID used by the default configured network.
 * @returns
 */
async function setupMocking(server, testSpecificMock, { chainId }) {
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

  await server
    .forPost(
      'https://arbitrum-mainnet.infura.io/v3/00000000000000000000000000000000',
    )
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
    .forGet(
      `https://gas-api.metaswap.codefi.network/networks/${chainId}/gasPrices`,
    )
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
    .forGet(
      `https://gas-api.metaswap.codefi.network/networks/${chainId}/suggestedGasFees`,
    )
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

  return mockedEndpoint;
}

async function mockLensNameProvider(server) {
  const handlesByAddress = {
    '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826': 'test.lens',
    '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB': 'test2.lens',
    '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC': 'test3.lens',
  };

  await server.forPost('https://api.lens.dev').thenCallback((request) => {
    const address = request.body?.json?.variables?.address;
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
    '0xDeaDbeefdEAdbeefdEadbEEFdeadbeEFdEaDbeeF': 'Test Token',
    '0xB0BdaBea57B0BDABeA57b0bdABEA57b0BDabEa57': 'Test Token 2',
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

module.exports = { setupMocking };
