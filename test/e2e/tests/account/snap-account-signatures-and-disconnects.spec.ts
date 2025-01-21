import { Suite } from 'mocha';
import { Driver } from '../../webdriver/driver';
import { WINDOW_TITLES, withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import ExperimentalSettings from '../../page-objects/pages/settings/experimental-settings';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import SettingsPage from '../../page-objects/pages/settings/settings-page';
import SnapSimpleKeyringPage from '../../page-objects/pages/snap-simple-keyring-page';
import TestDapp from '../../page-objects/pages/test-dapp';
import { installSnapSimpleKeyring } from '../../page-objects/flows/snap-simple-keyring.flow';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import {
  signTypedDataV3WithSnapAccount,
  signTypedDataV4WithSnapAccount,
} from '../../page-objects/flows/sign.flow';

describe('Snap Account Signatures and Disconnects @no-mmi', function (this: Suite) {
  it('can connect to the Test Dapp, then #signTypedDataV3, disconnect then connect, then #signTypedDataV4 (async flow approve)', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);
        await installSnapSimpleKeyring(driver, false);
        const snapSimpleKeyringPage = new SnapSimpleKeyringPage(driver);
        const newPublicKey = await snapSimpleKeyringPage.createNewAccount();

        // Check snap account is displayed after adding the snap account.
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.check_accountLabel('SSK Account');

        // Navigate to experimental settings and disable redesigned signature.
        await headerNavbar.openSettingsPage();
        const settingsPage = new SettingsPage(driver);
        await settingsPage.check_pageIsLoaded();
        await settingsPage.goToExperimentalSettings();

        const experimentalSettings = new ExperimentalSettings(driver);
        await experimentalSettings.check_pageIsLoaded();
        await experimentalSettings.toggleRedesignedSignature();

        // Open the Test Dapp and connect
        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();
        await testDapp.connectAccount({ publicAddress: newPublicKey });

        // SignedTypedDataV3 with Test Dapp
        await signTypedDataV3WithSnapAccount(driver, newPublicKey, false, true);

        // Disconnect from Test Dapp and reconnect to Test Dapp
        await testDapp.disconnectAccount(newPublicKey);
        await testDapp.connectAccount({
          publicAddress: newPublicKey,
        });

        // SignTypedDataV4 with Test Dapp
        await signTypedDataV4WithSnapAccount(driver, newPublicKey, false, true);
      },
    );
  });
});
