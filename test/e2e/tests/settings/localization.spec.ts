import { withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixtures/fixture-builder';
import { Mockttp } from '../../mock-e2e';
import HomePage from '../../page-objects/pages/home/homepage';
import { loginWithoutBalanceValidation } from '../../page-objects/flows/login.flow';

async function mockPhpConversion(mockServer: Mockttp) {
  return [
    // Mock v1/exchange-rates for PHP
    await mockServer
      .forGet('https://price.api.cx.metamask.io/v1/exchange-rates')
      .withQuery({ baseCurrency: 'php' })
      .thenCallback(() => {
        return {
          statusCode: 200,
          json: {
            php: {
              name: 'Philippine Peso',
              ticker: 'php',
              value: 1,
              currencyType: 'fiat',
            },
            usd: {
              name: 'US Dollar',
              ticker: 'usd',
              value: 0.025, // 1 PHP = 0.025 USD (or 1 USD = 40 PHP)
              currencyType: 'fiat',
            },
          },
        };
      }),
    // Mock v1/exchange-rates for USD
    await mockServer
      .forGet('https://price.api.cx.metamask.io/v1/exchange-rates')
      .withQuery({ baseCurrency: 'usd' })
      .thenCallback(() => {
        return {
          statusCode: 200,
          json: {
            eth: {
              name: 'Ether',
              ticker: 'eth',
              value: 1,
              currencyType: 'crypto',
            },
            usd: {
              name: 'US Dollar',
              ticker: 'usd',
              value: 1,
              currencyType: 'fiat',
            },
          },
        };
      }),
    // Mock v3 spot-prices
    await mockServer
      .forGet('https://price.api.cx.metamask.io/v3/spot-prices')
      .thenCallback((request) => {
        const url = new URL(request.url);
        const vsCurrency = url.searchParams.get('vsCurrency');

        // Return PHP price if requesting PHP
        if (vsCurrency === 'php') {
          return {
            statusCode: 200,
            json: {
              'eip155:1/slip44:60': {
                id: 'ethereum',
                price: 100000, // 1 ETH = 100,000 PHP
                marketCap: 382623505141,
                pricePercentChange1d: 0,
              },
            },
          };
        }

        // Return USD price for any other currency
        return {
          statusCode: 200,
          json: {
            'eip155:1/slip44:60': {
              id: 'ethereum',
              price: 1,
              marketCap: 382623505141,
              pricePercentChange1d: 0,
            },
          },
        };
      }),
  ];
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
          .withEnabledNetworks({ eip155: { '0x1': true } })
          .build(),
        testSpecificMock: mockPhpConversion,
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await loginWithoutBalanceValidation(driver);

        // After the removal of displaying secondary currency in coin-overview.tsx, we will test localization on main balance with showNativeTokenAsMainBalance = false
        await new HomePage(driver).checkExpectedBalanceIsDisplayed(
          '₱2,500,000.00',
        );
      },
    );
  });
});
