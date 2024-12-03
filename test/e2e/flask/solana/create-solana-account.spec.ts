import { strict as assert } from 'assert';
import { Suite } from 'mocha';
import { WALLET_PASSWORD } from '../../helpers';
import AccountListPage from '../../page-objects/pages/account-list-page';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import LoginPage from '../../page-objects/pages/login-page';
import PrivacySettings from '../../page-objects/pages/settings/privacy-settings';
import ResetPasswordPage from '../../page-objects/pages/reset-password-page';
import SettingsPage from '../../page-objects/pages/settings/settings-page';
import { withSolanaAccountSnap } from './common-solana';
import { withBtcAccountSnap } from '../btc/common-btc';

describe('Create Solana Account', function (this: Suite) {
  it.only('create Solana account from the menu', async function () {
    await withBtcAccountSnap(
      { title: this.test?.fullTitle() },
      async (driver) => {
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.check_pageIsLoaded();
        await driver.delay(60000);
        await headerNavbar.check_accountLabel('Solana Account');
      },
    );
  });
/*
  it('cannot create multiple Solana accounts', async function () {
    await withSolanaAccountSnap(
      { title: this.test?.fullTitle() },
      async (driver) => {
        // check that we have one Solana account
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.check_pageIsLoaded();
        await headerNavbar.check_accountLabel('Solana Account');

        // check user cannot create second Solana account
        await headerNavbar.openAccountMenu();
        const accountListPage = new AccountListPage(driver);
        await accountListPage.check_pageIsLoaded();
        await accountListPage.addNewSolanaAccount({
          solanaAccountCreationEnabled: false,
        });

        // check the number of available accounts is 2
        await headerNavbar.openAccountMenu();
        await accountListPage.check_pageIsLoaded();
        await accountListPage.check_numberOfAvailableAccounts(2);
      },
    );
  });

  it('can cancel the removal of Solana account', async function () {
    await withSolanaAccountSnap(
      { title: this.test?.fullTitle() },
      async (driver) => {
        // check that we have one Solana account
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.check_pageIsLoaded();
        await headerNavbar.check_accountLabel('Solana Account');

        // check user can cancel the removal of the Solana account
        await headerNavbar.openAccountMenu();
        const accountListPage = new AccountListPage(driver);
        await accountListPage.check_pageIsLoaded();
        await accountListPage.removeAccount('Solana Account', false);
        await headerNavbar.check_accountLabel('Solana Account');

        // check the number of accounts. it should be 2.
        await headerNavbar.openAccountMenu();
        await accountListPage.check_pageIsLoaded();
        await accountListPage.check_numberOfAvailableAccounts(2);
      },
    );
  });

  it('can recreate Solana account after deleting it', async function () {
    await withSolanaAccountSnap(
      { title: this.test?.fullTitle() },
      async (driver) => {
        // check that we have one Solana account
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.check_pageIsLoaded();
        await headerNavbar.check_accountLabel('Solana Account');

        // get the address of the Solana account and remove it
        await headerNavbar.openAccountMenu();
        const accountListPage = new AccountListPage(driver);
        await accountListPage.check_pageIsLoaded();
        const accountAddress = await accountListPage.getAccountAddress(
          'Solana Account',
        );
        await headerNavbar.openAccountMenu();
        await accountListPage.removeAccount('Solana Account');

        // Recreate account and check that the address is the same
        await headerNavbar.openAccountMenu();
        await accountListPage.check_pageIsLoaded();
        await accountListPage.addNewSolanaAccount();
        await headerNavbar.check_accountLabel('Solana Account');

        await headerNavbar.openAccountMenu();
        await accountListPage.check_pageIsLoaded();
        const recreatedAccountAddress = await accountListPage.getAccountAddress(
          'Solana Account',
        );

        assert(accountAddress === recreatedAccountAddress);
      },
    );
  });

  it('can recreate Solana account after restoring wallet with SRP', async function () {
    await withSolanaAccountSnap(
      { title: this.test?.fullTitle() },
      async (driver) => {
        // check that we have one Solana account
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.check_pageIsLoaded();
        await headerNavbar.check_accountLabel('Solana Account');

        await headerNavbar.openAccountMenu();
        const accountListPage = new AccountListPage(driver);
        await accountListPage.check_pageIsLoaded();
        const accountAddress = await accountListPage.getAccountAddress(
          'Solana Account',
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

        // create a Solana account and check that the address is the same
        await headerNavbar.check_pageIsLoaded();
        await headerNavbar.openAccountMenu();
        await accountListPage.check_pageIsLoaded();
        await accountListPage.addNewSolanaAccount();
        await headerNavbar.check_accountLabel('Solana Account');

        await headerNavbar.openAccountMenu();
        await accountListPage.check_pageIsLoaded();
        const recreatedAccountAddress = await accountListPage.getAccountAddress(
          'Solana Account',
        );
        assert(accountAddress === recreatedAccountAddress);
      },
    );
  });
*/
});
