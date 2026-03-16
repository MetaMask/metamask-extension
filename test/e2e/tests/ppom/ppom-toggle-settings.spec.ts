import { Suite } from 'mocha';
import { withFixtures } from '../../helpers';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import { DAPP_URL, WINDOW_TITLES } from '../../constants';
import FixtureBuilder from '../../fixtures/fixture-builder';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import SettingsPage from '../../page-objects/pages/settings/settings-page';
import PrivacySettings from '../../page-objects/pages/settings/privacy-settings';
import TestDapp from '../../page-objects/pages/test-dapp';
import Confirmation from '../../page-objects/pages/confirmations/confirmation';

describe('PPOM Settings', function (this: Suite) {
  // eslint-disable-next-line mocha/no-skipped-tests, mocha/handle-done-callback
  it.skip('should not show the PPOM warning when toggle is off', async function () {
    await withFixtures(
      {
        dappOptions: { numberOfTestDapps: 1 },
        fixtures: new FixtureBuilder()
          .withNetworkControllerOnMainnet()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);

        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.openSettingsPage();

        const settingsPage = new SettingsPage(driver);
        await settingsPage.checkPageIsLoaded();
        await settingsPage.goToPrivacySettings();

        const privacySettings = new PrivacySettings(driver);
        await privacySettings.checkPageIsLoaded();
        await privacySettings.toggleBlockaidAlerts();

        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage({ url: DAPP_URL });
        await testDapp.clickMaliciousPermitButton();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        const confirmation = new Confirmation(driver);
        await confirmation.checkSecurityProviderBannerAlertIsPresent();
      },
    );
  });

  // eslint-disable-next-line mocha/no-skipped-tests, mocha/handle-done-callback
  it.skip('should show the PPOM warning when the toggle is on', async function () {
    await withFixtures(
      {
        dappOptions: { numberOfTestDapps: 1 },
        fixtures: new FixtureBuilder()
          .withNetworkControllerOnMainnet()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);

        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage({ url: DAPP_URL });
        await testDapp.clickMaliciousPermitButton();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        const confirmation = new Confirmation(driver);
        await confirmation.checkSecurityProviderBannerAlertIsPresent();
      },
    );
  });
});
