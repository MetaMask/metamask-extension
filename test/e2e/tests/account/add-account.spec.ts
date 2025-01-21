import { E2E_SRP } from '../../default-fixture';
import FixtureBuilder from '../../fixture-builder';
import { ACCOUNT_TYPE } from '../../constants';
import {
  WALLET_PASSWORD,
  defaultGanacheOptions,
  withFixtures,
} from '../../helpers';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import { completeImportSRPOnboardingFlow } from '../../page-objects/flows/onboarding.flow';
import { sendRedesignedTransactionToAccount } from '../../page-objects/flows/send-transaction.flow';
import AccountListPage from '../../page-objects/pages/account-list-page';
import ActivityListPage from '../../page-objects/pages/home/activity-list';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import HomePage from '../../page-objects/pages/home/homepage';
import LoginPage from '../../page-objects/pages/login-page';
import ResetPasswordPage from '../../page-objects/pages/reset-password-page';

describe('Add account', function () {
  it('should not affect public address when using secret recovery phrase to recover account with non-zero balance @no-mmi', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder({ onboarding: true }).build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test?.fullTitle(),
      },
      async ({ driver, ganacheServer }) => {
        await completeImportSRPOnboardingFlow({ driver });

        const homePage = new HomePage(driver);
        await homePage.check_pageIsLoaded();
        await homePage.check_localBlockchainBalanceIsDisplayed(ganacheServer);
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.openAccountMenu();

        // Create new account with default name `newAccountName`
        const newAccountName = 'Account 2';
        const accountListPage = new AccountListPage(driver);
        await accountListPage.check_pageIsLoaded();
        await accountListPage.addAccount({
          accountType: ACCOUNT_TYPE.Ethereum,
        });
        await headerNavbar.check_accountLabel(newAccountName);
        await homePage.check_expectedBalanceIsDisplayed();

        // Switch back to the first account and transfer some balance to 2nd account so they will not be removed after recovering SRP
        await headerNavbar.openAccountMenu();
        await accountListPage.check_pageIsLoaded();
        await accountListPage.check_accountDisplayedInAccountList('Account 1');
        await accountListPage.switchToAccount('Account 1');
        await headerNavbar.check_accountLabel('Account 1');
        await homePage.check_localBlockchainBalanceIsDisplayed(ganacheServer);

        await sendRedesignedTransactionToAccount({
          driver,
          recipientAccount: newAccountName,
          amount: '2.8',
        });

        await homePage.check_pageIsLoaded();
        const activityList = new ActivityListPage(driver);
        await activityList.check_confirmedTxNumberDisplayedInActivity();
        await activityList.check_txAmountInActivity('-2.8 ETH');

        // Lock wallet and recover via SRP in "forget password" option
        await headerNavbar.lockMetaMask();
        await new LoginPage(driver).gotoResetPasswordPage();
        const resetPasswordPage = new ResetPasswordPage(driver);
        await resetPasswordPage.check_pageIsLoaded();
        await resetPasswordPage.resetPassword(E2E_SRP, WALLET_PASSWORD);

        // Check wallet balance for both accounts
        await homePage.check_pageIsLoaded();
        await homePage.check_localBlockchainBalanceIsDisplayed(ganacheServer);
        await headerNavbar.openAccountMenu();
        await accountListPage.check_pageIsLoaded();
        await accountListPage.check_accountDisplayedInAccountList(
          newAccountName,
        );
        await accountListPage.switchToAccount(newAccountName);
        await headerNavbar.check_accountLabel(newAccountName);
        await homePage.check_expectedBalanceIsDisplayed('2.8');
      },
    );
  });

  it('should be possible to remove an account imported with a private key, but should not be possible to remove an account generated from the SRP imported in onboarding @no-mmi', async function () {
    const testPrivateKey: string =
      '14abe6f4aab7f9f626fe981c864d0adeb5685f289ac9270c27b8fd790b4235d6';

    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);
        const headerNavbar = new HeaderNavbar(driver);
        const homePage = new HomePage(driver);
        await headerNavbar.openAccountMenu();

        // Create new account with default name Account 2
        const accountListPage = new AccountListPage(driver);
        await accountListPage.check_pageIsLoaded();
        await accountListPage.addAccount({
          accountType: ACCOUNT_TYPE.Ethereum,
        });
        await headerNavbar.check_accountLabel('Account 2');
        await homePage.check_expectedBalanceIsDisplayed();

        // Check user cannot delete 2nd account generated from the SRP imported in onboarding
        await headerNavbar.openAccountMenu();
        await accountListPage.check_removeAccountButtonIsNotDisplayed(
          'Account 1',
        );

        // Create 3rd account with private key
        await accountListPage.addNewImportedAccount(testPrivateKey);
        await headerNavbar.check_accountLabel('Account 3');
        await homePage.check_expectedBalanceIsDisplayed();

        // Remove the 3rd account imported with a private key
        await headerNavbar.openAccountMenu();
        await accountListPage.removeAccount('Account 3');
        await homePage.check_pageIsLoaded();
        await homePage.check_expectedBalanceIsDisplayed();
        await headerNavbar.openAccountMenu();
        await accountListPage.check_accountIsNotDisplayedInAccountList(
          'Account 3',
        );
      },
    );
  });
});
