import { Mockttp } from 'mockttp';
import { E2E_SRP } from '../../default-fixture';
import FixtureBuilder from '../../fixture-builder';
import { ACCOUNT_TYPE } from '../../constants';
import { WALLET_PASSWORD, withFixtures } from '../../helpers';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import { completeImportSRPOnboardingFlow } from '../../page-objects/flows/onboarding.flow';
import { sendRedesignedTransactionToAccount } from '../../page-objects/flows/send-transaction.flow';
import AccountListPage from '../../page-objects/pages/account-list-page';
import ActivityListPage from '../../page-objects/pages/home/activity-list';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import HomePage from '../../page-objects/pages/home/homepage';
import LoginPage from '../../page-objects/pages/login-page';
import ResetPasswordPage from '../../page-objects/pages/reset-password-page';
import { mockNftApiCall } from '../identity/mocks';

describe('Add account', function () {
  const localNodeOptions = {
    accounts: 1,
  };
  it('should not affect public address when using secret recovery phrase to recover account with non-zero balance', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder({ onboarding: true }).build(),
        localNodeOptions,
        title: this.test?.fullTitle(),
        testSpecificMock: async (server: Mockttp) => {
          await mockNftApiCall(
            server,
            '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
          );
        },
      },
      async ({ driver, localNodes }) => {
        await completeImportSRPOnboardingFlow({ driver });

        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await homePage.checkLocalNodeBalanceIsDisplayed(localNodes[0]);
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.openAccountMenu();

        // Create new account with default name `newAccountName`
        const newAccountName = 'Account 2';
        const accountListPage = new AccountListPage(driver);
        await accountListPage.checkPageIsLoaded();
        await accountListPage.addAccount({
          accountType: ACCOUNT_TYPE.Ethereum,
        });
        await headerNavbar.checkAccountLabel(newAccountName);
        await homePage.checkExpectedBalanceIsDisplayed('0');

        // Switch back to the first account and transfer some balance to 2nd account so they will not be removed after recovering SRP
        await headerNavbar.openAccountMenu();
        await accountListPage.checkPageIsLoaded();
        await accountListPage.checkAccountDisplayedInAccountList('Account 1');
        await accountListPage.switchToAccount('Account 1');
        await headerNavbar.checkAccountLabel('Account 1');
        await homePage.checkLocalNodeBalanceIsDisplayed(localNodes[0]);

        await sendRedesignedTransactionToAccount({
          driver,
          recipientAccount: newAccountName,
          amount: '2.8',
        });

        await homePage.checkPageIsLoaded();
        const activityList = new ActivityListPage(driver);
        await activityList.checkConfirmedTxNumberDisplayedInActivity();
        await activityList.checkTxAmountInActivity('-2.8 ETH');

        // Lock wallet and recover via SRP in "forget password" option
        await headerNavbar.lockMetaMask();
        await new LoginPage(driver).gotoResetPasswordPage();
        const resetPasswordPage = new ResetPasswordPage(driver);
        await resetPasswordPage.checkPageIsLoaded();
        await resetPasswordPage.resetPassword(E2E_SRP, WALLET_PASSWORD);

        // Check wallet balance for both accounts
        await homePage.checkPageIsLoaded();
        await homePage.checkLocalNodeBalanceIsDisplayed(localNodes[0]);
        await headerNavbar.openAccountMenu();
        await accountListPage.checkPageIsLoaded();
        await accountListPage.checkAccountDisplayedInAccountList(
          newAccountName,
        );
        await accountListPage.switchToAccount(newAccountName);
        await headerNavbar.checkAccountLabel(newAccountName);
        await homePage.checkExpectedBalanceIsDisplayed('2.8');
      },
    );
  });

  it('should be possible to remove an account imported with a private key, but should not be possible to remove an account generated from the SRP imported in onboarding', async function () {
    const testPrivateKey: string =
      '14abe6f4aab7f9f626fe981c864d0adeb5685f289ac9270c27b8fd790b4235d6';

    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        localNodeOptions,
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);
        const headerNavbar = new HeaderNavbar(driver);
        const homePage = new HomePage(driver);
        await headerNavbar.openAccountMenu();

        // Create new account with default name Account 2
        const accountListPage = new AccountListPage(driver);
        await accountListPage.checkPageIsLoaded();
        await accountListPage.addAccount({
          accountType: ACCOUNT_TYPE.Ethereum,
        });
        await headerNavbar.checkAccountLabel('Account 2');
        await homePage.checkExpectedBalanceIsDisplayed('0');

        // Check user cannot delete 2nd account generated from the SRP imported in onboarding
        await headerNavbar.openAccountMenu();
        await accountListPage.checkRemoveAccountButtonIsNotDisplayed(
          'Account 1',
        );

        // Create 3rd account with private key
        await accountListPage.addNewImportedAccount(testPrivateKey);
        await headerNavbar.checkAccountLabel('Account 3');
        await homePage.checkExpectedBalanceIsDisplayed('0');

        // Remove the 3rd account imported with a private key
        await headerNavbar.openAccountMenu();
        await accountListPage.removeAccount('Account 3');
        await homePage.checkPageIsLoaded();
        await homePage.checkExpectedBalanceIsDisplayed('0');
        await headerNavbar.openAccountMenu();
        await accountListPage.checkAccountIsNotDisplayedInAccountList(
          'Account 3',
        );
      },
    );
  });
});
