import { TestDappStellar } from '../../page-objects/pages/test-dapp-stellar';
import { connectStellarTestDapp } from '../../page-objects/flows/stellar-dapp.flow';
import SnapSignAuthEntryConfirmation from '../../page-objects/pages/confirmations/snap-sign-auth-entry-confirmation';
import {
  DEFAULT_STELLAR_AUTH_ENTRY_XDR,
  DEFAULT_STELLAR_SIGNED_AUTH_ENTRY,
  WINDOW_TITLES,
} from '../../constants';
import { addMultipleAccounts } from '../../page-objects/flows/add-account.flow';
import { withStellarWalletSnap } from './testHelpers';

describe('Stellar - Sign Auth Entry', function () {
  it('Signs an auth entry', async function () {
    await withStellarWalletSnap(
      {
        title: this.test?.fullTitle(),
      },
      async (driver) => {
        await addMultipleAccounts({ driver });
        const testDapp = new TestDappStellar(driver);
        await testDapp.openTestDappPage();

        await connectStellarTestDapp(driver, testDapp);
        await testDapp.setAuthEntry(DEFAULT_STELLAR_AUTH_ENTRY_XDR);
        await testDapp.signAuthEntry();

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        const signAuthEntryConfirmation = new SnapSignAuthEntryConfirmation(
          driver,
        );
        await signAuthEntryConfirmation.checkPageIsLoaded();
        await signAuthEntryConfirmation.clickFooterConfirmButton();
        await testDapp.switchTo();

        await testDapp.verifySignedAuthEntry(DEFAULT_STELLAR_SIGNED_AUTH_ENTRY);
      },
    );
  });
});
