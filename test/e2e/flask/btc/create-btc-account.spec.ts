import { strict as assert } from 'assert';
import { Suite } from 'mocha';
import { WALLET_PASSWORD } from '../../helpers';
import AccountListPage from '../../page-objects/pages/account-list-page';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import LoginPage from '../../page-objects/pages/login-page';
import PrivacySettings from '../../page-objects/pages/settings/privacy-settings';
import ResetPasswordPage from '../../page-objects/pages/reset-password-page';
import SettingsPage from '../../page-objects/pages/settings/settings-page';
import { withBtcAccountSnap } from './common-btc';

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
        await accountListPage.addNewBtcAccount({
          btcAccountCreationEnabled: false,
        });

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
        await accountListPage.removeAccount('Bitcoin Account', false);
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
        const accountAddress = await accountListPage.getAccountAddress(
          'Bitcoin Account',
        );
        await headerNavbar.openAccountMenu();
        await accountListPage.removeAccount('Bitcoin Account');

        // Recreate account and check that the address is the same
        await headerNavbar.openAccountMenu();
        await accountListPage.check_pageIsLoaded();
        await accountListPage.addNewBtcAccount();
        await headerNavbar.check_accountLabel('Bitcoin Account');

        await headerNavbar.openAccountMenu();
        await accountListPage.check_pageIsLoaded();
        const recreatedAccountAddress = await accountListPage.getAccountAddress(
          'Bitcoin Account',
        );

        assert(accountAddress === recreatedAccountAddress);
      },
    );
  });

  it('can recreate BTC account after restoring wallet with SRP', async function () {
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
        const accountAddress = await accountListPage.getAccountAddress(
          'Bitcoin Account',
        );

        // go to privacy settings page and get the SRP
        await headerNavbar.openSettingsPage();
        const settingsPage = new SettingsPage(driver);
        await settingsPage.check_pageIsLoaded();
        await settingsPage.goToPrivacySettings();

        const privacySettings = new PrivacySettings(driver);
        await privacySettings.check_pageIsLoaded();
        await privacySettings.openRevealSrpQuiz();
        await privacySettings.completeRevealSrpQuiz();
        await privacySettings.fillPasswordToRevealSrp(WALLET_PASSWORD);
        const seedPhrase = await privacySettings.getSrpInRevealSrpDialog();

        // lock metamask and reset wallet by clicking forgot password button
        await headerNavbar.lockMetaMask();
        await new LoginPage(driver).gotoResetPasswordPage();
        const resetPasswordPage = new ResetPasswordPage(driver);
        await resetPasswordPage.check_pageIsLoaded();
        await resetPasswordPage.resetPassword(seedPhrase, WALLET_PASSWORD);

        // create a BTC account and check that the address is the same
        await headerNavbar.check_pageIsLoaded();
        await headerNavbar.openAccountMenu();
        await accountListPage.check_pageIsLoaded();
        await accountListPage.addNewBtcAccount();
        await headerNavbar.check_accountLabel('Bitcoin Account');

        await headerNavbar.openAccountMenu();
        await accountListPage.check_pageIsLoaded();
        const recreatedAccountAddress = await accountListPage.getAccountAddress(
          'Bitcoin Account',
        );
        assert(accountAddress === recreatedAccountAddress);
      },
    );
  });
});
