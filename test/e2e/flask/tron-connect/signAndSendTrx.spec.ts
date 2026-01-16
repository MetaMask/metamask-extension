import { TestDappTron } from '../../page-objects/pages/test-dapp-tron';
import { WINDOW_TITLES, DEFAULT_TRON_ADDRESS_2 } from '../../constants';
import { connectTronTestDapp } from '../../page-objects/flows/tron-dapp.flow';
import SnapSignTransactionConfirmation from '../../page-objects/pages/confirmations/snap-sign-transaction-confirmation';
import { DEFAULT_TRON_TEST_DAPP_FIXTURE_OPTIONS } from './testHelpers';
import { withTronAccountSnap, TRANSACTION_HASH_MOCK } from './common-tron';

describe('Tron Connect - Sign/Send TRX - e2e tests', function () {
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
        const signTrxTest = await testDappTron.getSignAndSendTrxTest();
        await signTrxTest.setRecipientAddress(DEFAULT_TRON_ADDRESS_2);
        await signTrxTest.setAmount('123');

        // 3. Sign transaction
        await signTrxTest.signTransaction();

        // 4. Confirm signature
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        const signTransacitonConfiramtion = new SnapSignTransactionConfirmation(
          driver,
        );
        await signTransacitonConfiramtion.checkPageIsLoaded();
        await signTransacitonConfiramtion.clickFooterConfirmButton();

        await driver.switchToWindowWithTitle(WINDOW_TITLES.TronTestDApp);

        await signTrxTest.findSignedTransaction();
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
        await sendTrxTest.sendTransaction();

        // 4. Confirm signature
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        const signTransacitonConfiramtion = new SnapSignTransactionConfirmation(
          driver,
        );
        await signTransacitonConfiramtion.checkPageIsLoaded();
        await signTransacitonConfiramtion.clickFooterConfirmButton();

        await driver.switchToWindowWithTitle(WINDOW_TITLES.TronTestDApp);

        await sendTrxTest.findTransactionHash(TRANSACTION_HASH_MOCK);
      },
    );
  });
});
