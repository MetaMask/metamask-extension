import { Browser } from 'selenium-webdriver';
import FixtureBuilder from '../../../fixtures/fixture-builder';
import { withFixtures } from '../../../helpers';
import { KNOWN_PUBLIC_KEY_ADDRESSES } from '../../../../stub/keyring-bridge';
import AccountListPage from '../../../page-objects/pages/account-list-page';
import ConnectHardwareWalletPage from '../../../page-objects/pages/hardware-wallet/connect-hardware-wallet-page';
import HeaderNavbar from '../../../page-objects/pages/header-navbar';
import HomePage from '../../../page-objects/pages/home/homepage';
import SelectHardwareWalletAccountPage from '../../../page-objects/pages/hardware-wallet/select-hardware-wallet-account-page';
import MultichainAccountDetailsPage from '../../../page-objects/pages/multichain/multichain-account-details-page';
import { loginWithBalanceValidation } from '../../../page-objects/flows/login.flow';
import { checkAccountAddressDisplayedInAccountList } from '../common';

describe('Ledger Hardware', function () {
  it('derives the correct accounts and unlocks the first account', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);

        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.openAccountMenu();

        // Choose connect hardware wallet from the account menu
        const accountListPage = new AccountListPage(driver);
        await accountListPage.checkPageIsLoaded();
        await accountListPage.openConnectHardwareWalletModal();

        const connectHardwareWalletPage = new ConnectHardwareWalletPage(driver);
        await connectHardwareWalletPage.checkPageIsLoaded();
        await connectHardwareWalletPage.clickConnectLedgerButton();

        // Check if browser is Firefox
        const isFirefox = process.env.SELENIUM_BROWSER === Browser.FIREFOX;

        if (isFirefox) {
          // In Firefox, we expect to see "Firefox Not Supported" message
          await connectHardwareWalletPage.checkFirefoxNotSupportedIsDisplayed();
          return; // Exit early for Firefox
        }

        // Click continue button when browser is not Firefox
        await connectHardwareWalletPage.clickContinueButton();

        // For non-Firefox browsers, continue with the existing test flow
        const selectLedgerAccountPage = new SelectHardwareWalletAccountPage(
          driver,
        );
        await selectLedgerAccountPage.checkPageIsLoaded();

        // Check that the first page of accounts is correct
        await selectLedgerAccountPage.checkAccountNumber();
        for (const { address } of KNOWN_PUBLIC_KEY_ADDRESSES.slice(0, 4)) {
          const shortenedAddress = `${address.slice(0, 4)}...${address.slice(
            -4,
          )}`;
          await selectLedgerAccountPage.checkAddressIsDisplayed(
            shortenedAddress,
          );
        }

        // Unlock first account of first page and check that the correct account has been added
        await selectLedgerAccountPage.unlockAccount(1);
        await headerNavbar.checkPageIsLoaded();
        await new HomePage(driver).checkBalanceEmptyStateIsDisplayed();
        await headerNavbar.openAccountMenu();
        await checkAccountAddressDisplayedInAccountList(driver, 'Ledger', 1);
      },
    );
  });

  it('unlocks multiple accounts at once and removes one', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.openAccountMenu();

        // Choose connect hardware wallet from the account menu
        const accountListPage = new AccountListPage(driver);
        await accountListPage.checkPageIsLoaded();
        await accountListPage.openConnectHardwareWalletModal();

        const connectHardwareWalletPage = new ConnectHardwareWalletPage(driver);
        await connectHardwareWalletPage.checkPageIsLoaded();
        await connectHardwareWalletPage.clickConnectLedgerButton();

        // Check if browser is Firefox
        const isFirefox = process.env.SELENIUM_BROWSER === Browser.FIREFOX;

        if (isFirefox) {
          // In Firefox, we expect to see "Firefox Not Supported" message
          await connectHardwareWalletPage.checkFirefoxNotSupportedIsDisplayed();
          return; // Exit early for Firefox
        }

        // Click continue button when browser is not Firefox
        await connectHardwareWalletPage.clickContinueButton();

        // For non-Firefox browsers, continue with the existing test flow
        // Unlock 5 Ledger accounts
        const selectLedgerAccountPage = new SelectHardwareWalletAccountPage(
          driver,
        );
        await selectLedgerAccountPage.checkPageIsLoaded();
        await selectLedgerAccountPage.checkAccountNumber();
        for (let i = 1; i <= 5; i++) {
          await selectLedgerAccountPage.selectAccount(i);
        }
        await selectLedgerAccountPage.clickUnlockButton();

        // Check that all 5 Ledger accounts are displayed in account list
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await homePage.checkBalanceEmptyStateIsDisplayed();
        await headerNavbar.openAccountMenu();
        await checkAccountAddressDisplayedInAccountList(driver, 'Ledger', 5);

        // Remove Ledger 1 account and check Ledger 1 account is removed
        await accountListPage.openMultichainAccountMenu({
          accountLabel: `Ledger Account 1`,
        });
        await accountListPage.clickMultichainAccountMenuItem('Account details');
        const accountDetailsPage = new MultichainAccountDetailsPage(driver);
        await accountDetailsPage.checkPageIsLoaded();
        await accountDetailsPage.clickRemoveAccountButton();
        await accountDetailsPage.clickRemoveAccountConfirmButton();
        await accountListPage.checkAccountIsNotDisplayedInAccountList(
          `Ledger Account 1`,
        );
      },
    );
  });
});
