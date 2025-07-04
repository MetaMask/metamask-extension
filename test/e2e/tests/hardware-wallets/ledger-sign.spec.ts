import { Suite } from 'mocha';
import { Driver } from '../../webdriver/driver';
import FixtureBuilder from '../../fixture-builder';
import { withFixtures } from '../../helpers';
import { KNOWN_PUBLIC_KEY_ADDRESSES } from '../../../stub/keyring-bridge';
import { loginWithoutBalanceValidation } from '../../page-objects/flows/login.flow';
import TestDappPage from '../../page-objects/pages/test-dapp';

describe('Ledger Hardware Signatures', function (this: Suite) {
  it('sign typed v4', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withLedgerAccount()
          .withPermissionControllerConnectedToTestDapp({
            account: KNOWN_PUBLIC_KEY_ADDRESSES[0].address,
          })
          .build(),
        title: this.test?.fullTitle(),
        dapp: true,
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithoutBalanceValidation(driver);
        const testDappPage = new TestDappPage(driver);
        await testDappPage.openTestDappPage();
        await testDappPage.check_pageIsLoaded();
        await testDappPage.signTypedDataV4();
        await testDappPage.check_successSignTypedDataV4(
          KNOWN_PUBLIC_KEY_ADDRESSES[0].address,
        );
      },
    );
  });
});
