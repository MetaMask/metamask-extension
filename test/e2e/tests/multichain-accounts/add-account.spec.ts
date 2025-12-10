import { E2E_SRP } from '../../fixtures/default-fixture';
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
import { loginWithoutBalanceValidation } from '../../page-objects/flows/login.flow';
import { mockPriceApi } from '../tokens/utils/mocks';
import {
  withImportedAccount,
  withMultichainAccountsDesignEnabled,
} from './common';

const SECOND_ACCOUNT_NAME = 'Account 2';
const IMPORTED_ACCOUNT_NAME = 'Imported Account 1';
const CUSTOM_ACCOUNT_NAME = 'Custom 1';
const TEST_PRIVATE_KEY =
  '14abe6f4aab7f9f626fe981c864d0adeb5685f289ac9270c27b8fd790b4235d6';

const importedAccount = {
  name: 'Imported Account 1',
  address: '0x7A46ce51fbBB29C34aea1fE9833c27b5D2781925',
};

describe('Add account', function () {
  // BUG #38568 - Sending token crashes the Extension with BigNumber error
  // eslint-disable-next-line mocha/no-skipped-tests
  it.skip('should not affect public address when using secret recovery phrase to recover account with non-zero balance', async function () {
    await withMultichainAccountsDesignEnabled(
      {
        title: this.test?.fullTitle(),
        testSpecificMock: mockPriceApi,
      },
      async (driver: Driver) => {
        const accountListPage = new AccountListPage(driver);
        await accountListPage.checkPageIsLoaded();
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
        const headerNavbar = new HeaderNavbar(driver);
        await homePage.checkPageIsLoaded();
        const activityList = new ActivityListPage(driver);
        await activityList.checkTxAmountInActivity('-2.8 ETH');
        await activityList.waitPendingTxToNotBeVisible();
        await headerNavbar.openAccountMenu();
        await accountListPage.checkMultichainAccountBalanceDisplayed('75,502');
        await accountListPage.closeMultichainAccountsPage();

        // Lock wallet and recover via SRP in "forget password" option
        await headerNavbar.lockMetaMask();
        await new LoginPage(driver).gotoResetPasswordPage();
        const resetPasswordPage = new ResetPasswordPage(driver);
        await resetPasswordPage.checkPageIsLoaded();
        await resetPasswordPage.resetPassword(E2E_SRP, WALLET_PASSWORD);
        await resetPasswordPage.waitForPasswordInputToNotBeVisible();

        // Check wallet balance for both accounts
        await homePage.checkPageIsLoaded();
        await homePage.checkHasAccountSyncingSyncedAtLeastOnce();
        await homePage.checkExpectedBalanceIsDisplayed('75,502');
        await headerNavbar.openAccountMenu();
        await accountListPage.checkPageIsLoaded();
        await accountListPage.checkAccountDisplayedInAccountList(
          SECOND_ACCOUNT_NAME,
        );
        await accountListPage.switchToAccount(SECOND_ACCOUNT_NAME);
        await headerNavbar.checkAccountLabel(SECOND_ACCOUNT_NAME);
      },
    );
  });

  it('should remove imported private key account successfully', async function () {
    await withImportedAccount(
      {
        title: this.test?.fullTitle(),
        privateKey: TEST_PRIVATE_KEY,
        testSpecificMock: mockPriceApi,
      },
      async (driver: Driver) => {
        const accountListPage = new AccountListPage(driver);
        await accountListPage.checkPageIsLoaded();
        await accountListPage.openMultichainAccountMenu({
          accountLabel: importedAccount.name,
        });
        await accountListPage.clickMultichainAccountMenuItem('Account details');

        const accountDetailsPage = new MultichainAccountDetailsPage(driver);
        await accountDetailsPage.checkPageIsLoaded();

        await accountDetailsPage.clickRemoveAccountButton();

        await accountDetailsPage.clickRemoveAccountConfirmButton();

        await accountListPage.checkAccountIsNotDisplayedInAccountList(
          importedAccount.name,
        );
      },
    );
  });

  it('should be possible to remove an account imported with a private key, but should not be possible to remove an account generated from the SRP imported in onboarding', async function () {
    const testPrivateKey: string =
      '14abe6f4aab7f9f626fe981c864d0adeb5685f289ac9270c27b8fd790b4235d6';

    await withMultichainAccountsDesignEnabled(
      {
        title: this.test?.fullTitle(),
        testSpecificMock: mockPriceApi,
      },
      async (driver: Driver) => {
        const accountListPage = new AccountListPage(driver);
        await accountListPage.checkPageIsLoaded();
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
        await headerNavbar.openAccountMenu();
        await accountListPage.checkPageIsLoaded();
        await accountListPage.checkAccountNotDisplayedInAccountList(
          IMPORTED_ACCOUNT_NAME,
        );
      },
    );
  });

  it('added account should persiste after wallet lock', async function () {
    await withMultichainAccountsDesignEnabled(
      {
        title: this.test?.fullTitle(),
        testSpecificMock: mockPriceApi,
      },
      async (driver: Driver) => {
        const accountListPage = new AccountListPage(driver);
        await accountListPage.checkPageIsLoaded();
        await accountListPage.addMultichainAccount();
        await accountListPage.openMultichainAccountMenu({
          accountLabel: 'Account 2',
        });
        await accountListPage.clickMultichainAccountMenuItem('Rename');
        await accountListPage.changeMultichainAccountLabel(CUSTOM_ACCOUNT_NAME);

        await accountListPage.checkAccountDisplayedInAccountList(
          CUSTOM_ACCOUNT_NAME,
        );
        await accountListPage.switchToAccount(CUSTOM_ACCOUNT_NAME);

        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.checkAccountLabel(CUSTOM_ACCOUNT_NAME);

        // Lock and unlock wallet
        await headerNavbar.lockMetaMask();
        await loginWithoutBalanceValidation(driver);

        // Verify both account labels persist after unlock
        await headerNavbar.checkAccountLabel(CUSTOM_ACCOUNT_NAME);
        await headerNavbar.openAccountMenu();

        await accountListPage.checkPageIsLoaded();
        await accountListPage.checkAccountDisplayedInAccountList(
          CUSTOM_ACCOUNT_NAME,
        );
      },
    );
  });
});
