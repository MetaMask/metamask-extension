import { Suite } from 'mocha';
import { Mockttp } from 'mockttp';
import { Driver } from '../../webdriver/driver';
import { DAPP_PATH, WINDOW_TITLES } from '../../constants';
import { withFixtures } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import SnapSimpleKeyringPage from '../../page-objects/pages/snap-simple-keyring-page';
import TestDapp from '../../page-objects/pages/test-dapp';
import { installSnapSimpleKeyring } from '../../page-objects/flows/snap-simple-keyring.flow';
import { login } from '../../page-objects/flows/login.flow';
import { connectAccountToTestDapp } from '../../page-objects/flows/test-dapp.flow';
import {
  personalSignWithSnapAccount,
  signPermitWithSnapAccount,
  signTypedDataV3WithSnapAccount,
  signTypedDataV4WithSnapAccount,
  signTypedDataWithSnapAccount,
} from '../../page-objects/flows/sign.flow';
import {
  mockSnapSimpleKeyringAndSite,
  SNAP_SIMPLE_KEYRING_E2E_MANIFEST_FLAGS,
} from './snap-keyring-site-mocks';

describe('Snap Account Signatures', function (this: Suite) {
  this.timeout(500000); // This test is very long, so we need an unusually high timeout
  // Run sync, async approve, and async reject flows
  // (in Jest we could do this with test.each, but that does not exist here)

  ['sync', 'approve', 'reject'].forEach((flowType) => {
    // generate title of the test from flowType
    const title = `can sign with ${flowType} flow`;

    it(title, async function () {
      await withFixtures(
        {
          dappOptions: {
            numberOfTestDapps: 1,
            customDappPaths: [DAPP_PATH.SNAP_SIMPLE_KEYRING_SITE],
          },
          fixtures: new FixtureBuilderV2()
            .withSnapsPrivacyWarningAlreadyShown()
            .build(),
          manifestFlags: SNAP_SIMPLE_KEYRING_E2E_MANIFEST_FLAGS,
          testSpecificMock: (mockServer: Mockttp) =>
            mockSnapSimpleKeyringAndSite(mockServer, 8081),
          title,
        },
        async ({ driver }: { driver: Driver }) => {
          const isSyncFlow = flowType === 'sync';
          const approveTransaction = flowType === 'approve';
          await login(driver);
          await installSnapSimpleKeyring(driver, isSyncFlow);
          const snapSimpleKeyringPage = new SnapSimpleKeyringPage(driver);
          const newPublicKey = await snapSimpleKeyringPage.createNewAccount();

          await driver.switchToWindowWithTitle(
            WINDOW_TITLES.ExtensionInFullScreenView,
          );
          const headerNavbar = new HeaderNavbar(driver);
          // BUG #37591 - With BIP44 the account name is not retained.
          await headerNavbar.checkAccountLabel('Snap Account 1');

          // Connect the SSK account
          const testDapp = new TestDapp(driver);
          await testDapp.openTestDappPage();
          await connectAccountToTestDapp(driver, {
            publicAddress: newPublicKey,
          });

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

          await driver.waitUntilXWindowHandles(7, 1000, 10000);
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
