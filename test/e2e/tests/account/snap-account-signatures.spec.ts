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
  personalSignWithSnapAccount,
  signPermitWithSnapAccount,
  signTypedDataV3WithSnapAccount,
  signTypedDataV4WithSnapAccount,
  signTypedDataWithSnapAccount,
} from '../../page-objects/flows/sign.flow';

describe('Snap Account Signatures @no-mmi', function (this: Suite) {
  this.timeout(200000); // This test is very long, so we need an unusually high timeout
  // Run sync, async approve, and async reject flows
  // (in Jest we could do this with test.each, but that does not exist here)

  ['sync', 'approve', 'reject'].forEach((flowType) => {
    // generate title of the test from flowType
    const title = `can sign with ${flowType} flow`;

    it(title, async () => {
      await withFixtures(
        {
          dapp: true,
          fixtures: new FixtureBuilder().build(),
          title,
        },
        async ({ driver }: { driver: Driver }) => {
          const isSyncFlow = flowType === 'sync';
          const approveTransaction = flowType === 'approve';
          await loginWithBalanceValidation(driver);
          await installSnapSimpleKeyring(driver, isSyncFlow);
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

          // Connect the SSK account
          const testDapp = new TestDapp(driver);
          await testDapp.openTestDappPage();
          await testDapp.connectAccount({ publicAddress: newPublicKey });

          // Run all 5 signature types
          await personalSignWithSnapAccount(
            driver,
            newPublicKey,
            isSyncFlow,
            approveTransaction,
          );
          await signTypedDataWithSnapAccount(
            driver,
            newPublicKey,
            isSyncFlow,
            approveTransaction,
          );
          await signTypedDataV3WithSnapAccount(
            driver,
            newPublicKey,
            isSyncFlow,
            approveTransaction,
          );
          await signTypedDataV4WithSnapAccount(
            driver,
            newPublicKey,
            isSyncFlow,
            approveTransaction,
          );
          await signPermitWithSnapAccount(
            driver,
            newPublicKey,
            isSyncFlow,
            approveTransaction,
          );
        },
      );
    });
  });
});
