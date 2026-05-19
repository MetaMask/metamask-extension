import { Suite } from 'mocha';

import { DAPP_URL, NETWORK_CLIENT_ID, WINDOW_TITLES } from '../../constants';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { withFixtures } from '../../helpers';
import { login } from '../../page-objects/flows/login.flow';
import Confirmation from '../../page-objects/pages/confirmations/confirmation';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import PrivacySettings from '../../page-objects/pages/settings/privacy-settings';
import SettingsPage from '../../page-objects/pages/settings/settings-page';
import TestDapp from '../../page-objects/pages/test-dapp';

describe('PPOM Settings', function (this: Suite) {
  // eslint-disable-next-line mocha/no-skipped-tests, mocha/handle-done-callback
  it.skip('should not show the PPOM warning when toggle is off', async function () {
    await withFixtures(
      {
        dappOptions: { numberOfTestDapps: 1 },
        fixtures: new FixtureBuilderV2()
          .withSelectedNetwork(NETWORK_CLIENT_ID.MAINNET)
          .withEnabledNetworks({ eip155: { '0x1': true } })
          .withPermissionControllerConnectedToTestDapp({ chainIds: [1] })
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await login(driver);

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
        await confirmation.checkPageIsLoaded();
        await confirmation.checkSecurityProviderBannerAlertIsNotPresent();
      },
    );
  });

  // eslint-disable-next-line mocha/no-skipped-tests, mocha/handle-done-callback
  it.skip('should show the PPOM warning when the toggle is on', async function () {
    await withFixtures(
      {
        dappOptions: { numberOfTestDapps: 1 },
        fixtures: new FixtureBuilderV2()
          .withSelectedNetwork(NETWORK_CLIENT_ID.MAINNET)
          .withEnabledNetworks({ eip155: { '0x1': true } })
          .withPermissionControllerConnectedToTestDapp({ chainIds: [1] })
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await login(driver);

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
