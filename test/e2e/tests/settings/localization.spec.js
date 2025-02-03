const {
  defaultGanacheOptions,
  withFixtures,
  unlockWallet,
} = require('../../helpers');
const FixtureBuilder = require('../../fixture-builder');

async function mockPhpConversion(mockServer) {
  return await mockServer
    .forGet('https://min-api.cryptocompare.com/data/pricemulti')
    .withQuery({ fsyms: 'ETH', tsyms: 'php,USD' })
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: {
          ETH: {
            PHP: '100000',
            USD: '2500',
          },
        },
      };
    });
}

describe('Localization', function () {
  it('can correctly display Philippine peso symbol and code', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withCurrencyController({
            currentCurrency: 'php',
          })
          .withPreferencesController({
            preferences: {
              showFiatInTestnets: true,
              showNativeTokenAsMainBalance: false,
            },
          })
          .build(),
        ganacheOptions: defaultGanacheOptions,
        testSpecificMock: mockPhpConversion,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        // After the removal of displaying secondary currency in coin-overview.tsx, we will test localization on main balance with showNativeTokenAsMainBalance = false
        await driver.waitForSelector({
          tag: 'span',
          text: 'PHP',
        });

        await driver.waitForSelector({
          tag: 'span',
          text: '₱2,500,000.00',
        });
      },
    );
  });
});
