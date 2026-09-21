import { Suite } from 'mocha';
import { Driver } from '../../webdriver/driver';
import { withFixtures } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { login } from '../../page-objects/flows/login.flow';
import { importPrivateKeyAccount } from '../../page-objects/flows/add-account.flow';
import AccountListPage from '../../page-objects/pages/accounts/list-page';
import HeaderNavbar from '../../page-objects/pages/home/header-navbar';

const DEFAULT_ACCOUNT_NAME = 'Account 1';
const IMPORTED_ACCOUNT_NAME = 'Imported Account 1';
const TEST_PRIVATE_KEY =
  '14abe6f4aab7f9f626fe981c864d0adeb5685f289ac9270c27b8fd790b4235d6';

describe('Account list - delete private key account', function (this: Suite) {
  it('deletes an imported private-key account from manage accounts mode', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);
        await importPrivateKeyAccount(driver, TEST_PRIVATE_KEY);

        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.openAccountMenu();

        const accountListPage = new AccountListPage(driver);
        await accountListPage.checkPageIsLoaded();
        await accountListPage.checkAccountDisplayedInAccountList(
          IMPORTED_ACCOUNT_NAME,
        );

        await accountListPage.enterManageAccountsMode();
        await accountListPage.checkAccountHasDeleteControl(
          IMPORTED_ACCOUNT_NAME,
        );
        await accountListPage.checkAccountHasVisibilityControl(
          DEFAULT_ACCOUNT_NAME,
        );

        await accountListPage.deletePrivateKeyAccount(
          IMPORTED_ACCOUNT_NAME,
          false,
        );
        await accountListPage.checkAccountDisplayedInAccountList(
          IMPORTED_ACCOUNT_NAME,
        );

        await accountListPage.deletePrivateKeyAccount(IMPORTED_ACCOUNT_NAME);
        await accountListPage.checkAccountDisplayedInAccountList(
          DEFAULT_ACCOUNT_NAME,
        );
        await accountListPage.checkAccountIsNotDisplayedInAccountList(
          IMPORTED_ACCOUNT_NAME,
        );

        await accountListPage.exitManageAccountsMode();
        await accountListPage.checkAccountIsNotDisplayedInAccountList(
          IMPORTED_ACCOUNT_NAME,
        );
        await accountListPage.checkAccountDisplayedInAccountList(
          DEFAULT_ACCOUNT_NAME,
        );
      },
    );
  });
});
