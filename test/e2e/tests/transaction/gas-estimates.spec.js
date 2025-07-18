const {
  withFixtures,
  logInWithBalanceValidation,
  openActionMenuAndStartSendFlow,
} = require('../../helpers');
const FixtureBuilder = require('../../fixture-builder');
const { CHAIN_IDS } = require('../../../../shared/constants/network');
const { GAS_API_BASE_URL } = require('../../../../shared/constants/swaps');

const PREFERENCES_STATE_MOCK = {
  preferences: {
    showFiatInTestnets: true,
  },
  // Enables advanced details due to migration 123
  useNonceField: true,
};

async function mockBinanceRelatedRequests(mockServer) {
  return [
    mockServer
      .forGet('https://swap.api.cx.metamask.io/networks/56/topAssets')
      .thenCallback(() => {
        return {
          statusCode: 200,
          json: [
            {
              address: '0x0000000000000000000000000000000000000000',
              symbol: 'BNB',
            },
          ],
        };
      }),
    mockServer
      .forGet('https://swap.api.cx.metamask.io/networks/56/aggregatorMetadata')
      .thenCallback(() => {
        return {
          statusCode: 200,
          json: {
            airswapLight: {
              color: '#2B71FF',
              title: 'AirSwap',
              icon: "data:image/svg+xml,%3csvg width='75' height='31' viewBox='0 0 75 31' fill='none' xmlns='http://www.w3.org/2000/svg'%3e %3cpath fill-rule='evenodd' clip-rule='evenodd' d='M31.4038 12.231H30.1152V19.3099H31.4038V12.231Z' fill='%23FDFDFD'/%3e %3cpath fill-rule='evenodd' clip-rule='evenodd'",
              iconPng: '',
            },
          },
        };
      }),
    mockServer
      .forGet('https://tokens.api.cx.metamask.io/blocklist')
      .thenCallback(() => {
        return {
          statusCode: 200,
          json: [],
        };
      }),
    mockServer
      .forGet('https://swap.api.cx.metamask.io/networks/56/tokens')
      .thenCallback(() => {
        return {
          statusCode: 200,
          json: [
            {
              address: '0x7e8bae727abc245181f7abad0a4445114c0ca987',
              symbol: '7',
              decimals: 9,
              name: 'Lucky7',
              iconUrl:
                'https://static.cx.metamask.io/api/v1/tokenIcons/56/0x7e8bae727abc245181f7abad0a4445114c0ca987.png',
              type: 'erc20',
              aggregators: ['pancakeCoinGecko'],
              occurrences: 4,
              erc20Permit: false,
              storage: {
                balance: 5,
                approval: 3,
              },
              blocked: false,
            },
          ],
        };
      }),
  ];
}

async function mockBinanceRelatedRequestsWithGasApiDown(mockServer) {
  const relatedRequests = await mockBinanceRelatedRequests(mockServer);
  const gasApiDownRequest = mockServer
    .forGet(
      `${GAS_API_BASE_URL}/networks/${parseInt(CHAIN_IDS.BSC, 16)}/gasPrices`,
    )
    .thenCallback(() => {
      return {
        statusCode: 422,
      };
    });
  return [...relatedRequests, gasApiDownRequest];
}

async function mockBinanceRelatedRequestsWithGasApiAvailable(mockServer) {
  const relatedRequests = await mockBinanceRelatedRequests(mockServer);
  const gasApiAvailableRequest = mockServer
    .forGet(
      `${GAS_API_BASE_URL}/networks/${parseInt(CHAIN_IDS.BSC, 16)}/gasPrices`,
    )
    .thenCallback(() => {
      return {
        statusCode: 200,
      };
    });
  return [...relatedRequests, gasApiAvailableRequest];
}

