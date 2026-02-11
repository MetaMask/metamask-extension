/**
 * E2E tests for the "Basic functionality required" (feature-unavailable) flow.
 * When useExternalServices is off, protected routes (e.g. swap, notifications)
 * redirect to /feature-unavailable. Run `yarn build:test` before running these tests.
 */
import { strict as assert } from 'assert';
import { withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixtures/fixture-builder';
import { loginWithoutBalanceValidation } from '../../page-objects/flows/login.flow';
import BasicFunctionalityRequiredPage from '../../page-objects/pages/basic-functionality-required-page';
import HomePage from '../../page-objects/pages/home/homepage';
import { Driver } from '../../webdriver/driver';

describe('Basic functionality required', function () {
  it('redirects to feature-unavailable page when opening a protected route with Basic functionality off', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withUseBasicFunctionalityDisabled()
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithoutBalanceValidation(driver);

        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();

        await driver.openNewURL(
          `${driver.extensionUrl}/home.html#/cross-chain/swaps/prepare-bridge-page?swaps=true`,
        );

        await driver.waitForUrl({
          url: `${driver.extensionUrl}/home.html#/feature-unavailable`,
        });

        const basicFunctionalityRequiredPage =
          new BasicFunctionalityRequiredPage(driver);
        await basicFunctionalityRequiredPage.checkPageIsLoaded();

        const descriptionText =
          await basicFunctionalityRequiredPage.getDescriptionText();
        const normalizedDescription = descriptionText
          .replace(/\s+/gu, ' ')
          .trim();
        assert.strictEqual(
          normalizedDescription,
          "This feature isn't available while basic functionality is turned off. Turn it on in Settings > Security and privacy to continue.",
          'Description should exactly match the expected copy',
        );
      },
    );
  });

  it('navigates to home when clicking Back to home', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withUseBasicFunctionalityDisabled()
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithoutBalanceValidation(driver);

        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();

        await driver.openNewURL(
          `${driver.extensionUrl}/home.html#/cross-chain/swaps/prepare-bridge-page?swaps=true`,
        );
        await driver.waitForUrl({
          url: `${driver.extensionUrl}/home.html#/feature-unavailable`,
        });

        const basicFunctionalityRequiredPage =
          new BasicFunctionalityRequiredPage(driver);
        await basicFunctionalityRequiredPage.checkPageIsLoaded();
        await basicFunctionalityRequiredPage.clickGoToHomePage();

        await homePage.checkPageIsLoaded();
      },
    );
  });

  it('navigates to Security settings when clicking Open Settings', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withUseBasicFunctionalityDisabled()
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithoutBalanceValidation(driver);

        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();

        await driver.openNewURL(
          `${driver.extensionUrl}/home.html#/cross-chain/swaps/prepare-bridge-page?swaps=true`,
        );
        await driver.waitForUrl({
          url: `${driver.extensionUrl}/home.html#/feature-unavailable`,
        });

        const basicFunctionalityRequiredPage =
          new BasicFunctionalityRequiredPage(driver);
        await basicFunctionalityRequiredPage.checkPageIsLoaded();
        await basicFunctionalityRequiredPage.clickOpenSettings();

        await driver.waitForUrl({
          url: `${driver.extensionUrl}/home.html#/settings/security`,
        });
      },
    );
  });
});
