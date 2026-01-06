import { strict as assert } from 'assert';
import { withTronAccountSnap, TRANSACTION_HASH_MOCK } from './common-tron';
import { TestDappTron } from '../../page-objects/pages/test-dapp-tron';
import { WINDOW_TITLES, DEFAULT_TRON_ADDRESS_2 } from '../../constants';
import {
  DEFAULT_TRON_TEST_DAPP_FIXTURE_OPTIONS,
  connectTronTestDapp,
  clickConfirmButton,
  assertSignedTransactionIsValid,
} from './testHelpers';
import { veryLargeDelayMs } from '../../helpers';

describe('Tron Connect - Sign/Send USDT - e2e tests', function () {
  describe(`Tron Connect - Sign/Send USDT`, function () {
    it('Should be able to Sign a USDT transaction', async function () {
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
        const signUsdtTest = await testDappTron.getSignUsdtTest();
        await signUsdtTest.setRecipientAddress(DEFAULT_TRON_ADDRESS_2);
        await signUsdtTest.setAmount('123');

        // 3. Sign transaction
        await signUsdtTest.signTransaction();

        // 4. Confirm signature
        await driver.delay(veryLargeDelayMs);
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await clickConfirmButton(driver);

        await driver.switchToWindowWithTitle(WINDOW_TITLES.TronTestDApp);

        const transaction = await signUsdtTest.getSignedTransaction();

        assertSignedTransactionIsValid({transaction: JSON.parse(transaction)})
      });
    });

    it('Should be able to Sign and Send a USDT transaction', async function () {
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
        const signAndSendUsdtTest = await testDappTron.getSignAndSendUsdtTest();
        await signAndSendUsdtTest.setRecipientAddress(DEFAULT_TRON_ADDRESS_2);
        await signAndSendUsdtTest.setAmount('123');

        // 3. Sign transaction
        await signAndSendUsdtTest.signTransaction();

        // 4. Confirm signature
        await driver.delay(veryLargeDelayMs);
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await clickConfirmButton(driver);

        await driver.switchToWindowWithTitle(WINDOW_TITLES.TronTestDApp);

        const transaction = await signAndSendUsdtTest.getTransactionHash();

        assert.equal(transaction, TRANSACTION_HASH_MOCK)
      });
    });
  })
});
