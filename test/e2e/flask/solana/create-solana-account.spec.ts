import { Suite } from 'mocha';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import AccountListPage from '../../page-objects/pages/account-list-page';
import { withSolanaAccountSnap } from './common-solana';

describe('Create/Remove Solana Account', function (this: Suite) {
  beforeEach(async function () {
    // Setup code to run before each test
    // For example, you can reset the application state or create a fresh environment
  });

  afterEach(async function () {
    // Teardown code to run after each test
    // For example, you can clean up any data created during the test
  });
  it('create Solana account from the menu', async function () {
    await withSolanaAccountSnap(
      { title: this.test?.fullTitle() },
      async (driver) => {
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.check_pageIsLoaded();
        await headerNavbar.check_accountLabel('Solana 1');
        await headerNavbar.openAccountMenu();
        const accountListPage = new AccountListPage(driver);
        await accountListPage.check_accountDisplayedInAccountList('Account 1');
        await accountListPage.check_accountDisplayedInAccountList('Solana 1');
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
        await headerNavbar.check_accountLabel('Solana 1');
        // check user can cancel the removal of the Solana account
        await headerNavbar.openAccountMenu();
        const accountListPage = new AccountListPage(driver);
        await accountListPage.check_accountDisplayedInAccountList('Account 1');
        await accountListPage.removeAccount('Solana 1', true);
        await headerNavbar.check_accountLabel('Account 1');
        await headerNavbar.openAccountMenu();
        await accountListPage.check_accountDisplayedInAccountList('Account 1');
        await accountListPage.check_accountNotDisplayedInAccountList(
          'Solana 1',
        );
      },
    );
  });
  it('Create 2 Solana accounts', async function () {
    await withSolanaAccountSnap(
      { title: this.test?.fullTitle() },
      async (driver) => {
        // check that we have one Solana account
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.check_pageIsLoaded();
        await headerNavbar.check_accountLabel('Solana 1');

        await headerNavbar.openAccountMenu();
        const accountListPage = new AccountListPage(driver);
        await accountListPage.openAddAccountModal();
        await accountListPage.addNewSolanaAccount({ accountName: 'Solana 2' });
        await headerNavbar.check_accountLabel('Solana 2');
        await headerNavbar.openAccountMenu();
        await accountListPage.check_accountDisplayedInAccountList('Account 1');
        await accountListPage.check_accountDisplayedInAccountList('Solana 1');
        await accountListPage.check_accountDisplayedInAccountList('Solana 2');
      },
    );
  });
});
