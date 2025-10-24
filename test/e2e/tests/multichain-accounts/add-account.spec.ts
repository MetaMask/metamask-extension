import { E2E_SRP } from '../../default-fixture';
import { WALLET_PASSWORD } from '../../helpers';
import { sendRedesignedTransactionToAccount } from '../../page-objects/flows/send-transaction.flow';
import AccountListPage from '../../page-objects/pages/account-list-page';
import ActivityListPage from '../../page-objects/pages/home/activity-list';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import HomePage from '../../page-objects/pages/home/homepage';
import LoginPage from '../../page-objects/pages/login-page';
import ResetPasswordPage from '../../page-objects/pages/reset-password-page';
import MultichainAccountDetailsPage from '../../page-objects/pages/multichain/multichain-account-details-page';
import { Driver } from '../../webdriver/driver';
import { withMultichainAccountsDesignEnabled } from './common';

describe('Add account', function () {
  const SECOND_ACCOUNT_NAME = 'Account 2';
  const IMPORTED_ACCOUNT_NAME = 'Imported Account 1';

  it('should not affect public address when using secret recovery phrase to recover account with non-zero balance', async function () {
    await withMultichainAccountsDesignEnabled(
      {
        title: this.test?.fullTitle(),
      },
      async (driver: Driver) => {
        const accountListPage = new AccountListPage(driver);
        await accountListPage.checkPageIsLoaded({
          isMultichainAccountsState2Enabled: true,
        });
        await accountListPage.addMultichainAccount();
        await accountListPage.checkAccountDisplayedInAccountList(
          SECOND_ACCOUNT_NAME,
        );
        await accountListPage.checkMultichainAccountBalanceDisplayed('0');
        await accountListPage.closeMultichainAccountsPage();

        await sendRedesignedTransactionToAccount({
          driver,
          recipientAccount: SECOND_ACCOUNT_NAME,
          amount: '2.8',
        });

        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        const activityList = new ActivityListPage(driver);
        await activityList.checkConfirmedTxNumberDisplayedInActivity();
        await activityList.checkTxAmountInActivity('-2.8 ETH');

        // Lock wallet and recover via SRP in "forget password" option
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.lockMetaMask();
        await new LoginPage(driver).gotoResetPasswordPage();
        const resetPasswordPage = new ResetPasswordPage(driver);
        await resetPasswordPage.checkPageIsLoaded();
        await resetPasswordPage.resetPassword(E2E_SRP, WALLET_PASSWORD);
        await resetPasswordPage.waitForSeedPhraseInputToNotBeVisible();

        // Check wallet balance for both accounts
        await homePage.checkPageIsLoaded();
        await homePage.checkHasAccountSyncingSyncedAtLeastOnce();
        // BUG 37030 With BIP44 enabled wallet is not showing balance
        // await homePage.checkLocalNodeBalanceIsDisplayed();
        await headerNavbar.openAccountsPage();
        await accountListPage.checkPageIsLoaded({
          isMultichainAccountsState2Enabled: true,
        });
        await accountListPage.checkAccountDisplayedInAccountList(
          SECOND_ACCOUNT_NAME,
        );
        await accountListPage.switchToAccount(SECOND_ACCOUNT_NAME);
        await headerNavbar.checkAccountLabel(SECOND_ACCOUNT_NAME);
        // BUG 37030 With BIP44 enabled wallet is not showing balance
        // await homePage.checkExpectedBalanceIsDisplayed('2.8');
      },
    );
  });

  it('should be possible to remove an account imported with a private key, but should not be possible to remove an account generated from the SRP imported in onboarding', async function () {
    const testPrivateKey: string =
      '14abe6f4aab7f9f626fe981c864d0adeb5685f289ac9270c27b8fd790b4235d6';

    await withMultichainAccountsDesignEnabled(
      {
        title: this.test?.fullTitle(),
      },
      async (driver: Driver) => {
        const accountListPage = new AccountListPage(driver);
        await accountListPage.checkPageIsLoaded({
          isMultichainAccountsState2Enabled: true,
        });
        await accountListPage.addMultichainAccount();
        await accountListPage.checkAccountDisplayedInAccountList(
          SECOND_ACCOUNT_NAME,
        );
        await accountListPage.checkMultichainAccountBalanceDisplayed('0');
        await accountListPage.openMultichainAccountMenu({
          accountLabel: SECOND_ACCOUNT_NAME,
        });
        await accountListPage.clickMultichainAccountMenuItem('Account details');
        // Check user cannot delete 2nd account
        const accountDetailsPage = new MultichainAccountDetailsPage(driver);
        await accountDetailsPage.checkPageIsLoaded();
        const buttonPresent =
          await accountDetailsPage.checkRemoveAccountButtonPresent();
        if (buttonPresent) {
          throw new Error('Expected remove button not to be present');
        }
        await accountDetailsPage.navigateBack();

        // Create 3rd account with private key
        await accountListPage.addNewImportedAccount(testPrivateKey, undefined, {
          isMultichainAccountsState2Enabled: true,
        });

        await accountListPage.checkAccountDisplayedInAccountList(
          IMPORTED_ACCOUNT_NAME,
        );
        await accountListPage.checkMultichainAccountBalanceDisplayed('0');

        // Remove the 3rd account imported with a private key
        await accountListPage.openMultichainAccountMenu({
          accountLabel: IMPORTED_ACCOUNT_NAME,
        });
        await accountListPage.clickMultichainAccountMenuItem('Account details');
        // Check user cannot delete 2nd account
        await accountDetailsPage.checkPageIsLoaded();
        await accountDetailsPage.removeAccount();

        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.openAccountsPage();
        await accountListPage.checkPageIsLoaded({
          isMultichainAccountsState2Enabled: true,
        });
        await accountListPage.checkAccountNotDisplayedInAccountList(
          IMPORTED_ACCOUNT_NAME,
        );
      },
    );
  });
});
