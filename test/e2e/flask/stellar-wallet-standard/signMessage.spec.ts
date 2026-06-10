import { strict as assert } from 'assert';
import { TestDappStellar } from '../../page-objects/pages/test-dapp-stellar';
import {
  confirmStellarSnapSigning,
  connectStellarTestDapp,
} from '../../page-objects/flows/stellar-dapp.flow';
import SnapSignMessageConfirmation from '../../page-objects/pages/confirmations/snap-sign-message-confirmation';
import {
  DEFAULT_STELLAR_TEST_DAPP_FIXTURE_OPTIONS,
  withStellarWalletSnap,
} from './testHelpers';

describe('Stellar Wallet Standard - Sign Message - e2e tests', function () {
  it('Signs a message', async function () {
    await withStellarWalletSnap(
      {
        ...DEFAULT_STELLAR_TEST_DAPP_FIXTURE_OPTIONS,
        title: this.test?.fullTitle(),
      },
      async (driver) => {
        const messageToSign = 'Hello, world!';
        const testDapp = new TestDappStellar(driver);
        await testDapp.openTestDappPage();

        await connectStellarTestDapp(driver, testDapp);
        await testDapp.setMessage(messageToSign);
        await testDapp.signMessage();

        const signMessageConfirmation = new SnapSignMessageConfirmation(
          driver,
        );
        await confirmStellarSnapSigning(driver, signMessageConfirmation);

        await testDapp.switchTo();

        const signedMessage = await testDapp.getSignedMessage();
        assert.ok(signedMessage.length > 0);
      },
    );
  });
});
