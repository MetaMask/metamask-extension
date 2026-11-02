/**
 * HyperEVM unsupported crypto handling - graceful degradation.
 *
 * Assets-unify deprecates CurrencyRateController in tests, so native prices
 * come from `/v3/spot-prices` rather than `/v1/exchange-rates`. The
 * `unsupportedPrice` catalog answers the HYPE spot-prices request with an
 * empty body. The UI should still load the homepage and Tokens tab, render
 * HYPE, and show the em-dash fiat placeholder.
 *
 * An em dash also shows when no price request runs, so the spec fails unless
 * the spot-prices mock was hit for the HyperEVM native asset id.
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

function isSpotPriceRequestForAsset(url: string, assetId: string): boolean {
  try {
    const parsed = new URL(url);
    if (
      parsed.hostname !== 'price.api.cx.metamask.io' ||
      parsed.pathname !== '/v3/spot-prices'
    ) {
      return false;
    }
    const assetIds = parsed.searchParams
      .getAll('assetIds')
      .flatMap((value) => value.split(','))
      .filter(Boolean);
    return assetIds.includes(assetId);
  } catch {
    return false;
  }
}

async function spotPriceMockWasHitForAsset(
  mockedEndpoints: MockedEndpoint[],
  assetId: string,
): Promise<boolean> {
  const seenGroups = await Promise.all(
    mockedEndpoints.map((endpoint) => endpoint.getSeenRequests()),
  );
  return seenGroups.some((requests) =>
    requests.some((request) =>
      isSpotPriceRequestForAsset(request.url, assetId),
    ),
  );
}

describe('HyperEVM unsupported crypto handling', function () {
  it('renders HYPE with an em-dash fiat value when the spot price is unsupported', async function () {
    const { fixtures, localNodeOptions, testSpecificMock, network } =
      prepareCustomNetwork('hyperevm', 'unsupportedPrice');

    await withFixtures(
      {
        fixtures,
        localNodeOptions,
        testSpecificMock,
        title: this.test?.fullTitle(),
        // CurrencyRateController used to log these when HYPE was missing from
        // exchange-rates. They are allowed if a leftover path still emits them.
        ignoredConsoleErrors: [
          'None of the cryptocurrencies are supported by price api',
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
        await driver.navigate();
        const loginPage = new LoginPage(driver);
        await loginPage.checkPageIsLoaded();

        const homePage = new HomePage(driver);
        const tokensTab = new TokensTab(driver);

        await loginPage.loginToHomepage();

        await homePage.checkPageIsLoaded();
        await tokensTab.checkTokenListIsDisplayed();
        await tokensTab.checkTokenExistsInList(network.nativeSymbol);
        await tokensTab.checkNoConversionRateDisplayed();

        try {
          await driver.wait(() =>
            spotPriceMockWasHitForAsset(mockedEndpoint, network.nativeAssetId),
          );
        } catch (error) {
          const reason = error instanceof Error ? error.message : String(error);
          throw new Error(
            `spot-prices mock was never hit for ${network.nativeAssetId} ` +
              `(${reason})`,
          );
        }
      },
    );
  });
});
