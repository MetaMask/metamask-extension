import { Suite } from 'mocha';
import {
  sendTransaction,
  withFixtures,
  WINDOW_TITLES,
} from '../helpers';
import { Driver } from '../webdriver/driver';
import {
  accountSnapFixtures,
  PUBLIC_KEY,
  installSnapSimpleKeyring,
  importKeyAndSwitch,
  approveOrRejectRequest,
} from './common';
import SnapAccountPage from '../page-objects/pages/snap-account-page';

describe('Snap Account Transfers', function (this: Suite) {
  it('can import a private key and transfer 1 ETH (sync flow)', async function () {
    await withFixtures(
      accountSnapFixtures(this.test?.fullTitle()),
      async ({ driver }: { driver: Driver }) => {
        await importPrivateKeyAndTransfer1ETH(driver, 'sync');
      },
    );
  });

  it('can import a private key and transfer 1 ETH (async flow approve)', async function () {
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
  });

  async function importPrivateKeyAndTransfer1ETH(
    driver: Driver,
    flowType: string,
  ) {
    const isAsyncFlow = flowType !== 'sync';
    const snapAccountPage = new SnapAccountPage(driver);

    await installSnapSimpleKeyring(driver, isAsyncFlow);
    await importKeyAndSwitch(driver);

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
  }
});
