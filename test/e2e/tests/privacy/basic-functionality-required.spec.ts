/**
 * E2E tests for the "Basic functionality off" flow.
 * When useExternalServices is off, protected routes (e.g. swap, rewards)
 * redirect to /basic-functionality-off. The page shows an inline Basic functionality
 * toggle, "Open the [feature] page" (when coming from a protected route), and
 * "Go to the home page".
 */
import { strict as assert } from 'assert';
import { withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixtures/fixture-builder';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import BasicFunctionalityOffPage from '../../page-objects/pages/basic-functionality-off-page';
import HomePage from '../../page-objects/pages/home/homepage';
import { Driver } from '../../webdriver/driver';

const SWAP_URL_PATH = '/cross-chain/swaps/prepare-bridge-page';
const BASIC_FUNCTIONALITY_OFF_PATH = '/basic-functionality-off';

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

        await driver.openNewURL(
          `${driver.extensionUrl}/home.html#${SWAP_URL_PATH}?swaps=true`,
        );

        await driver.waitForUrl({
          url: `${driver.extensionUrl}/home.html#${BASIC_FUNCTIONALITY_OFF_PATH}`,
        });

        const basicFunctionalityOffPage = new BasicFunctionalityOffPage(driver);
        await basicFunctionalityOffPage.checkPageIsLoaded();

        const descriptionText =
          await basicFunctionalityOffPage.getDescriptionText();
        const normalizedDescription = descriptionText
          .replace(/\s+/gu, ' ')
          .trim();
        assert.strictEqual(
          normalizedDescription,
          "This feature isn't available while basic functionality is turned off. Use the toggle below to turn it on.",
          'Description should match the expected copy',
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

        await driver.openNewURL(
          `${driver.extensionUrl}/home.html#${SWAP_URL_PATH}?swaps=true`,
        );
        await driver.waitForUrl({
          url: `${driver.extensionUrl}/home.html#${BASIC_FUNCTIONALITY_OFF_PATH}`,
        });

        const basicFunctionalityOffPage = new BasicFunctionalityOffPage(driver);
        await basicFunctionalityOffPage.checkPageIsLoaded();
        await basicFunctionalityOffPage.clickGoToHomePage();

        await homePage.checkPageIsLoaded();
      },
    );
  });

  it('navigates to destination when turning on Basic functionality via inline toggle and clicking Open the feature page', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withUseBasicFunctionalityDisabled()
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);

        await driver.openNewURL(
          `${driver.extensionUrl}/home.html#${SWAP_URL_PATH}?swaps=true`,
        );
        await driver.waitForUrl({
          url: `${driver.extensionUrl}/home.html#${BASIC_FUNCTIONALITY_OFF_PATH}`,
        });

        const basicFunctionalityOffPage = new BasicFunctionalityOffPage(driver);
        await basicFunctionalityOffPage.checkPageIsLoaded();

        const openFeatureDisabledBeforeToggle =
          await basicFunctionalityOffPage.isOpenFeaturePageButtonDisabled();
        assert.ok(
          openFeatureDisabledBeforeToggle,
          'Open the feature page button should be disabled when Basic functionality is off',
        );

        await basicFunctionalityOffPage.toggleBasicFunctionality();
        await basicFunctionalityOffPage.waitForOpenFeaturePageButtonEnabled();
        await basicFunctionalityOffPage.clickOpenFeaturePage();

        await driver.waitForUrl({
          url: `${driver.extensionUrl}/home.html#${SWAP_URL_PATH}`,
        });
      },
    );
  });
});
