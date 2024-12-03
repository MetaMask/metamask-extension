import { Suite } from "mocha";
import { withSolanaAccountSnap } from "./common-solana";
import HeaderNavbar from "../../page-objects/pages/header-navbar";
import AccountListPage from "../../page-objects/pages/account-list-page";

describe('Create/Remove Solana Account', function (this: Suite) {
  it('create Solana account from the menu', async function () {
    await withSolanaAccountSnap(
      { title: this.test?.fullTitle() },
      async (driver) => {
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.check_pageIsLoaded();
        await headerNavbar.check_accountLabel('Solana Account 0');
      },
    );
  });
  it('Remove Solana account', async function () {
    await withSolanaAccountSnap(
      { title: this.test?.fullTitle() },
      async (driver) => {
        // check that we have one Solana account
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.check_pageIsLoaded();
        await headerNavbar.check_accountLabel('Solana Account 0');

        // check user can cancel the removal of the Solana account
        await headerNavbar.openAccountMenu();
        const accountListPage = new AccountListPage(driver);
        await accountListPage.check_pageIsLoaded();
        await accountListPage.removeAccount('Solana Account 0', true);
        // check the number of accounts. it should be 1.
        await headerNavbar.openAccountMenu();
        try {
          await accountListPage.check_numberOfAvailableAccounts(1);
        } catch (error) {
          console.error('Error checking number of available accounts:', error);
          throw error; // Re-throw the error to fail the test
        }
      },
    );
  });
});
