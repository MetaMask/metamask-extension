import { Suite } from 'mocha';
import { Driver } from '../../webdriver/driver';
import { WINDOW_TITLES, withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import SnapSimpleKeyringPage from '../../page-objects/pages/snap-simple-keyring-page';
import TestDapp from '../../page-objects/pages/test-dapp';
import { installSnapSimpleKeyring } from '../../page-objects/flows/snap-simple-keyring.flow';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import {
  signTypedDataV3WithSnapAccount,
  signTypedDataV4WithSnapAccount,
} from '../../page-objects/flows/sign.flow';
import { mockSimpleKeyringSnap } from '../../mock-response-data/snaps/snap-binary-mocks';

describe('Snap Account Signatures and Disconnects', function (this: Suite) {
  it('can connect to the Test Dapp, then #signTypedDataV3, disconnect then connect, then #signTypedDataV4 (async flow approve)', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder().build(),
        testSpecificMock: mockSimpleKeyringSnap,
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
        await headerNavbar.checkAccountLabel('SSK Account');

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