describe('Gas estimates generated by MetaMask', function () {
  describe('Send on a network that is EIP-1559 compatible', function () {
    it('show expected gas defaults', async function () {
      await withFixtures(
        {
          fixtures: new FixtureBuilder()
            .withPreferencesController(PREFERENCES_STATE_MOCK)
            .build(),
          title: this.test.fullTitle(),
        },
        async ({ driver }) => {
          await logInWithBalanceValidation(driver);

          await openActionMenuAndStartSendFlow(driver);

          await driver.fill(
            'input[placeholder="Enter public address (0x) or domain name"]',
            '0x2f318C334780961FB129D2a6c30D0763d9a5C970',
          );

          await driver.fill('input[placeholder="0"]', '1');

          await driver.clickElement({ css: 'button', text: 'Continue' });

          // Check that the gas estimation is what we expect
          await driver.findElement({
            css: '[data-testid="first-gas-field"]',
            text: '0',
          });

          await driver.waitForSelector({
            css: '[data-testid="native-currency"]',
            text: '$0.75',
          });
        },
      );
    });

    it('show expected gas defaults when API is down', async function () {
      await withFixtures(
        {
          fixtures: new FixtureBuilder()
            .withPreferencesController(PREFERENCES_STATE_MOCK)
            .build(),
          testSpecificMock: (mockServer) => {
            mockServer
              .forGet(`${GAS_API_BASE_URL}/networks/1337/suggestedGasFees`)
              .thenCallback(() => {
                return {
                  json: {
                    error: 'cannot get gas prices for chain id 1337',
                  },
                  statusCode: 503,
                };
              });
          },
          title: this.test.fullTitle(),
        },
        async ({ driver }) => {
          await logInWithBalanceValidation(driver);

          await openActionMenuAndStartSendFlow(driver);

          await driver.fill(
            'input[placeholder="Enter public address (0x) or domain name"]',
            '0x2f318C334780961FB129D2a6c30D0763d9a5C970',
          );

          await driver.fill('input[placeholder="0"]', '1');

          await driver.clickElement({ css: 'button', text: 'Continue' });

          // Check that the gas estimation is what we expect
          await driver.findElement({
            css: '[data-testid="first-gas-field"]',
            text: '0',
          });
          await driver.waitForSelector({
            css: '[data-testid="native-currency"]',
            text: '$0.75',
          });
        },
      );
    });

    it('show expected gas defaults when the network is not supported', async function () {
      await withFixtures(
        {
          fixtures: new FixtureBuilder()
            .withPreferencesController(PREFERENCES_STATE_MOCK)
            .build(),
          testSpecificMock: (mockServer) => {
            mockServer
              .forGet(`${GAS_API_BASE_URL}/networks/1337/suggestedGasFees`)
              .thenCallback(() => {
                return {
                  statusCode: 422,
                };
              });
          },
          title: this.test.fullTitle(),
        },
        async ({ driver }) => {
          await logInWithBalanceValidation(driver);

          await openActionMenuAndStartSendFlow(driver);

          await driver.fill(
            'input[placeholder="Enter public address (0x) or domain name"]',
            '0x2f318C334780961FB129D2a6c30D0763d9a5C970',
          );

          await driver.fill('input[placeholder="0"]', '1');

          await driver.clickElement({ css: 'button', text: 'Continue' });

          // Check that the gas estimation is what we expect
          await driver.findElement({
            css: '[data-testid="first-gas-field"]',
            text: '0',
          });
          await driver.waitForSelector({
            css: '[data-testid="native-currency"]',
            text: '$0.75',
          });
        },
      );
    });
  });

  describe('Send on a network that is not EIP-1559 compatible', function () {
    it('show expected gas defaults on a network supported by legacy gas API', async function () {
      await withFixtures(
        {
          fixtures: new FixtureBuilder()
            .withPreferencesController(PREFERENCES_STATE_MOCK)
            .withNetworkControllerOnBnb()
            .withEnabledNetworks({
              eip155: {
                '0x38': true,
              },
            })
            .build(),
          localNodeOptions: {
            hardfork: 'berlin',
            chainId: parseInt(CHAIN_IDS.BSC, 16),
          },
          testSpecificMock: mockBinanceRelatedRequestsWithGasApiAvailable,
          title: this.test.fullTitle(),
        },
        async ({ driver }) => {
          await logInWithBalanceValidation(driver);

          await openActionMenuAndStartSendFlow(driver);
          await driver.fill(
            'input[placeholder="Enter public address (0x) or domain name"]',
            '0x2f318C334780961FB129D2a6c30D0763d9a5C970',
          );

          await driver.fill('input[placeholder="0"]', '1');

          await driver.clickElement({ css: 'button', text: 'Continue' });

          // Check that the gas estimation is what we expect
          await driver.findElement({
            css: '[data-testid="first-gas-field"]',
            text: '0',
          });
          await driver.waitForSelector({
            css: '[data-testid="native-currency"]',
            text: '$0.01',
          });
        },
      );
    });

    it('show expected gas defaults on a network supported by legacy gas API when that API is down', async function () {
      await withFixtures(
        {
          fixtures: new FixtureBuilder()
            .withPreferencesController(PREFERENCES_STATE_MOCK)
            .withNetworkControllerOnBnb()
            .withEnabledNetworks({
              eip155: {
                '0x38': true,
              },
            })
            .build(),
          localNodeOptions: {
            hardfork: 'berlin',
            chainId: parseInt(CHAIN_IDS.BSC, 16),
          },
          testSpecificMock: mockBinanceRelatedRequestsWithGasApiDown,
          title: this.test.fullTitle(),
        },
        async ({ driver }) => {
          await logInWithBalanceValidation(driver);

          await openActionMenuAndStartSendFlow(driver);
          await driver.fill(
            'input[placeholder="Enter public address (0x) or domain name"]',
            '0x2f318C334780961FB129D2a6c30D0763d9a5C970',
          );

          await driver.fill('input[placeholder="0"]', '1');

          await driver.clickElement({ css: 'button', text: 'Continue' });

          // Check that the gas estimation is what we expect
          await driver.findElement({
            css: '[data-testid="first-gas-field"]',
            text: '0',
          });
          await driver.waitForSelector({
            css: '[data-testid="native-currency"]',
            text: '$0.01',
          });
        },
      );
    });

    it('show expected gas defaults on a network not supported by legacy gas API', async function () {
      await withFixtures(
        {
          fixtures: new FixtureBuilder()
            .withPreferencesController(PREFERENCES_STATE_MOCK)
            .build(),
          localNodeOptions: { hardfork: 'berlin' },
          title: this.test.fullTitle(),
        },
        async ({ driver }) => {
          await logInWithBalanceValidation(driver);

          await openActionMenuAndStartSendFlow(driver);
          await driver.fill(
            'input[placeholder="Enter public address (0x) or domain name"]',
            '0x2f318C334780961FB129D2a6c30D0763d9a5C970',
          );

          await driver.fill('input[placeholder="0"]', '1');

          await driver.clickElement({ css: 'button', text: 'Continue' });

          // Check that the gas estimation is what we expect
          await driver.findElement({
            css: '[data-testid="first-gas-field"]',
            text: '0',
          });
          await driver.waitForSelector({
            css: '[data-testid="native-currency"]',
            text: '$0.07',
          });
        },
      );
    });
  });
});
