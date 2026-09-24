import { strict as assert } from 'assert';
import { TestDappStellar } from '../../page-objects/pages/test-dapp-stellar';
import {
  confirmStellarSnapSigning,
  connectStellarTestDapp,
} from '../../page-objects/flows/stellar-dapp.flow';
import SnapSignAuthEntryConfirmation from '../../page-objects/pages/confirmations/snap-sign-auth-entry-confirmation';
import { DEFAULT_STELLAR_AUTH_ENTRY_XDR } from '../../constants';
import {
  DEFAULT_STELLAR_TEST_DAPP_FIXTURE_OPTIONS,
  withStellarWalletSnap,
} from './testHelpers';

describe('Stellar - Sign Auth Entry - e2e tests', function () {
  it('Signs an auth entry', async function () {
    await withStellarWalletSnap(
      {
        ...DEFAULT_STELLAR_TEST_DAPP_FIXTURE_OPTIONS,
        title: this.test?.fullTitle(),
      },
      async (driver) => {
        const testDapp = new TestDappStellar(driver);
        await testDapp.openTestDappPage();

        await connectStellarTestDapp(driver, testDapp);
        await testDapp.setAuthEntry(DEFAULT_STELLAR_AUTH_ENTRY_XDR);
        await testDapp.signAuthEntry();

        const signAuthEntryConfirmation = new SnapSignAuthEntryConfirmation(
          driver,
        );
        await confirmStellarSnapSigning(driver, signAuthEntryConfirmation);
        await testDapp.switchTo();

        const signedAuthEntry = await testDapp.getSignedAuthEntry();
        assert.ok(signedAuthEntry.length > 0);
        assert.match(signedAuthEntry, /^[A-Za-z0-9+/=]+$/u);
      },
    );
  });
});
