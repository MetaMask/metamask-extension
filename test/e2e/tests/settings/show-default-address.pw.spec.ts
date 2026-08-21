import { test as pwTest } from '@playwright/test';
import { E2E_DRIVER } from '../../constants';
import { withFixtures } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import PreferencesAndDisplaySettings from '../../page-objects/pages/settings/preferences-and-display-settings';
import HomePage from '../../page-objects/pages/home/homepage';
import { login } from '../../page-objects/flows/login.flow';
import { closeSettings } from '../../page-objects/flows/settings.flow';

const SHOW_DEFAULT_ADDRESS_FLAG = {
  remoteFeatureFlags: { extensionUxDefaultAddressVersioned: true },
};

pwTest.describe('Show default address', () => {
  pwTest(
    'displays Show default address section on General settings',
    async (
      // eslint-disable-next-line no-empty-pattern
      {},
      testInfo,
    ) => {
      await withFixtures(
        {
          fixtures: new FixtureBuilderV2().build(),
          driverType: E2E_DRIVER.PLAYWRIGHT,
          title: testInfo.titlePath.join(' '),
          manifestFlags: SHOW_DEFAULT_ADDRESS_FLAG,
        },
        async ({ driver }) => {
          await login(driver);

          // Navigate to settings and check "show default address" section is displayed
          const homePage = new HomePage(driver);
          await homePage.headerNavbar.openSettingsPage();
          const preferencesAndDisplaySettings =
            new PreferencesAndDisplaySettings(driver);
          await preferencesAndDisplaySettings.checkPageIsLoaded();
          await preferencesAndDisplaySettings.checkShowDefaultAddressSectionIsDisplayed();
        },
      );
    },
  );

  pwTest(
    'displays default address in header on homepage by default',
    async (
      // eslint-disable-next-line no-empty-pattern
      {},
      testInfo,
    ) => {
      await withFixtures(
        {
          fixtures: new FixtureBuilderV2().build(),
          driverType: E2E_DRIVER.PLAYWRIGHT,
          title: testInfo.titlePath.join(' '),
          manifestFlags: SHOW_DEFAULT_ADDRESS_FLAG,
        },
        async ({ driver }) => {
          await login(driver);

          // Check on home page that default address is present by default
          const homePage = new HomePage(driver);
          await homePage.checkPageIsLoaded();
          await homePage.checkDefaultAddressIsDisplayed();
        },
      );
    },
  );

  pwTest(
    'hides default address in header on homepage when toggle is off',
    async (
      // eslint-disable-next-line no-empty-pattern
      {},
      testInfo,
    ) => {
      await withFixtures(
        {
          fixtures: new FixtureBuilderV2().build(),
          driverType: E2E_DRIVER.PLAYWRIGHT,
          title: testInfo.titlePath.join(' '),
          manifestFlags: SHOW_DEFAULT_ADDRESS_FLAG,
        },
        async ({ driver }) => {
          await login(driver);

          // Navigate to settings and toggle off "show default address" feature
          const homePage = new HomePage(driver);
          await homePage.headerNavbar.openSettingsPage();
          const preferencesAndDisplaySettings =
            new PreferencesAndDisplaySettings(driver);
          await preferencesAndDisplaySettings.checkPageIsLoaded();
          await preferencesAndDisplaySettings.toggleShowDefaultAddress();
          await closeSettings(driver);

          // Check on home page that default address is not present
          await homePage.checkPageIsLoaded();
          await homePage.checkDefaultAddressIsNotDisplayed();
        },
      );
    },
  );
});
