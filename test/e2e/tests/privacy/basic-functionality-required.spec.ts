/**
 * E2E tests for the "Basic functionality off" flow.
 * When useExternalServices is off, protected routes (e.g. swap, rewards)
 * redirect to /basic-functionality-off. The page shows an inline Basic functionality
 * toggle, "Open the [feature] page" (when coming from a protected route), and
 * "Go to the home page".
 */
import { withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixtures/fixture-builder';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import { openSwapsPageAndWaitForRedirectToBasicFunctionalityOffPage } from '../../page-objects/flows/basic-functionality-off.flow';
import BasicFunctionalityOffPage from '../../page-objects/pages/basic-functionality-off-page';
import HomePage from '../../page-objects/pages/home/homepage';
import { Driver } from '../../webdriver/driver';
import { SWAP_PATH } from '../../../../ui/helpers/constants/routes';

describe('Basic functionality off', function () {
  it('redirects to basic-functionality-off when opening a protected route with Basic functionality off', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withUseBasicFunctionalityDisabled()
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);

        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();

        await openSwapsPageAndWaitForRedirectToBasicFunctionalityOffPage(
          driver,
        );
        const basicFunctionalityOffPage = new BasicFunctionalityOffPage(driver);
        await basicFunctionalityOffPage.checkPageIsLoaded();

        const expectedDescription =
          "This feature isn't available while basic functionality is turned off. Use the toggle below to turn it on.";
        await basicFunctionalityOffPage.waitForDescriptionWithText(
          expectedDescription,
        );
      },
    );
  });

  it('navigates to home when clicking Go to the home page', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withUseBasicFunctionalityDisabled()
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);

        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();

        await openSwapsPageAndWaitForRedirectToBasicFunctionalityOffPage(
          driver,
        );
        const basicFunctionalityOffPage = new BasicFunctionalityOffPage(driver);
        await basicFunctionalityOffPage.checkPageIsLoaded();
        await basicFunctionalityOffPage.clickGoToHomePage();

        await homePage.checkPageIsLoaded();
      },
    );
  });

  it('navigates to swap route after enabling Basic functionality via inline toggle then opening feature', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withUseBasicFunctionalityDisabled()
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);

        await openSwapsPageAndWaitForRedirectToBasicFunctionalityOffPage(
          driver,
        );
        const basicFunctionalityOffPage = new BasicFunctionalityOffPage(driver);
        await basicFunctionalityOffPage.checkPageIsLoaded();

        await basicFunctionalityOffPage.checkOpenFeaturePageButtonIsDisabled();

        await basicFunctionalityOffPage.toggleBasicFunctionality();
        await basicFunctionalityOffPage.waitForOpenFeaturePageButtonEnabled();
        await basicFunctionalityOffPage.clickOpenFeaturePage();

        await driver.waitForUrl({
          url: `${driver.extensionUrl}/home.html#${SWAP_PATH}?swaps=true`,
        });
      },
    );
  });
});
