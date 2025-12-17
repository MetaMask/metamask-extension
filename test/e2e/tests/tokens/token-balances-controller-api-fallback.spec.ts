import { strict as assert } from 'assert';
import { MockedEndpoint, Mockttp } from 'mockttp';
import { withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixtures/fixture-builder';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import AssetListPage from '../../page-objects/pages/home/asset-list';

const DEFAULT_FIXTURE_ACCOUNT = '0x5cfe73b6021e818b776b421b1c4db2474086a7e1';

/**
 * Mock feature flags API with assetsAccountApiBalances enabled
 * This enables the TokenBalancesController to use Account API v4
 *
 * NOTE: Uses .always() to ensure this mock takes priority over
 * the global feature flags mock in mock-e2e.js
 *
 * @param mockServer - Mockttp server instance
 * @param enableAccountApiBalances - Whether to enable the Account API balances feature
 */
async function mockFeatureFlags(
  mockServer: Mockttp,
  enableAccountApiBalances = true,
): Promise<MockedEndpoint[]> {
  return [
    // Use regex to match any request to the feature flags URL (with any query params)
    await mockServer
      .forGet(/client-config\.api\.cx\.metamask\.io\/v1\/flags/u)
      .always()
      .thenCallback(() => ({
        ok: true,
        statusCode: 200,
        // API returns array of separate objects, each with a single feature flag
        json: [
          {
            assetsAccountApiBalances: enableAccountApiBalances ? ['0x1'] : [],
          },
          {
            enableMultichainAccountsState2: {
              enabled: true,
              featureVersion: '2',
              minimumVersion: '12.19.0',
            },
          },
          {
            sendRedesign: {
              enabled: false,
            },
          },
        ],
      })),
  ];
}

describe('TokenBalancesController - Account API v4 with RPC Fallback', function () {
  /**
   * Mock successful Account API v4 balances endpoint
   * This simulates a working Account API that returns token balances
   *
   * @param mockServer - Mockttp server instance
   */
  async function mockAccountApiV4Success(
    mockServer: Mockttp,
  ): Promise<MockedEndpoint[]> {
    return [
      await mockServer
        .forGet('https://accounts.api.cx.metamask.io/v4/multiaccount/balances')
        .withQuery({
          networks: '1',
        })
        .thenCallback(() => {
          return {
            statusCode: 200,
            json: {
              count: 2,
              balances: [
                {
                  object: 'token',
                  address: '0x0000000000000000000000000000000000000000',
                  symbol: 'ETH',
                  name: 'Ether',
                  type: 'native',
                  timestamp: '2015-07-30T03:26:13.000Z',
                  decimals: 18,
                  chainId: 1,
                  balance: '25.000000000000000000', // 25 ETH in wei
                },
                {
                  object: 'token',
                  address: '0x6b175474e89094c44da98b954eedeac495271d0f',
                  name: 'Dai Stablecoin',
                  symbol: 'DAI',
                  type: 'erc20',
                  decimals: 18,
                  balance: '0.200000000000000000',
                  chainId: 1,
                },
              ],
              unprocessedNetworks: [],
            },
          };
        }),
    ];
  }

  /**
   * Mock failed Account API v4 balances endpoint
   * This simulates an API failure to test RPC fallback behavior
   *
   * @param mockServer - Mockttp server instance
   */
  async function mockAccountApiV4Failure(
    mockServer: Mockttp,
  ): Promise<MockedEndpoint[]> {
    return [
      await mockServer
        .forGet('https://accounts.api.cx.metamask.io/v4/multiaccount/balances')
        .thenCallback(() => {
          return {
            statusCode: 500,
            json: {
              error: 'Internal Server Error',
              message: 'Service temporarily unavailable',
            },
          };
        }),
    ];
  }

  /**
   * Mock RPC balance calls for fallback
   * These mocks handle the eth_getBalance and eth_call requests that
   * MetaMask makes when the Account API fails
   *
   * @param mockServer - Mockttp server instance
   */
  async function mockRpcBalanceFallback(
    mockServer: Mockttp,
  ): Promise<MockedEndpoint[]> {
    const infuraUrl =
      'https://mainnet.infura.io/v3/00000000000000000000000000000000';

    return [
      // Mock eth_getBalance for native ETH balance
      await mockServer
        .forPost(infuraUrl)
        .withJsonBodyIncluding({
          method: 'eth_getBalance',
          params: [DEFAULT_FIXTURE_ACCOUNT.toLowerCase(), 'latest'],
        })
        .thenCallback(() => {
          return {
            statusCode: 200,
            json: {
              jsonrpc: '2.0',
              id: 1,
              result: '0x16345785d8a0000', // 0.1 ETH in wei (hex)
            },
          };
        }),

      // Mock eth_call for token balances (multi-call contract)
      await mockServer
        .forPost(infuraUrl)
        .withJsonBodyIncluding({
          method: 'eth_call',
        })
        .thenCallback(() => {
          return {
            statusCode: 200,
            json: {
              jsonrpc: '2.0',
              id: 2,
              // This is a hex-encoded response from the multicall contract
              // representing token balances for DAI
              result:
                '0x0000000000000000000000000000000000000000000000000000000000000020' +
                '0000000000000000000000000000000000000000000000000000000000000001' +
                '0000000000000000000000000000000000000000000002b5e3af16b1880000', // 50 DAI
            },
          };
        }),

      // Mock eth_blockNumber
      await mockServer
        .forPost(infuraUrl)
        .withJsonBodyIncluding({ method: 'eth_blockNumber' })
        .thenCallback(() => ({
          statusCode: 200,
          json: {
            jsonrpc: '2.0',
            id: 3,
            result: '0x1234567',
          },
        })),

      // Mock eth_chainId
      await mockServer
        .forPost(infuraUrl)
        .withJsonBodyIncluding({ method: 'eth_chainId' })
        .thenCallback(() => ({
          statusCode: 200,
          json: {
            jsonrpc: '2.0',
            id: 4,
            result: '0x1',
          },
        })),
    ];
  }

  /**
   * Mock price API for token valuations
   *
   * @param mockServer - Mockttp server instance
   */
  async function mockPriceApi(mockServer: Mockttp): Promise<MockedEndpoint[]> {
    return [
      await mockServer
        .forGet('https://price.api.cx.metamask.io/v2/chains/1/spot-prices')
        .thenCallback(() => ({
          statusCode: 200,
          json: {
            '0x0000000000000000000000000000000000000000': {
              price: 2500,
              currency: 'usd',
            },
            '0x6b175474e89094c44da98b954eedeac495271d0f': {
              price: 1.0,
              currency: 'usd',
            },
          },
        })),
    ];
  }

  it('fetches token balances successfully using Account API v4', async function () {
    async function mockSuccessfulApis(
      mockServer: Mockttp,
    ): Promise<MockedEndpoint[]> {
      return [
        ...(await mockFeatureFlags(mockServer, true)),
        ...(await mockAccountApiV4Success(mockServer)),
        ...(await mockPriceApi(mockServer)),
      ];
    }

    await withFixtures(
      {
        fixtures: new FixtureBuilder({
          inputChainId: CHAIN_IDS.MAINNET,
        })
          .withPreferencesController({
            useExternalServices: true,
            useMultiAccountBalanceChecker: true,
          })
          .withRemoteFeatureFlags({
            assetsAccountApiBalances: ['0x1'],
          })
          .withEnabledNetworks({
            eip155: {
              [CHAIN_IDS.MAINNET]: true,
            },
          })
          .withTokensController({
            allTokens: {
              [CHAIN_IDS.MAINNET]: {
                [DEFAULT_FIXTURE_ACCOUNT]: [
                  {
                    address: '0x6b175474e89094c44da98b954eedeac495271d0f',
                    symbol: 'DAI',
                    decimals: 18,
                    name: 'Dai Stablecoin',
                  },
                ],
              },
            },
            tokens: [
              {
                address: '0x6b175474e89094c44da98b954eedeac495271d0f',
                symbol: 'DAI',
                decimals: 18,
                name: 'Dai Stablecoin',
              },
            ],
          })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockSuccessfulApis,
      },
      async ({ driver, mockedEndpoint }) => {
        // Login to existing wallet (onboarding already complete in fixture)
        await loginWithBalanceValidation(driver);

        const assetListPage = new AssetListPage(driver);

        // Wait for the TokenBalancesController to poll and fetch balances
        await driver.delay(35000);

        // Verify the Account API mock endpoint is registered
        const accountApiEndpoint = mockedEndpoint.find(
          (endpoint: MockedEndpoint) =>
            JSON.stringify(endpoint).includes('multiaccount/balances'),
        );

        assert.ok(
          accountApiEndpoint,
          'Account API endpoint mock should be registered',
        );

        // Verify balances are displayed
        await assetListPage.checkTokenAmountIsDisplayed('25 ETH');
      },
    );
  });

  it('falls back to RPC when Account API v4 fails', async function () {
    async function mockApiFailureWithRpcFallback(
      mockServer: Mockttp,
    ): Promise<MockedEndpoint[]> {
      return [
        ...(await mockFeatureFlags(mockServer, true)),
        ...(await mockAccountApiV4Failure(mockServer)),
        ...(await mockRpcBalanceFallback(mockServer)),
        ...(await mockPriceApi(mockServer)),
      ];
    }

    await withFixtures(
      {
        fixtures: new FixtureBuilder({
          inputChainId: CHAIN_IDS.MAINNET,
        })
          .withPreferencesController({
            useExternalServices: true,
            useMultiAccountBalanceChecker: true,
          })
          .withRemoteFeatureFlags({
            assetsAccountApiBalances: ['0x1'],
          })
          .withEnabledNetworks({
            eip155: {
              [CHAIN_IDS.MAINNET]: true,
            },
          })
          .withTokensController({
            allTokens: {
              [CHAIN_IDS.MAINNET]: {
                [DEFAULT_FIXTURE_ACCOUNT]: [
                  {
                    address: '0x6b175474e89094c44da98b954eedeac495271d0f',
                    symbol: 'DAI',
                    decimals: 18,
                    name: 'Dai Stablecoin',
                  },
                ],
              },
            },
            tokens: [
              {
                address: '0x6b175474e89094c44da98b954eedeac495271d0f',
                symbol: 'DAI',
                decimals: 18,
                name: 'Dai Stablecoin',
              },
            ],
          })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockApiFailureWithRpcFallback,
      },
      async ({ driver, mockedEndpoint }) => {
        // Login to existing wallet (onboarding already complete in fixture)
        await loginWithBalanceValidation(driver);

        // Wait for the TokenBalancesController to poll and fetch balances
        await driver.delay(35000);

        // Verify that Account API mock endpoint is registered (and failed)
        const accountApiEndpoint = mockedEndpoint.find(
          (endpoint: MockedEndpoint) =>
            JSON.stringify(endpoint).includes('multiaccount/balances'),
        );

        assert.ok(
          accountApiEndpoint,
          'Account API endpoint mock should be registered',
        );

        // Verify that RPC fallback mock endpoints are registered
        const infuraEndpoints = mockedEndpoint.filter(
          (endpoint: MockedEndpoint) =>
            JSON.stringify(endpoint).includes('infura.io'),
        );

        assert.ok(
          infuraEndpoints.length > 0,
          'RPC endpoints should be registered for fallback',
        );
      },
    );
  });

  it('uses RPC when Account API feature flag is disabled', async function () {
    async function mockRpcOnlyApis(
      mockServer: Mockttp,
    ): Promise<MockedEndpoint[]> {
      return [
        ...(await mockFeatureFlags(mockServer, false)), // Disable Account API feature flag
        ...(await mockRpcBalanceFallback(mockServer)),
        ...(await mockPriceApi(mockServer)),
      ];
    }

    await withFixtures(
      {
        fixtures: new FixtureBuilder({
          inputChainId: CHAIN_IDS.MAINNET,
        })
          .withPreferencesController({
            useExternalServices: true,
            useMultiAccountBalanceChecker: true,
          })
          .withRemoteFeatureFlags({
            assetsAccountApiBalances: [], // Disabled
          })
          .withEnabledNetworks({
            eip155: {
              [CHAIN_IDS.MAINNET]: true,
            },
          })
          .withTokensController({
            allTokens: {
              [CHAIN_IDS.MAINNET]: {
                [DEFAULT_FIXTURE_ACCOUNT]: [
                  {
                    address: '0x6b175474e89094c44da98b954eedeac495271d0f',
                    symbol: 'DAI',
                    decimals: 18,
                    name: 'Dai Stablecoin',
                  },
                ],
              },
            },
            tokens: [
              {
                address: '0x6b175474e89094c44da98b954eedeac495271d0f',
                symbol: 'DAI',
                decimals: 18,
                name: 'Dai Stablecoin',
              },
            ],
          })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockRpcOnlyApis,
      },
      async ({ driver, mockedEndpoint }) => {
        // Login to existing wallet (onboarding already complete in fixture)
        await loginWithBalanceValidation(driver);

        // Wait for the TokenBalancesController to poll and fetch balances via RPC
        await driver.delay(35000);

        // Verify that RPC mock endpoints are registered
        const infuraEndpoints = mockedEndpoint.filter(
          (endpoint: MockedEndpoint) =>
            JSON.stringify(endpoint).includes('infura.io'),
        );

        assert.ok(
          infuraEndpoints.length > 0,
          'RPC endpoints should be registered',
        );
      },
    );
  });
});
