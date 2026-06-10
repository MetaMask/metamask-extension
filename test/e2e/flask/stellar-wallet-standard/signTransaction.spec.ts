import { strict as assert } from 'assert';
import { TestDappStellar } from '../../page-objects/pages/test-dapp-stellar';
import {
  confirmStellarSnapSigning,
  connectStellarTestDapp,
} from '../../page-objects/flows/stellar-dapp.flow';
import SnapSignTransactionConfirmation from '../../page-objects/pages/confirmations/snap-sign-transaction-confirmation';
import {
  DEFAULT_STELLAR_TEST_DAPP_FIXTURE_OPTIONS,
  withStellarWalletSnap,
} from './testHelpers';

describe('Stellar Wallet Standard - Sign Transaction - e2e tests', function () {
  it('Signs a transaction', async function () {
    await withStellarWalletSnap(
      {
        ...DEFAULT_STELLAR_TEST_DAPP_FIXTURE_OPTIONS,
        title: this.test?.fullTitle(),
      },
      async (driver) => {
        const testDapp = new TestDappStellar(driver);
        await testDapp.openTestDappPage();

        await connectStellarTestDapp(driver, testDapp);
        await testDapp.loadExampleXdr();
        await testDapp.signTransaction();

        const signTxConfirmation = new SnapSignTransactionConfirmation(driver);
        await confirmStellarSnapSigning(driver, signTxConfirmation);
        await testDapp.switchTo();

        const signedTransaction = await testDapp.getSignedTransaction();
        assert.ok(signedTransaction.length > 0);
        assert.match(signedTransaction, /^[A-Za-z0-9+/=]+$/u);
      },
    );
  });

  it('Signs multiple transactions sequentially', async function () {
    await withStellarWalletSnap(
      {
        ...DEFAULT_STELLAR_TEST_DAPP_FIXTURE_OPTIONS,
        title: this.test?.fullTitle(),
      },
      async (driver) => {
        const testDapp = new TestDappStellar(driver);
        await testDapp.openTestDappPage();

        await connectStellarTestDapp(driver, testDapp);

        for (let i = 0; i < 2; i++) {
          await testDapp.loadExampleXdr();
          await testDapp.signTransaction();

          const signTxConfirmation = new SnapSignTransactionConfirmation(
            driver,
          );
          await confirmStellarSnapSigning(driver, signTxConfirmation);
          await testDapp.switchTo();

          const signedTransaction = await testDapp.getSignedTransaction();
          assert.ok(signedTransaction.length > 0);
        }
      },
    );
  });
});
