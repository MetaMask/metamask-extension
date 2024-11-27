import { Suite } from 'mocha';
import { Driver } from '../../webdriver/driver';
import FixtureBuilder from '../../fixture-builder';
import { defaultGanacheOptions, withFixtures } from '../../helpers';
import { KNOWN_PUBLIC_KEY_ADDRESSES } from '../../../stub/keyring-bridge';
import TestDappPage from '../../page-objects/pages/test-dapp';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';

describe('Trezor Hardware Signatures', function (this: Suite) {
  it('sign typed v4', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withTrezorAccount()
          .withPermissionControllerConnectedToTestDapp({
            account: KNOWN_PUBLIC_KEY_ADDRESSES[0].address,
          })
          .build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test?.fullTitle(),
        dapp: true,
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);
        const testDappPage = new TestDappPage(driver);
        await testDappPage.openTestDappPage();
        await testDappPage.check_pageIsLoaded();
        await testDappPage.signTypedDataV4(true);
        await testDappPage.check_successSignTypedDataV4(
          KNOWN_PUBLIC_KEY_ADDRESSES[0].address,
        );
      },
    );
  });
});
