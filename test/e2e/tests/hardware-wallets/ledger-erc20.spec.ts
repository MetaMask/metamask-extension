import { Suite } from 'mocha';
import TestDappPage from '../../page-objects/pages/test-dapp';
import FixtureBuilder from '../../fixture-builder';
import { WINDOW_TITLES, withFixtures } from '../../helpers';
import { KNOWN_PUBLIC_KEY_ADDRESSES } from '../../../stub/keyring-bridge';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import CreateContractModal from '../../page-objects/pages/dialog/create-contract';

describe('Ledger Hardware', function (this: Suite) {
  it('can create an ERC20 token', async function () {
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
      async ({ driver, localNodes }) => {
        (await localNodes?.[0]?.setAccountBalance(
          KNOWN_PUBLIC_KEY_ADDRESSES[0].address,
          '0x100000000000000000000',
        )) ?? console.error('localNodes is undefined or empty');
        await loginWithBalanceValidation(
          driver,
          undefined,
          undefined,
          '1208925.8196',
        );
        const testDappPage = new TestDappPage(driver);
        await testDappPage.openTestDappPage();
        await testDappPage.check_pageIsLoaded();
        await testDappPage.clickERC20CreateTokenButton();
        // Confirm token creation
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        const createContractModal = new CreateContractModal(driver);
        await createContractModal.check_pageIsLoaded();
        await createContractModal.clickConfirm();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        await testDappPage.check_TokenAddressesValue(
          '0xcB17707e0623251182A654BEdaE16429C78A7424',
        );
      },
    );
  });
});
