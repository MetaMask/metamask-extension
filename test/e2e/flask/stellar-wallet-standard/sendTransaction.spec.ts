import { TestDappStellar } from '../../page-objects/pages/test-dapp-stellar';
import {
  confirmStellarSnapSigning,
  connectStellarTestDapp,
} from '../../page-objects/flows/stellar-dapp.flow';
import { DEFAULT_STELLAR_RECIPIENT } from '../../constants';
import SnapSignTransactionConfirmation from '../../page-objects/pages/confirmations/snap-sign-transaction-confirmation';
import { MOCK_STELLAR_TRANSACTION_HASH } from '../../tests/stellar/mocks/horizon';
import {
  DEFAULT_STELLAR_TEST_DAPP_FIXTURE_OPTIONS,
  withStellarWalletSnap,
} from './testHelpers';

describe('Stellar Wallet Standard - Send transaction - e2e tests', function () {
  it('Sends a USDC transaction', async function () {
    await withStellarWalletSnap(
      {
        ...DEFAULT_STELLAR_TEST_DAPP_FIXTURE_OPTIONS,
        title: this.test?.fullTitle(),
      },
      async (driver) => {
        const testDapp = new TestDappStellar(driver);
        await testDapp.openTestDappPage();

        await connectStellarTestDapp(driver, testDapp);
        await testDapp.setUsdcRecipient(DEFAULT_STELLAR_RECIPIENT);
        await testDapp.setUsdcAmount('1');
        await testDapp.sendUsdc();

        const txConfirmation = new SnapSignTransactionConfirmation(driver);
        await confirmStellarSnapSigning(driver, txConfirmation);
        await testDapp.switchTo();

        await testDapp.verifyTransactionHash(MOCK_STELLAR_TRANSACTION_HASH);
      },
    );
  });
});
