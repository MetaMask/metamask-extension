import { TestDappStellar } from '../../page-objects/pages/test-dapp-stellar';
import { connectStellarTestDapp } from '../../page-objects/flows/stellar-dapp.flow';
import SnapSignMessageConfirmation from '../../page-objects/pages/confirmations/snap-sign-message-confirmation';
import { addMultipleAccounts } from '../../page-objects/flows/add-account.flow';
import { DEFAULT_STELLAR_SIGNED_MESSAGE, WINDOW_TITLES } from '../../constants';
import { withStellarWalletSnap } from './testHelpers';

describe('Stellar - Sign Message', function () {
  it('Signs a message', async function () {
    await withStellarWalletSnap(
      {
        title: this.test?.fullTitle(),
      },
      async (driver) => {
        await addMultipleAccounts({ driver });
        const messageToSign = 'Hello, world!';
        const testDapp = new TestDappStellar(driver);
        await testDapp.openTestDappPage();

        await connectStellarTestDapp(driver, testDapp);
        await testDapp.setMessage(messageToSign);
        await testDapp.signMessage();

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        const signMessageConfirmation = new SnapSignMessageConfirmation(driver);
        await signMessageConfirmation.checkPageIsLoaded();
        await signMessageConfirmation.clickFooterConfirmButton();

        await testDapp.switchTo();

        await testDapp.verifySignedMessage(DEFAULT_STELLAR_SIGNED_MESSAGE);
      },
    );
  });
});
