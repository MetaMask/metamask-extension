import { strict as assert } from 'assert';
import { Suite } from 'mocha';

import {
  WALLET_PASSWORD,
  completeSRPRevealQuiz,
  getSelectedAccountAddress,
  openSRPRevealQuiz,
  removeSelectedAccount,
  tapAndHoldToRevealSRP,
} from '../../helpers';
import { withBtcAccountSnap } from './common-btc';
import AccountListPage from '../../page-objects/pages/account-list-page';
import HeaderNavbar from '../../page-objects/pages/header-navbar';

describe('Create BTC Account', function (this: Suite) {
  it('create BTC account from the menu', async function () {
    await withBtcAccountSnap(
      { title: this.test?.fullTitle() },
      async (driver) => {
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.check_pageIsLoaded();
        await headerNavbar.check_accountLabel('Bitcoin Account');
      },
    );
  });

  it('cannot create multiple BTC accounts', async function () {
    await withBtcAccountSnap(
      { title: this.test?.fullTitle() },
      async (driver) => {
        // check that we have one BTC account
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.check_pageIsLoaded();
        await headerNavbar.check_accountLabel('Bitcoin Account');

        // check user cannot create second BTC account
        await headerNavbar.openAccountMenu();
        const accountListPage = new AccountListPage(driver);
        await accountListPage.check_pageIsLoaded();
        await accountListPage.addNewBtcAccountWithDefaultName(false);

        // check the number of available accounts is 2
        await headerNavbar.openAccountMenu();
        await accountListPage.check_pageIsLoaded();
        await accountListPage.check_numberOfAvailableAccounts(2);
      },
    );
  });

  it('can cancel the removal of BTC account', async function () {
    await withBtcAccountSnap(
      { title: this.test?.fullTitle() },
      async (driver) => {
        // check that we have one BTC account
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.check_pageIsLoaded();
        await headerNavbar.check_accountLabel('Bitcoin Account');

        // check user can cancel the removal of the BTC account
        await headerNavbar.openAccountMenu();
        const accountListPage = new AccountListPage(driver);
        await accountListPage.check_pageIsLoaded();
        await accountListPage.removeAccount(
          'Bitcoin Account', false
        );
        await headerNavbar.check_accountLabel('Bitcoin Account');

        // check the number of accounts. it should be 2.
        await headerNavbar.openAccountMenu();
        await accountListPage.check_pageIsLoaded();
        await accountListPage.check_numberOfAvailableAccounts(2);
      },
    );
  });

  it('can recreate BTC account after deleting it', async function () {
    await withBtcAccountSnap(
      { title: this.test?.fullTitle() },
      async (driver) => {
        // check that we have one BTC account
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.check_pageIsLoaded();
        await headerNavbar.check_accountLabel('Bitcoin Account');

        // get the address of the BTC account and remove it
        await headerNavbar.openAccountMenu();
        const accountListPage = new AccountListPage(driver);
        await accountListPage.check_pageIsLoaded();
        const accountAddress = await accountListPage.getAccountAddress('Bitcoin Account');
        await headerNavbar.openAccountMenu();
        await accountListPage.removeAccount('Bitcoin Account');

        // Recreate account and check that the address is the same
        await headerNavbar.openAccountMenu();
        await accountListPage.check_pageIsLoaded();
        await accountListPage.addNewBtcAccountWithDefaultName();
        await headerNavbar.check_accountLabel('Bitcoin Account');

        await headerNavbar.openAccountMenu();
        await accountListPage.check_pageIsLoaded();
        const recreatedAccountAddress = await accountListPage.getAccountAddress('Bitcoin Account');

        assert(accountAddress === recreatedAccountAddress);
        console.log('Recreated account address: ' + recreatedAccountAddress);
      },
    );
  });

  it.only('can recreate BTC account after restoring wallet with SRP', async function () {
    await withBtcAccountSnap(
      { title: this.test?.fullTitle() },
      async (driver) => {
        // check that we have one BTC account
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.check_pageIsLoaded();
        await headerNavbar.check_accountLabel('Bitcoin Account');

        await headerNavbar.openAccountMenu();
        const accountListPage = new AccountListPage(driver);
        await accountListPage.check_pageIsLoaded();
        const accountAddress = await accountListPage.getAccountAddress('Bitcoin Account');

        await openSRPRevealQuiz(driver);
        await completeSRPRevealQuiz(driver);
        await driver.fill('[data-testid="input-password"]', WALLET_PASSWORD);
        await driver.press('[data-testid="input-password"]', driver.Key.ENTER);
        await tapAndHoldToRevealSRP(driver);
        const seedPhrase = await (
          await driver.findElement('[data-testid="srp_text"]')
        ).getText();

        // Reset wallet
        await driver.clickElement(
          '[data-testid="account-options-menu-button"]',
        );
        await driver.clickElement({
          css: '[data-testid="global-menu-lock"]',
          text: 'Lock MetaMask',
        });

        await driver.clickElement({
          text: 'Forgot password?',
          tag: 'a',
        });

        await driver.pasteIntoField(
          '[data-testid="import-srp__srp-word-0"]',
          seedPhrase,
        );

        await driver.fill(
          '[data-testid="create-vault-password"]',
          WALLET_PASSWORD,
        );
        await driver.fill(
          '[data-testid="create-vault-confirm-password"]',
          WALLET_PASSWORD,
        );

        await driver.clickElement({
          text: 'Restore',
          tag: 'button',
        });

        await createBtcAccount(driver);
        await driver.findElement({
          css: '[data-testid="account-menu-icon"]',
          text: 'Bitcoin Account',
        });

        const recreatedAccountAddress = await getSelectedAccountAddress(driver);
        assert(accountAddress === recreatedAccountAddress);
      },
    );
  });
});
