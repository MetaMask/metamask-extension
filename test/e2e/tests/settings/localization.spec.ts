import { withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import { Mockttp } from '../../mock-e2e';
import HomePage from '../../page-objects/pages/home/homepage';
import { loginWithoutBalanceValidation } from '../../page-objects/flows/login.flow';

async function mockPhpConversion(mockServer: Mockttp) {
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
        testSpecificMock: mockPhpConversion,
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await loginWithoutBalanceValidation(driver);

        // After the removal of displaying secondary currency in coin-overview.tsx, we will test localization on main balance with showNativeTokenAsMainBalance = false
        await new HomePage(driver).checkExpectedBalanceIsDisplayed(
          'PHP',
          '₱2,500,000.00',
        );
      },
    );
  });
});
