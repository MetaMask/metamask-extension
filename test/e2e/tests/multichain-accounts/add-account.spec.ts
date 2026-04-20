import { Mockttp } from 'mockttp';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { withFixtures } from '../../helpers';
import { E2E_SRP, WALLET_PASSWORD } from '../../constants';
import { sendRedesignedTransactionToAccount } from '../../page-objects/flows/send-transaction.flow';
import {
  login,
  lockAndWaitForLoginPage,
} from '../../page-objects/flows/login.flow';
import AccountListPage from '../../page-objects/pages/account-list-page';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import ActivityListPage from '../../page-objects/pages/home/activity-list';
import HomePage from '../../page-objects/pages/home/homepage';
import LoginPage from '../../page-objects/pages/login-page';
import MultichainAccountDetailsPage from '../../page-objects/pages/multichain/multichain-account-details-page';
import ResetPasswordPage from '../../page-objects/pages/reset-password-page';
import { Driver } from '../../webdriver/driver';
import { MOCK_ETH_CONVERSION_RATE, mockPriceApi } from '../tokens/utils/mocks';

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
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2()
          .withShowNativeTokenAsMainBalanceDisabled()
          .withKeyringControllerMultiSRP()
          .withEnabledNetworks({ eip155: { '0x1': true } })
          .withCurrencyController({
            currencyRates: {
              ETH: {
                conversionDate: Date.now(),
                conversionRate: MOCK_ETH_CONVERSION_RATE,
                usdConversionRate: MOCK_ETH_CONVERSION_RATE,
              },
            },
          })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: async (mockServer: Mockttp) => {
          return [await mockPriceApi(mockServer)];
        },
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, { expectedBalance: '$85,025.00' });
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.openAccountMenu();

        const accountListPage = new AccountListPage(driver);
        await accountListPage.checkPageIsLoaded();
        await accountListPage.addMultichainAccount();
        await accountListPage.checkAccountDisplayedInAccountList(
          SECOND_ACCOUNT_NAME,
        );
        await accountListPage.checkMultichainAccountBalanceDisplayed({
          wallet: 'Wallet 1',
          account: SECOND_ACCOUNT_NAME,
          balance: '$0.00',
        });
        await accountListPage.closeMultichainAccountsPage();

        await sendRedesignedTransactionToAccount({
          driver,
          recipientAccount: SECOND_ACCOUNT_NAME,
          amount: '2.8',
        });

        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        const activityList = new ActivityListPage(driver);
        await activityList.checkTxAmountInActivity('-2.8 ETH');
        await activityList.waitPendingTxToNotBeVisible();
        await headerNavbar.openAccountMenu();
        await accountListPage.checkMultichainAccountBalanceDisplayed({
          wallet: 'Wallet 1',
          account: 'Account 1',
          balance: '$75,502.00',
        });
        await accountListPage.closeMultichainAccountsPage();

        // Lock wallet and recover via SRP in "forget password" option
        await lockAndWaitForLoginPage(driver);
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
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2()
          .withShowNativeTokenAsMainBalanceDisabled()
          .withKeyringControllerMultiSRP()
          .withEnabledNetworks({ eip155: { '0x1': true } })
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, { validateBalance: false });
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.openAccountMenu();

        const accountListPage = new AccountListPage(driver);
        await accountListPage.addNewImportedAccount(
          TEST_PRIVATE_KEY,
          undefined,
          { isMultichainAccountsState2Enabled: true },
        );

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

    await withFixtures(
      {
        fixtures: new FixtureBuilderV2()
          .withShowNativeTokenAsMainBalanceDisabled()
          .withKeyringControllerMultiSRP()
          .withEnabledNetworks({ eip155: { '0x1': true } })
          .withCurrencyController({
            currencyRates: {
              ETH: {
                conversionDate: Date.now(),
                conversionRate: MOCK_ETH_CONVERSION_RATE,
                usdConversionRate: MOCK_ETH_CONVERSION_RATE,
              },
            },
          })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: async (mockServer: Mockttp) => {
          return [await mockPriceApi(mockServer)];
        },
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, { validateBalance: false });
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.openAccountMenu();

        const accountListPage = new AccountListPage(driver);
        await accountListPage.checkPageIsLoaded();
        await accountListPage.addMultichainAccount();
        await accountListPage.checkAccountDisplayedInAccountList(
          SECOND_ACCOUNT_NAME,
        );
        await accountListPage.checkMultichainAccountBalanceDisplayed({
          account: SECOND_ACCOUNT_NAME,
          wallet: 'Wallet 1',
          balance: '$0.00',
        });
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
        await accountListPage.checkMultichainAccountBalanceDisplayed({
          account: IMPORTED_ACCOUNT_NAME,
          wallet: 'Imported accounts',
          balance: '$0.00',
        });

        // Remove the 3rd account imported with a private key
        await accountListPage.openMultichainAccountMenu({
          accountLabel: IMPORTED_ACCOUNT_NAME,
        });
        await accountListPage.clickMultichainAccountMenuItem('Account details');
        await accountDetailsPage.checkPageIsLoaded();
        await accountDetailsPage.removeAccount();

        await headerNavbar.openAccountMenu();
        await accountListPage.checkPageIsLoaded();
        await accountListPage.checkAccountNotDisplayedInAccountList(
          IMPORTED_ACCOUNT_NAME,
        );
      },
    );
  });

  it('added account should persist after wallet lock', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2()
          .withShowNativeTokenAsMainBalanceDisabled()
          .withKeyringControllerMultiSRP()
          .withEnabledNetworks({ eip155: { '0x1': true } })
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, { validateBalance: false });
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.openAccountMenu();

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

        await headerNavbar.checkAccountLabel(CUSTOM_ACCOUNT_NAME);

        // Lock and unlock wallet
        await lockAndWaitForLoginPage(driver);
        await login(driver, { validateBalance: false });

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
