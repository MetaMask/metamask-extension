/**
 * HyperEVM unsupported crypto handling - graceful degradation.
 *
 * Monitors the regression where selecting HyperEVM hits the price API
 * "None of the cryptocurrencies are supported by price api" failure path
 * (native HYPE is missing from `/v1/exchange-rates`, and spot-prices has no
 * fallback rate). The UI should handle this gracefully: homepage and Tokens
 * tab still load, HYPE still renders, fiat shows the em-dash placeholder, and
 * no blocking error toast appears.
 *
 * An em dash also shows when spot prices are empty, so the spec fails unless
 * that price-api error was logged and the exchange-rates mock was hit.
 *
 * See `test/e2e/helpers/custom-network-harness.ts`.
 */

import { MockedEndpoint } from 'mockttp';
import { Driver } from '../../webdriver/driver';
import { withFixtures } from '../../helpers';
import { prepareCustomNetwork } from '../../helpers/custom-network-harness';
import LoginPage from '../../page-objects/pages/onboarding/login-page';
import HomePage from '../../page-objects/pages/home/homepage';
import TokensTab from '../../page-objects/pages/home/tokens-tab';

const UNSUPPORTED_PRICE_CONSOLE_ERROR =
  'None of the cryptocurrencies are supported by price api';

function isExchangeRatesRequest(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.hostname === 'price.api.cx.metamask.io' &&
      parsed.pathname === '/v1/exchange-rates'
    );
  } catch {
    return false;
  }
}

async function exchangeRatesMockWasHit(
  mockedEndpoints: MockedEndpoint[],
): Promise<boolean> {
  const seenGroups = await Promise.all(
    mockedEndpoints.map((endpoint) => endpoint.getSeenRequests()),
  );
  return seenGroups.some((requests) =>
    requests.some((request) => isExchangeRatesRequest(request.url)),
  );
}

describe('HyperEVM unsupported crypto handling', function () {
  it('does not show a blocking error toast when price API is unsupported', async function () {
    const { fixtures, localNodeOptions, testSpecificMock, network } =
      prepareCustomNetwork('hyperevm', 'unsupportedPrice');

    await withFixtures(
      {
        fixtures,
        localNodeOptions,
        testSpecificMock,
        title: this.test?.fullTitle(),
        // Allowed, not required. Chrome still fails below when the
        // unsupported-crypto message was never logged.
        ignoredConsoleErrors: [
          UNSUPPORTED_PRICE_CONSOLE_ERROR,
          'Failed to fetch exchange rates',
        ],
      },
      async ({
        driver,
        mockedEndpoint,
      }: {
        driver: Driver;
        mockedEndpoint: MockedEndpoint[];
      }) => {
        // Background console.error is invisible to the page listener until
        // the service worker target is enabled. Polling starts after unlock.
        if (process.env.SELENIUM_BROWSER === 'chrome') {
          await driver.startObservingServiceWorkerConsoleErrors();
        }

        await driver.navigate();
        const loginPage = new LoginPage(driver);
        await loginPage.checkPageIsLoaded();

        const homePage = new HomePage(driver);
        const tokensTab = new TokensTab(driver);

        // Watch for auto-dismissing toasts before homepage waits can hide them.
        await homePage.startMonitoringBlockingErrorToast();
        await loginPage.loginToHomepage();
        await homePage.startMonitoringBlockingErrorToast();

        await homePage.checkPageIsLoaded();
        await tokensTab.checkTokenListIsDisplayed();
        await tokensTab.checkTokenExistsInList(network.nativeSymbol);

        // An em dash also shows when spot prices are empty, so it does not
        // prove the exchange-rates error path ran.
        await tokensTab.checkNoConversionRateDisplayed();

        try {
          await driver.wait(() => exchangeRatesMockWasHit(mockedEndpoint));
        } catch (error) {
          const reason = error instanceof Error ? error.message : String(error);
          throw new Error(`exchange-rates mock was never hit (${reason})`);
        }

        // ignoredConsoleErrors is only applied on Chrome, which is also the
        // only browser whose console stream this driver records.
        if (process.env.SELENIUM_BROWSER === 'chrome') {
          try {
            await driver.wait(async () =>
              driver.observedConsoleErrors.some((message) =>
                message.includes(UNSUPPORTED_PRICE_CONSOLE_ERROR),
              ),
            );
          } catch (error) {
            const reason =
              error instanceof Error ? error.message : String(error);
            throw new Error(
              `\`${UNSUPPORTED_PRICE_CONSOLE_ERROR}\` was not logged (${reason})`,
            );
          }
        }

        await homePage.checkNoBlockingErrorToastWasObserved();
      },
    );
  });
});
