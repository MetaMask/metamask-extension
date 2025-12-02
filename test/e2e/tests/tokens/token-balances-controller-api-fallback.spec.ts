import { strict as assert } from 'assert';
import { MockedEndpoint, Mockttp } from 'mockttp';
import { withFixtures, WALLET_PASSWORD } from '../../helpers';
import FixtureBuilder from '../../fixtures/fixture-builder';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { completeImportSRPOnboardingFlow } from '../../page-objects/flows/onboarding.flow';
import AssetListPage from '../../page-objects/pages/home/asset-list';
import { E2E_SRP } from '../../fixtures/default-fixture';

const DEFAULT_FIXTURE_ACCOUNT = '0x5cfe73b6021e818b776b421b1c4db2474086a7e1';

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
          accountAddresses: `eip155:1:${DEFAULT_FIXTURE_ACCOUNT}`,
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
                  balance: '100000000000000000', // 0.1 ETH
                },
                {
                  object: 'token',
                  address: '0x6b175474e89094c44da98b954eedeac495271d0f',
                  symbol: 'DAI',
                  name: 'Dai Stablecoin',
                  type: 'erc20',
                  timestamp: '2019-11-18T00:00:00.000Z',
                  decimals: 18,
                  chainId: 1,
                  balance: '50000000000000000000', // 50 DAI
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
        .withQuery({
          accountAddresses: `eip155:1:${DEFAULT_FIXTURE_ACCOUNT}`,
        })
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
        ...(await mockAccountApiV4Success(mockServer)),
        ...(await mockPriceApi(mockServer)),
      ];
    }

    await withFixtures(
      {
        fixtures: new FixtureBuilder({
          onboarding: true, // Use onboarding fixture to get RemoteFeatureFlagController
          inputChainId: CHAIN_IDS.MAINNET,
        })
          .withPreferencesController({
            useExternalServices: true,
            useMultiAccountBalanceChecker: true,
          })
          .withRemoteFeatureFlags({
            // Enable Account API for mainnet (chain ID 0x1)
            assetsAccountApiBalances: ['0x1'],
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
        await completeImportSRPOnboardingFlow({
          driver,
          seedPhrase: E2E_SRP,
          password: WALLET_PASSWORD,
        });

        const assetListPage = new AssetListPage(driver);

        // Wait for the TokenBalancesController to poll and fetch balances
        // Controller polls every 30 seconds, adding buffer for completion
        await driver.delay(35000);

        // Verify that Account API was called
        const accountApiEndpoint = mockedEndpoint.find(
          (endpoint: MockedEndpoint) =>
            endpoint.toString().includes('v4/multiaccount/balances'),
        );

        if (accountApiEndpoint) {
          const requests = await accountApiEndpoint.getSeenRequests();
          assert.ok(
            requests.length > 0,
            'Account API should have been called at least once',
          );
        } else {
          assert.fail('Account API endpoint mock not found');
        }

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
        ...(await mockAccountApiV4Failure(mockServer)),
        ...(await mockRpcBalanceFallback(mockServer)),
        ...(await mockPriceApi(mockServer)),
      ];
    }

    await withFixtures(
      {
        fixtures: new FixtureBuilder({
          onboarding: true,
          inputChainId: CHAIN_IDS.MAINNET,
        })
          .withPreferencesController({
            useExternalServices: true,
            useMultiAccountBalanceChecker: true,
          })
          .withRemoteFeatureFlags({
            // Enable Account API for mainnet (chain ID 0x1)
            assetsAccountApiBalances: ['0x1'],
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
        // Complete onboarding flow from scratch
        await completeImportSRPOnboardingFlow({
          driver,
          seedPhrase: E2E_SRP,
          password: WALLET_PASSWORD,
        });

        // Wait for the TokenBalancesController to poll and fetch balances
        // Controller polls every 30 seconds, adding buffer for completion
        await driver.delay(35000);

        // Verify that Account API was called (and failed)
        const accountApiEndpoint = mockedEndpoint.find(
          (endpoint: MockedEndpoint) =>
            endpoint.toString().includes('v4/multiaccount/balances'),
        );

        if (accountApiEndpoint) {
          const requests = await accountApiEndpoint.getSeenRequests();
          assert.ok(
            requests.length > 0,
            'Account API should have been called before falling back',
          );
        }

        // Verify that RPC fallback was used
        const infuraEndpoints = mockedEndpoint.filter(
          (endpoint: MockedEndpoint) =>
            endpoint.toString().includes('infura.io'),
        );

        let rpcCallsMade = 0;
        for (const endpoint of infuraEndpoints) {
          const requests = await endpoint.getSeenRequests();
          rpcCallsMade += requests.length;
        }

        assert.ok(
          rpcCallsMade > 0,
          'RPC endpoints should have been called as fallback',
        );
      },
    );
  });

  it('uses RPC when Account API feature flag is disabled', async function () {
    async function mockRpcOnlyApis(
      mockServer: Mockttp,
    ): Promise<MockedEndpoint[]> {
      return [
        ...(await mockRpcBalanceFallback(mockServer)),
        ...(await mockPriceApi(mockServer)),
      ];
    }

    await withFixtures(
      {
        fixtures: new FixtureBuilder({
          onboarding: true,
          inputChainId: CHAIN_IDS.MAINNET,
        })
          .withPreferencesController({
            useExternalServices: true,
            useMultiAccountBalanceChecker: true,
          })
          .withRemoteFeatureFlags({
            // Feature flag is empty array, so Account API is disabled
            assetsAccountApiBalances: [],
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
        await completeImportSRPOnboardingFlow({
          driver,
          seedPhrase: E2E_SRP,
          password: WALLET_PASSWORD,
        });

        // Wait for the TokenBalancesController to poll and fetch balances via RPC
        // Controller polls every 30 seconds, adding buffer for completion
        await driver.delay(35000);

        // Verify that NO Account API calls were made
        const accountApiEndpoint = mockedEndpoint.find(
          (endpoint: MockedEndpoint) =>
            endpoint.toString().includes('v4/multiaccount/balances'),
        );

        // Account API should not have been called since feature flag is disabled
        if (accountApiEndpoint) {
          const requests = await accountApiEndpoint.getSeenRequests();
          assert.ok(
            requests.length === 0,
            'Account API should not have been called when feature flag is disabled',
          );
        }

        // Verify that RPC was used directly
        const infuraEndpoints = mockedEndpoint.filter(
          (endpoint: MockedEndpoint) =>
            endpoint.toString().includes('infura.io'),
        );

        let rpcCallsMade = 0;
        for (const endpoint of infuraEndpoints) {
          const requests = await endpoint.getSeenRequests();
          rpcCallsMade += requests.length;
        }

        assert.ok(
          rpcCallsMade > 0,
          'RPC endpoints should have been called directly',
        );
      },
    );
  });
});
