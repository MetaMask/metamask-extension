import { Suite } from 'mocha';
import { Driver } from '../../webdriver/driver';
import FixtureBuilder from '../../fixture-builder';
import { withFixtures } from '../../helpers';
import { KNOWN_PUBLIC_KEY_ADDRESSES } from '../../../stub/keyring-bridge';
import TestDappPage from '../../page-objects/pages/test-dapp';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import { Ganache } from '../../seeder/ganache';

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
        title: this.test?.fullTitle(),
        dapp: true,
      },
      async ({
        driver,
        ganacheServer,
      }: {
        driver: Driver;
        ganacheServer: Ganache;
      }) => {
        await loginWithBalanceValidation(driver, ganacheServer);
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
