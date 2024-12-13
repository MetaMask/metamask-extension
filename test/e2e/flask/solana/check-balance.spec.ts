import { Suite } from 'mocha';
import { strict as assert } from 'assert';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import AccountListPage from '../../page-objects/pages/account-list-page';
import { SOL_BALANCE, USD_BALANCE, withSolanaAccountSnap } from './common-solana';
import { logging } from 'selenium-webdriver';
import SettingsPage from '../../page-objects/pages/settings/settings-page';

const EXPECTED_MAINNET_BALANCE_USD = `$${USD_BALANCE}`;

describe('Switching between account from different networks', function (this: Suite) {
  it.only('Switch from Solana account to another Network account', async function () {
    await withSolanaAccountSnap(
      { title: this.test?.fullTitle() },
      async (driver) => {
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.check_pageIsLoaded();
        await headerNavbar.check_accountLabel('Solana 1');
        const accountListPage = new AccountListPage(driver);
        /*await accountListPage.check_accountValueAndSuffixDisplayed(
          "0.00011294SOL",
        );*/
      },
    );

    it('Show native token as main balance', async function () {
      await withSolanaAccountSnap(
        { title: this.test?.fullTitle() },
        async (driver) => {
          const headerNavbar = new HeaderNavbar(driver);
          await headerNavbar.check_pageIsLoaded();
          await headerNavbar.check_accountLabel('Solana 1');
          const accountListPage = new AccountListPage(driver);
          await headerNavbar.openSettingsPage();
          const settingsPage = new SettingsPage(driver);
          await settingsPage.toggleBalanceSetting();
          await settingsPage.closeSettingsPage()

        },
      );
    });
  });
});
