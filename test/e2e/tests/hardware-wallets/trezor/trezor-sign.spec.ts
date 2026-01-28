import { Suite } from 'mocha';
import { Driver } from '../../../webdriver/driver';
import FixtureBuilder from '../../../fixtures/fixture-builder';
import { withFixtures } from '../../../helpers';
import { WINDOW_TITLES } from '../../../constants';
import { KNOWN_PUBLIC_KEY_ADDRESSES } from '../../../../stub/keyring-bridge';
import TestDappPage from '../../../page-objects/pages/test-dapp';
import { loginWithoutBalanceValidation } from '../../../page-objects/flows/login.flow';
import { signTypedDataV4 } from '../../../page-objects/flows/sign.flow';
import Confirmation from '../../../page-objects/pages/confirmations/confirmation';

describe('Trezor Hardware Signatures', function (this: Suite) {
  it('personal sign', async function () {
    await withFixtures(
      {
        dappOptions: { numberOfTestDapps: 1 },
        fixtures: new FixtureBuilder()
          .withTrezorAccount()
          .withPermissionControllerConnectedToTestDapp({
            account: KNOWN_PUBLIC_KEY_ADDRESSES[0].address,
          })
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithoutBalanceValidation(driver);
        const testDappPage = new TestDappPage(driver);
        await testDappPage.openTestDappPage();
        await testDappPage.checkPageIsLoaded();
        await testDappPage.personalSign();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        const confirmation = new Confirmation(driver);
        await confirmation.clickFooterConfirmButtonAndAndWaitForWindowToClose();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        await testDappPage.checkSuccessPersonalSign(
          KNOWN_PUBLIC_KEY_ADDRESSES[0].address,
        );
      },
    );
  });

  it('sign typed v4', async function () {
    await withFixtures(
      {
        dappOptions: { numberOfTestDapps: 1 },
        fixtures: new FixtureBuilder()
          .withTrezorAccount()
          .withPermissionControllerConnectedToTestDapp({
            account: KNOWN_PUBLIC_KEY_ADDRESSES[0].address,
          })
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithoutBalanceValidation(driver);
        const testDappPage = new TestDappPage(driver);
        await testDappPage.openTestDappPage();
        await testDappPage.checkPageIsLoaded();
        await signTypedDataV4(driver, KNOWN_PUBLIC_KEY_ADDRESSES[0].address);
      },
    );
  });
});
