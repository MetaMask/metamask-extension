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
 * See `test/e2e/helpers/custom-network-harness.ts`.
 */

import { Driver } from '../../webdriver/driver';
import { withFixtures } from '../../helpers';
import { prepareCustomNetwork } from '../../helpers/custom-network-harness';
import LoginPage from '../../page-objects/pages/onboarding/login-page';
import HomePage from '../../page-objects/pages/home/homepage';
import TokensTab from '../../page-objects/pages/home/tokens-tab';

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
        // CurrencyRateController logs this when /v1/exchange-rates has no HYPE
        // key; the UI is expected to degrade gracefully despite the console error.
        ignoredConsoleErrors: [
          'None of the cryptocurrencies are supported by price api',
          'Failed to fetch exchange rates',
        ],
      },
      async ({ driver }: { driver: Driver }) => {
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

        // Prove the unsupported-price path was hit: fiat secondary value is the
        // em-dash placeholder, not a recovered rate from spot-prices fallback.
        await tokensTab.checkNoConversionRateDisplayed();

        await homePage.checkNoBlockingErrorToastWasObserved();
      },
    );
  });
});
