import { TestDappTron } from '../../page-objects/pages/test-dapp-tron';
import { WINDOW_TITLES, DEFAULT_TRON_ADDRESS_2 } from '../../constants';
import { connectTronTestDapp } from '../../page-objects/flows/tron-dapp.flow';
import SnapSignTransactionConfirmation from '../../page-objects/pages/confirmations/snap-sign-transaction-confirmation';
import { DEFAULT_TRON_TEST_DAPP_FIXTURE_OPTIONS } from './testHelpers';
import { withTronAccountSnap, TRANSACTION_HASH_MOCK } from './common-tron';

describe('Tron Connect - Sign/Send USDT - e2e tests', function () {
  it('Signs a USDT transaction', async function () {
    await withTronAccountSnap(
      {
        ...DEFAULT_TRON_TEST_DAPP_FIXTURE_OPTIONS,
        title: this.test?.fullTitle(),
      },
      async (driver) => {
        const testDappTron = new TestDappTron(driver);

        await testDappTron.openTestDappPage();

        // 1. Connect
        await connectTronTestDapp(driver, testDappTron);

        // 2. Set recipient and amount
        const signUsdtTest = await testDappTron.getSignAndSendUsdtTest();
        await signUsdtTest.setRecipientAddress(DEFAULT_TRON_ADDRESS_2);
        await signUsdtTest.setAmount('123');

        // 3. Sign transaction
        await signUsdtTest.signTransaction();

        // 4. Confirm signature
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        const signTransacitonConfiramtion = new SnapSignTransactionConfirmation(
          driver,
        );
        await signTransacitonConfiramtion.checkPageIsLoaded();
        await signTransacitonConfiramtion.clickFooterConfirmButton();

        await driver.switchToWindowWithTitle(WINDOW_TITLES.TronTestDApp);

        await signUsdtTest.findSignedTransaction();
      },
    );
  });

  it('Sends a USDT transaction', async function () {
    await withTronAccountSnap(
      {
        ...DEFAULT_TRON_TEST_DAPP_FIXTURE_OPTIONS,
        title: this.test?.fullTitle(),
      },
      async (driver) => {
        const testDappTron = new TestDappTron(driver);

        await testDappTron.openTestDappPage();

        // 1. Connect
        await connectTronTestDapp(driver, testDappTron);

        // 2. Set recipient and amount
        const signAndSendUsdtTest = await testDappTron.getSignAndSendUsdtTest();
        await signAndSendUsdtTest.setRecipientAddress(DEFAULT_TRON_ADDRESS_2);
        await signAndSendUsdtTest.setAmount('123');

        // 3. Sign transaction
        await signAndSendUsdtTest.sendTransaction();

        // 4. Confirm signature
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        const signTransacitonConfiramtion = new SnapSignTransactionConfirmation(
          driver,
        );
        await signTransacitonConfiramtion.checkPageIsLoaded();
        await signTransacitonConfiramtion.clickFooterConfirmButton();

        await driver.switchToWindowWithTitle(WINDOW_TITLES.TronTestDApp);

        await signAndSendUsdtTest.findTransactionHash(TRANSACTION_HASH_MOCK);
      },
    );
  });
});
