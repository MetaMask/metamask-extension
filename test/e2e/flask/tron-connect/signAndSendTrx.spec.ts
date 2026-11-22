import { TestDappTron } from '../../page-objects/pages/test-dapp-tron';
import { WINDOW_TITLES, DEFAULT_TRON_ADDRESS_2 } from '../../constants';
import { connectTronTestDapp } from '../../page-objects/flows/tron-dapp.flow';
import SnapSignTransactionConfirmation from '../../page-objects/pages/confirmations/snap-sign-transaction-confirmation';
import { DEFAULT_TRON_TEST_DAPP_FIXTURE_OPTIONS } from './testHelpers';
import { withTronAccountSnap, TRANSACTION_HASH_MOCK } from './common-tron';

const FUNDED_TRX_BALANCE_IN_SUN = 200_000_000;
const INSUFFICIENT_TRX_BALANCE_IN_SUN = 100_000_000;

describe('Tron Connect - Sign/Send TRX - e2e tests', function () {
  it('Signs a TRX transaction', async function () {
    await withTronAccountSnap(
      {
        ...DEFAULT_TRON_TEST_DAPP_FIXTURE_OPTIONS,
        title: this.test?.fullTitle(),
        tronBalance: FUNDED_TRX_BALANCE_IN_SUN,
      },
      async (driver) => {
        const testDappTron = new TestDappTron(driver);

        await testDappTron.openTestDappPage();

        // 1. Connect
        await connectTronTestDapp(driver, testDappTron);

        // 2. Set recipient and amount
        await testDappTron.setTRXRecipientAddress(DEFAULT_TRON_ADDRESS_2);
        await testDappTron.setTRXAmount('123');

        // 3. Sign transaction
        await testDappTron.signTRXTransaction();

        // 4. Confirm signature
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        const signTransacitonConfiramtion = new SnapSignTransactionConfirmation(
          driver,
        );
        await signTransacitonConfiramtion.checkPageIsLoaded();
        await signTransacitonConfiramtion.clickFooterConfirmButton();

        await driver.switchToWindowWithTitle(WINDOW_TITLES.TronTestDApp);

        await testDappTron.findSignedTRXTransaction();
      },
    );
  });

  it('Sends a TRX transaction', async function () {
    await withTronAccountSnap(
      {
        ...DEFAULT_TRON_TEST_DAPP_FIXTURE_OPTIONS,
        title: this.test?.fullTitle(),
        tronBalance: FUNDED_TRX_BALANCE_IN_SUN,
      },
      async (driver) => {
        const testDappTron = new TestDappTron(driver);

        await testDappTron.openTestDappPage();

        // 1. Connect
        await connectTronTestDapp(driver, testDappTron);

        // 2. Set recipient and amount
        await testDappTron.setTRXRecipientAddress(DEFAULT_TRON_ADDRESS_2);
        await testDappTron.setTRXAmount('123');

        // 3. Sign transaction
        await testDappTron.sendTRXTransaction();

        // 4. Confirm signature
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        const signTransacitonConfiramtion = new SnapSignTransactionConfirmation(
          driver,
        );
        await signTransacitonConfiramtion.checkPageIsLoaded();
        await signTransacitonConfiramtion.checkFeeAssetIsDisplayed('BANDWIDTH');
        await signTransacitonConfiramtion.clickFooterConfirmButton();

        await driver.switchToWindowWithTitle(WINDOW_TITLES.TronTestDApp);

        await testDappTron.findTRXTransactionHash(TRANSACTION_HASH_MOCK);
      },
    );
  });

  it('Disables confirmation when TRX balance cannot cover the transaction amount', async function () {
    await withTronAccountSnap(
      {
        ...DEFAULT_TRON_TEST_DAPP_FIXTURE_OPTIONS,
        title: this.test?.fullTitle(),
        tronBalance: INSUFFICIENT_TRX_BALANCE_IN_SUN,
      },
      async (driver) => {
        const testDappTron = new TestDappTron(driver);

        await testDappTron.openTestDappPage();

        // 1. Connect
        await connectTronTestDapp(driver, testDappTron);

        // 2. Set recipient and amount
        await testDappTron.setTRXRecipientAddress(DEFAULT_TRON_ADDRESS_2);
        await testDappTron.setTRXAmount('123');

        // 3. Send transaction
        await testDappTron.sendTRXTransaction();

        // 4. Check insufficient funds state
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        const signTransacitonConfiramtion = new SnapSignTransactionConfirmation(
          driver,
        );
        await signTransacitonConfiramtion.checkPageIsLoaded();
        await signTransacitonConfiramtion.checkInsufficientFundsBannerIsDisplayed();
        await signTransacitonConfiramtion.checkConfirmButtonIsDisabled();
      },
    );
  });
});
