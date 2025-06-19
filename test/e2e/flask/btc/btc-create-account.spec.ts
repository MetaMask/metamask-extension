import { strict as assert } from 'assert';
import { Suite } from 'mocha';
import { WALLET_PASSWORD } from '../../helpers';
import AccountDetailsModal from '../../page-objects/pages/dialog/account-details-modal';
import AccountListPage from '../../page-objects/pages/account-list-page';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import LoginPage from '../../page-objects/pages/login-page';
import PrivacySettings from '../../page-objects/pages/settings/privacy-settings';
import ResetPasswordPage from '../../page-objects/pages/reset-password-page';
import SettingsPage from '../../page-objects/pages/settings/settings-page';
import { ACCOUNT_TYPE, DEFAULT_BTC_ACCOUNT_NAME } from '../../constants';
import { withBtcAccountSnap } from './common-btc';

describe('Create BTC Account', function (this: Suite) {
  it('create BTC account from the menu', async function () {
    await withBtcAccountSnap(async (driver) => {
      const headerNavbar = new HeaderNavbar(driver);
      await headerNavbar.check_pageIsLoaded();
      await headerNavbar.check_accountLabel(DEFAULT_BTC_ACCOUNT_NAME);
    }, this.test?.fullTitle());
  });

  it('can create multiple BTC accounts', async function () {
    await withBtcAccountSnap(async (driver) => {
      // check that we have one BTC account
      const headerNavbar = new HeaderNavbar(driver);
      await headerNavbar.check_pageIsLoaded();
      await headerNavbar.check_accountLabel(DEFAULT_BTC_ACCOUNT_NAME);

      // check user cannot create second BTC account
      await headerNavbar.openAccountMenu();
      const accountListPage = new AccountListPage(driver);
      await accountListPage.check_pageIsLoaded();
      await accountListPage.check_numberOfAvailableAccounts(2);
      await accountListPage.openAddAccountModal();
      assert.equal(
        await accountListPage.isBtcAccountCreationButtonEnabled(),
        true,
      );
    }, this.test?.fullTitle());
  });

  it('can cancel the removal of BTC account', async function () {
    await withBtcAccountSnap(async (driver) => {
      // check that we have one BTC account
      const headerNavbar = new HeaderNavbar(driver);
      await headerNavbar.check_pageIsLoaded();
      await headerNavbar.check_accountLabel(DEFAULT_BTC_ACCOUNT_NAME);

      // check user can cancel the removal of the BTC account
      await headerNavbar.openAccountMenu();
      const accountListPage = new AccountListPage(driver);
      await accountListPage.check_pageIsLoaded();
      await accountListPage.removeAccount(DEFAULT_BTC_ACCOUNT_NAME, false);
      await headerNavbar.check_accountLabel(DEFAULT_BTC_ACCOUNT_NAME);

      // check the number of accounts. it should be 2.
      await headerNavbar.openAccountMenu();
      await accountListPage.check_pageIsLoaded();
      await accountListPage.check_numberOfAvailableAccounts(2);
    }, this.test?.fullTitle());
  });

  it('can recreate BTC account after deleting it', async function () {
    await withBtcAccountSnap(async (driver) => {
      // check that we have one BTC account
      const headerNavbar = new HeaderNavbar(driver);
      await headerNavbar.check_pageIsLoaded();
      await headerNavbar.check_accountLabel(DEFAULT_BTC_ACCOUNT_NAME);

      // get the address of the BTC account and remove it
      await headerNavbar.openAccountMenu();
      const accountListPage = new AccountListPage(driver);
      await accountListPage.check_pageIsLoaded();
      await accountListPage.openAccountDetailsModal(DEFAULT_BTC_ACCOUNT_NAME);

      const accountDetailsModal = new AccountDetailsModal(driver);
      await accountDetailsModal.check_pageIsLoaded();
      const accountAddress = await accountDetailsModal.getAccountAddress();
      await headerNavbar.openAccountMenu();
      await accountListPage.removeAccount(DEFAULT_BTC_ACCOUNT_NAME);

      // Recreate account and check that the address is the same
      await headerNavbar.openAccountMenu();
      await accountListPage.openAddAccountModal();
      assert.equal(
        await accountListPage.isBtcAccountCreationButtonEnabled(),
        true,
      );
      await accountListPage.closeAccountModal();
      await headerNavbar.openAccountMenu();
      await accountListPage.addAccount({ accountType: ACCOUNT_TYPE.Bitcoin });
      await headerNavbar.check_accountLabel(DEFAULT_BTC_ACCOUNT_NAME);

      await headerNavbar.openAccountMenu();
      await accountListPage.check_pageIsLoaded();
      await accountListPage.openAccountDetailsModal(DEFAULT_BTC_ACCOUNT_NAME);
      await accountDetailsModal.check_pageIsLoaded();
      const recreatedAccountAddress =
        await accountDetailsModal.getAccountAddress();

      assert(accountAddress === recreatedAccountAddress);
    }, this.test?.fullTitle());
  });

  it('can recreate BTC account after restoring wallet with SRP', async function () {
    await withBtcAccountSnap(async (driver) => {
      // check that we have one BTC account
      const headerNavbar = new HeaderNavbar(driver);
      await headerNavbar.check_pageIsLoaded();
      await headerNavbar.check_accountLabel(DEFAULT_BTC_ACCOUNT_NAME);

      await headerNavbar.openAccountMenu();
      const accountListPage = new AccountListPage(driver);
      await accountListPage.check_pageIsLoaded();
      await accountListPage.openAccountDetailsModal(DEFAULT_BTC_ACCOUNT_NAME);
      const accountDetailsModal = new AccountDetailsModal(driver);
      await accountDetailsModal.check_pageIsLoaded();
      const accountAddress = await accountDetailsModal.getAccountAddress();

      // go to privacy settings page and get the SRP
      await headerNavbar.openSettingsPage();
      const settingsPage = new SettingsPage(driver);
      await settingsPage.goToPrivacySettings();

      const privacySettings = new PrivacySettings(driver);
      await privacySettings.openRevealSrpQuiz();
      await privacySettings.completeRevealSrpQuiz();
      await privacySettings.fillPasswordToRevealSrp(WALLET_PASSWORD);
      const seedPhrase = await privacySettings.getSrpInRevealSrpDialog();
      await driver.clickElement({ tag: 'button', text: 'Close' });
      await driver.clickElement(
        '.settings-page__header__title-container__close-button',
      );

      // lock metamask and reset wallet by clicking forgot password button
      await headerNavbar.lockMetaMask();
      await new LoginPage(driver).gotoResetPasswordPage();
      const resetPasswordPage = new ResetPasswordPage(driver);
      await resetPasswordPage.check_pageIsLoaded();
      await resetPasswordPage.resetPassword(seedPhrase, WALLET_PASSWORD);

      // check discovered account address is the same
      await headerNavbar.openAccountMenu();
      await accountListPage.check_pageIsLoaded();
      await accountListPage.openAccountDetailsModal(DEFAULT_BTC_ACCOUNT_NAME);
      await accountDetailsModal.check_pageIsLoaded();
      const discoveredAccountAddress =
        await accountDetailsModal.getAccountAddress();

      assert(accountAddress === discoveredAccountAddress);
    }, this.test?.fullTitle());
  });
});
