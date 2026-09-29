import { strict as assert } from 'assert';
import { TestDappStellar } from '../../page-objects/pages/test-dapp-stellar';
import { connectStellarTestDapp } from '../../page-objects/flows/stellar-dapp.flow';
import SnapSignAuthEntryConfirmation from '../../page-objects/pages/confirmations/snap-sign-auth-entry-confirmation';
import { DEFAULT_STELLAR_AUTH_ENTRY_XDR, WINDOW_TITLES } from '../../constants';
import { addMultipleAccounts } from '../../page-objects/flows/add-account.flow';
import { withStellarWalletSnap } from './testHelpers';

describe('Stellar - Sign Auth Entry - e2e tests', function () {
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

        const signedAuthEntry = await testDapp.getSignedAuthEntry();
        assert.ok(signedAuthEntry.length > 0);
        assert.match(signedAuthEntry, /^[A-Za-z0-9+/=]+$/u);
      },
    );
  });
});
