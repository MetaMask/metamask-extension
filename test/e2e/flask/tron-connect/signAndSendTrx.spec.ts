import { strict as assert } from 'assert';
import { TestDappTron } from '../../page-objects/pages/test-dapp-tron';
import { WINDOW_TITLES, DEFAULT_TRON_ADDRESS_2 } from '../../constants';
import { veryLargeDelayMs } from '../../helpers';
import {
  DEFAULT_TRON_TEST_DAPP_FIXTURE_OPTIONS,
  connectTronTestDapp,
  clickConfirmButton,
  assertSignedTransactionIsValid,
} from './testHelpers';
import { withTronAccountSnap, TRANSACTION_HASH_MOCK } from './common-tron';

describe('Tron Connect - Sign/Send TRX - e2e tests', function () {
  describe(`Tron Connect - Sign/Send TRX`, function () {
    it('Should be able to Sign a TRX transaction', async function () {
      await withTronAccountSnap(
        {
          ...DEFAULT_TRON_TEST_DAPP_FIXTURE_OPTIONS,
          title: this.test?.fullTitle(),
        },
        async (driver) => {
          const testDappTron = new TestDappTron(driver);

          await testDappTron.openTestDappPage();
          await testDappTron.checkPageIsLoaded();
          await testDappTron.switchTo();

          // 1. Connect
          await connectTronTestDapp(driver, testDappTron);

          // 2. Set recipient and amount
          const signTrxTest = await testDappTron.getSignTrxTest();
          await signTrxTest.setRecipientAddress(DEFAULT_TRON_ADDRESS_2);
          await signTrxTest.setAmount('123');

          // 3. Sign transaction
          await signTrxTest.signTransaction();

          // 4. Confirm signature
          await driver.delay(veryLargeDelayMs);
          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
          await clickConfirmButton(driver);

          await driver.switchToWindowWithTitle(WINDOW_TITLES.TronTestDApp);

          const transaction = await signTrxTest.getSignedTransaction();

          assertSignedTransactionIsValid({
            transaction: JSON.parse(transaction),
          });
        },
      );
    });

    it('Should be able to Sign and Send a TRX transaction', async function () {
      await withTronAccountSnap(
        {
          ...DEFAULT_TRON_TEST_DAPP_FIXTURE_OPTIONS,
          title: this.test?.fullTitle(),
        },
        async (driver) => {
          const testDappTron = new TestDappTron(driver);

          await testDappTron.openTestDappPage();
          await testDappTron.checkPageIsLoaded();
          await testDappTron.switchTo();

          // 1. Connect
          await connectTronTestDapp(driver, testDappTron);

          // 2. Set recipient and amount
          const sendTrxTest = await testDappTron.getSignAndSendTrxTest();
          await sendTrxTest.setRecipientAddress(DEFAULT_TRON_ADDRESS_2);
          await sendTrxTest.setAmount('123');

          // 3. Sign transaction
          await sendTrxTest.signAndSendTransaction();

          // 4. Confirm signature
          await driver.delay(veryLargeDelayMs);
          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
          await clickConfirmButton(driver);

          await driver.switchToWindowWithTitle(WINDOW_TITLES.TronTestDApp);

          const transaction = await sendTrxTest.getTransactionHash();

          assert.equal(transaction, TRANSACTION_HASH_MOCK);
        },
      );
    });
  });
});
