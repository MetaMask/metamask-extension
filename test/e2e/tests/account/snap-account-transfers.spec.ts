import { Suite } from 'mocha';
import {
  withFixtures,
  WINDOW_TITLES,
  PRIVATE_KEY_TWO,
  multipleGanacheOptions,
} from '../../helpers';
import { Driver } from '../../webdriver/driver';
import FixtureBuilder from '../../fixture-builder';
import {
  PUBLIC_KEY,
  approveOrRejectRequest,
} from '../../accounts/common';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import { installSnapSimpleKeyring } from '../../page-objects/flows/snap-simple-keyring.flow';
import SnapAccountPage from '../../page-objects/pages/snap-account-page';
import SnapSimpleKeyringPage from '../../page-objects/pages/snap-simple-keyring-page';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import { sendTransactionWithSnapAccount } from '../../page-objects/flows/send-transaction.flow';
import AccountListPage from '../../page-objects/pages/account-list-page';

describe('Snap Account Transfers', function (this: Suite) {
  it('can import a private key and transfer 1 ETH (sync flow)', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
         .withPermissionControllerConnectedToTestDapp({
          restrictReturnedAccounts: false,
          })
          .build(),
        ganacheOptions: multipleGanacheOptions,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);
        await installSnapSimpleKeyring(driver, true);
        const snapSimpleKeyringPage = new SnapSimpleKeyringPage(driver);
        await snapSimpleKeyringPage.importAccountWithPrivateKey(PRIVATE_KEY_TWO);

        // Import snap account with private key on snap simple keyring page.
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.check_accountLabel('SSK Account');

        // send 1 ETH from Account 2 to Account 1
        await sendTransactionWithSnapAccount(
          driver,
          PUBLIC_KEY,
          '1',
          '0.000042',
          '1.000042',
          true,
        );
/*         await headerNavbar.openAccountMenu();
        const accountList = new AccountListPage(driver);
        await accountList.check_pageIsLoaded();

        //check the balance of the 2 accounts are updated
        await accountList.check_accountBalanceDisplayed('26');
        await accountList.check_accountBalanceDisplayed('24'); */
      },
    );
  });

/*   it('can import a private key and transfer 1 ETH (async flow approve)', async function () {
    await withFixtures(
      accountSnapFixtures(this.test?.fullTitle()),
      async ({ driver }: { driver: Driver }) => {
        await importPrivateKeyAndTransfer1ETH(driver, 'approve');
      },
    );
  });

  it('can import a private key and transfer 1 ETH (async flow reject)', async function () {
    await withFixtures(
      accountSnapFixtures(this.test?.fullTitle()),
      async ({ driver }: { driver: Driver }) => {
        await importPrivateKeyAndTransfer1ETH(driver, 'reject');
      },
    );
  }); */

/*   async function importPrivateKeyAndTransfer1ETH(
    driver: Driver,
    isSyncFlow: boolean,
  ) {
    const snapAccountPage = new SnapAccountPage(driver);

    await installSnapSimpleKeyring(driver, isSyncFlow);
    const snapSimpleKeyringPage = new SnapSimpleKeyringPage(driver);
    await snapSimpleKeyringPage.importAccountWithPrivateKey(PRIVATE_KEY_TWO);

    // send 1 ETH from Account 2 to Account 1
    await sendTransaction(driver, PUBLIC_KEY, 1, isAsyncFlow);

    if (isAsyncFlow) {
      await driver.assertElementNotPresent({
        text: 'Please complete the transaction on the Snap.',
      });
      await driver.switchToWindowWithTitle(
        WINDOW_TITLES.ExtensionInFullScreenView,
      );
      await driver.navigate();
      await driver.delay(2000);
      await driver.clickElement({
        text: 'Go to site',
        tag: 'button',
      });

      await driver.delay(1000);
      await approveOrRejectRequest(driver, flowType);
    }

    if (flowType === 'sync' || flowType === 'approve') {
      await snapAccountPage.clickAccountMenuIcon();

      // ensure one account has 26 ETH and the other has 24 ETH
      await snapAccountPage.findAccountBalance('26');
      await snapAccountPage.findAccountBalance('24');
    } else if (flowType === 'reject') {
      // ensure the transaction was rejected by the Snap
      await snapAccountPage.clickActivityTab();
      await snapAccountPage.findRejectedTransaction();
    }
  } */
});
