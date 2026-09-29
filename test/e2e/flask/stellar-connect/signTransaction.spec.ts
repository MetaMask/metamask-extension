import { strict as assert } from 'assert';
import { TestDappStellar } from '../../page-objects/pages/test-dapp-stellar';
import { connectStellarTestDapp } from '../../page-objects/flows/stellar-dapp.flow';
import SnapSignTransactionConfirmation from '../../page-objects/pages/confirmations/snap-sign-transaction-confirmation';
import { addMultipleAccounts } from '../../page-objects/flows/add-account.flow';
import { WINDOW_TITLES } from '../../constants';
import { withStellarWalletSnap } from './testHelpers';

describe('Stellar - Sign Transaction - e2e tests', function () {
  it('Signs a transaction', async function () {
    await withStellarWalletSnap(
      {
        title: this.test?.fullTitle(),
      },
      async (driver) => {
        await addMultipleAccounts({ driver });
        const testDapp = new TestDappStellar(driver);
        await testDapp.openTestDappPage();

        await connectStellarTestDapp(driver, testDapp);
        await testDapp.loadExampleXdr();
        await testDapp.signTransaction();

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        const signTxConfirmation = new SnapSignTransactionConfirmation(driver);
        await signTxConfirmation.checkPageIsLoaded();
        await signTxConfirmation.clickFooterConfirmButton();
        await testDapp.switchTo();

        const signedTransaction = await testDapp.getSignedTransaction();
        assert.ok(signedTransaction.length > 0);
        assert.match(signedTransaction, /^[A-Za-z0-9+/=]+$/u);
      },
    );
  });
});
