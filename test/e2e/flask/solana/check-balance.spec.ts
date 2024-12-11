import { Suite } from 'mocha';
import { strict as assert } from 'assert';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import AccountListPage from '../../page-objects/pages/account-list-page';
import { withSolanaAccountSnap } from './common-solana';
import { logging } from 'selenium-webdriver';

const EXPECTED_MAINNET_BALANCE_USD = '$0.00'

describe('Switching between account from different networks', function (this: Suite) {
  beforeEach(async function () {
    // Setup code to run before each test
    // For example, you can reset the application state or create a fresh environment
  });

  afterEach(async function () {
    // Teardown code to run after each test
    // For example, you can clean up any data created during the test
  });
  it('Switch from Solana account to another Network account', async function () {
    await withSolanaAccountSnap(
      { title: this.test?.fullTitle() },
      async (driver) => {
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.check_pageIsLoaded();
        await headerNavbar.check_accountLabel('Solana 1');
        const accountListPage = new AccountListPage(driver);
        await accountListPage.check_accountValueAndSuffixDisplayed(
          EXPECTED_MAINNET_BALANCE_USD,
        );
      },
    );
  });
});
