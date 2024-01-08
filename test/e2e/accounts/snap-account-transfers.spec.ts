import { Suite } from 'mocha';
import { sendTransaction, withFixtures, WINDOW_TITLES } from '../helpers';
import { Driver } from '../webdriver/driver';
import {
  accountSnapFixtures,
  PUBLIC_KEY,
  installSnapSimpleKeyring,
  importKeyAndSwitch,
  approveOrRejectRequest,
} from './common';

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

  /**
   * @param driver
   * @param flowType
   */
  async function importPrivateKeyAndTransfer1ETH(
    driver: Driver,
    flowType: string,
  ) {
    const isAsyncFlow = flowType !== 'sync';

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
      await driver.delay(1000);
      await driver.clickElement({
        text: 'Go to site',
        tag: 'button',
      });

      await driver.delay(1000);
      await approveOrRejectRequest(driver, flowType);
    }

    if (flowType === 'sync' || flowType === 'approve') {
      // click on Accounts
      await driver.clickElement('[data-testid="account-menu-icon"]');

      // ensure one account has 26 ETH and the other has 24 ETH
      await driver.findElement('[title="26 ETH"]');
      await driver.findElement('[title="24 ETH"]');
    } else if (flowType === 'reject') {
      // ensure the transaction was rejected by the Snap
      await driver.clickElement({ text: 'Activity', tag: 'button' });
      await driver.findElement(
        '[data-original-title="Request rejected by user or snap."]',
      );
    }
  }
});
