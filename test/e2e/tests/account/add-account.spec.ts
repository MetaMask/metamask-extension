import { strict as assert } from 'assert';
import {
  TEST_SEED_PHRASE,
  withFixtures,
  findAnotherAccountFromAccountList,
  locateAccountBalanceDOM,
  regularDelayMs,
  unlockWallet,
  WALLET_PASSWORD,
  generateGanacheOptions,
  defaultGanacheOptions,
} from '../../helpers';
import { E2E_SRP } from '../../default-fixture';
import FixtureBuilder from '../../fixture-builder';
import HomePage from '../../page-objects/pages/homepage';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import AccountListPage from '../../page-objects/pages/account-list-page';
import LoginPage from '../../page-objects/pages/login-page';
import ResetPasswordPage from '../../page-objects/pages/reset-password-page';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import {
  completeImportSRPOnboardingFlow,
} from '../../page-objects/flows/onboarding.flow';
import { sendTransactionToAccount } from '../../page-objects/flows/send-transaction.flow';

describe('Add account', function () {
  const secondAccount: string = '0x3ED0eE22E0685Ebbf07b2360A8331693c413CC59';

  const ganacheOptions = generateGanacheOptions({
    secretKey:
      '0x53CB0AB5226EEBF4D872113D98332C1555DC304443BEE1CF759D15798D3C55A9',
  });

  it('should not affect public address when using secret recovery phrase to recover account with non-zero balance @no-mmi', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder({ onboarding: true }).build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test?.fullTitle(),
      },
      async ({ driver, ganacheServer }) => {
        await completeImportSRPOnboardingFlow(driver);
        const homePage = new HomePage(driver);
        await homePage.check_pageIsLoaded();
        await homePage.check_ganacheBalanceIsDisplayed(ganacheServer);
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.openAccountMenu();

        // Create new account with default name Account 2
        const accountListPage = new AccountListPage(driver);
        await accountListPage.check_pageIsLoaded();
        await accountListPage.addNewAccountWithDefaultName();
        await headerNavbar.check_accountLabel('Account 2');
        await homePage.check_expectedBalanceIsDisplayed();

        // Switch back to the first account and transfer some balance to 2nd account so they will not be removed after recovering SRP
        await headerNavbar.openAccountMenu();
        await accountListPage.check_pageIsLoaded();
        await accountListPage.check_accountDisplayedInAccountList(
          'Account 1',
        );
        await accountListPage.switchToAccount('Account 1');
        await headerNavbar.check_accountLabel('Account 1');
        await homePage.check_ganacheBalanceIsDisplayed(ganacheServer);
        await sendTransactionToAccount(
          driver,
          'Account 2',
          '2.8',
          '0.000042',
          '2.800042',
        );
        await homePage.check_pageIsLoaded();
        await homePage.check_confirmedTxNumberDisplayedInActivity();
        await homePage.check_txAmountInActivity('-2.8 ETH');

        // Lock wallet and recover via SRP in "forget password" option
        await headerNavbar.lockMetaMask();
        await new LoginPage(driver).gotoResetPasswordPage();
        const resetPasswordPage = new ResetPasswordPage(driver);
        await resetPasswordPage.check_pageIsLoaded();
        await resetPasswordPage.resetPassword(E2E_SRP, WALLET_PASSWORD);

        // Check wallet balance for both accounts
        await homePage.check_pageIsLoaded();
        await homePage.check_ganacheBalanceIsDisplayed(ganacheServer);
        await headerNavbar.openAccountMenu();
        await accountListPage.check_pageIsLoaded();
        await accountListPage.check_accountDisplayedInAccountList(
          'Account 2',
        );
        await accountListPage.switchToAccount('Account 2');
        await headerNavbar.check_accountLabel('Account 2');
        await homePage.check_expectedBalanceIsDisplayed('2.8');
      },
    );
  });

  it.only('should be possible to remove an account imported with a private key, but should not be possible to remove an account generated from the SRP imported in onboarding @no-mmi', async function () {
    const testPrivateKey: string =
      '14abe6f4aab7f9f626fe981c864d0adeb5685f289ac9270c27b8fd790b4235d6';

    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: any }) => {
        await loginWithBalanceValidation(driver);
        const headerNavbar = new HeaderNavbar(driver);
        const homePage = new HomePage(driver);
        await headerNavbar.openAccountMenu();

        // Create new account with default name Account 2
        const accountListPage = new AccountListPage(driver);
        await accountListPage.check_pageIsLoaded();
        await accountListPage.addNewAccountWithDefaultName();
        await headerNavbar.check_accountLabel('Account 2');
        await homePage.check_expectedBalanceIsDisplayed();





        await driver.clickElement(
          '.multichain-account-list-item--selected [data-testid="account-list-item-menu-button"]',
        );
        await driver.assertElementNotPresent(
          '[data-testid="account-list-menu-remove"]',
        );

        await driver.clickElement('.mm-text-field');
        await driver.clickElement(
          '[data-testid="multichain-account-menu-popover-action-button"]',
        );
        await driver.clickElement({ text: 'Import account', tag: 'button' });
        await driver.fill('#private-key-box', testPrivateKey);

        await driver.clickElement(
          '[data-testid="import-account-confirm-button"]',
        );

        await locateAccountBalanceDOM(driver);
        await driver.findElement({
          css: '[data-testid="account-menu-icon"]',
          text: 'Account 3',
        });

        await driver.clickElement('[data-testid="account-menu-icon"]');
        const importedMenuItems = await driver.findElements(
          '.multichain-account-list-item',
        );
        assert.equal(importedMenuItems.length, 3);
        await driver.clickElement(
          '.multichain-account-list-item--selected [data-testid="account-list-item-menu-button"]',
        );
        await driver.findElement('[data-testid="account-list-menu-remove"]');
      },
    );
  });
});