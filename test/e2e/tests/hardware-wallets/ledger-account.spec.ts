import { Browser } from 'selenium-webdriver';
import FixtureBuilder from '../../fixture-builder';
import { withFixtures } from '../../helpers';
import { shortenAddress } from '../../../../ui/helpers/utils/util';
import { KNOWN_PUBLIC_KEY_ADDRESSES } from '../../../stub/keyring-bridge';
import AccountListPage from '../../page-objects/pages/account-list-page';
import ConnectHardwareWalletPage from '../../page-objects/pages/hardware-wallet/connect-hardware-wallet-page';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import HomePage from '../../page-objects/pages/home/homepage';
import SelectHardwareWalletAccountPage from '../../page-objects/pages/hardware-wallet/select-hardware-wallet-account-page';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';

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
        await accountListPage.check_pageIsLoaded();
        await accountListPage.openConnectHardwareWalletModal();

        const connectHardwareWalletPage = new ConnectHardwareWalletPage(driver);
        await connectHardwareWalletPage.check_pageIsLoaded();
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
        await selectLedgerAccountPage.check_pageIsLoaded();

        // Check that the first page of accounts is correct
        await selectLedgerAccountPage.check_accountNumber();
        for (const { address } of KNOWN_PUBLIC_KEY_ADDRESSES.slice(0, 4)) {
          const shortenedAddress = `${address.slice(0, 4)}...${address.slice(
            -4,
          )}`;
          await selectLedgerAccountPage.check_addressIsDisplayed(
            shortenedAddress,
          );
        }

        // Unlock first account of first page and check that the correct account has been added
        await selectLedgerAccountPage.unlockAccount(1);
        await headerNavbar.check_pageIsLoaded();
        await new HomePage(driver).check_expectedBalanceIsDisplayed('0');
        await headerNavbar.openAccountMenu();
        await accountListPage.check_pageIsLoaded();
        await accountListPage.check_accountDisplayedInAccountList('Ledger 1');
        await accountListPage.check_accountAddressDisplayedInAccountList(
          shortenAddress(KNOWN_PUBLIC_KEY_ADDRESSES[0].address),
        );
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
        await accountListPage.check_pageIsLoaded();
        await accountListPage.openConnectHardwareWalletModal();

        const connectHardwareWalletPage = new ConnectHardwareWalletPage(driver);
        await connectHardwareWalletPage.check_pageIsLoaded();
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
        await selectLedgerAccountPage.check_pageIsLoaded();
        await selectLedgerAccountPage.check_accountNumber();
        for (let i = 1; i <= 5; i++) {
          await selectLedgerAccountPage.selectAccount(i);
        }
        await selectLedgerAccountPage.clickUnlockButton();

        // Check that all 5 Ledger accounts are displayed in account list
        const homePage = new HomePage(driver);
        await homePage.check_pageIsLoaded();
        await homePage.check_expectedBalanceIsDisplayed('0');
        await headerNavbar.openAccountMenu();
        await accountListPage.check_pageIsLoaded();
        for (let i = 0; i < 5; i++) {
          await accountListPage.check_accountDisplayedInAccountList(
            `Ledger ${i + 1}`,
          );
          await accountListPage.check_accountAddressDisplayedInAccountList(
            shortenAddress(KNOWN_PUBLIC_KEY_ADDRESSES[i].address),
          );
        }

        // Remove Ledger 1 account and check Ledger 1 account is removed
        await accountListPage.removeAccount('Ledger 1');
        await homePage.check_pageIsLoaded();
        await homePage.check_expectedBalanceIsDisplayed('0');
        await headerNavbar.openAccountMenu();
        await accountListPage.check_accountIsNotDisplayedInAccountList(
          'Ledger 1',
        );
      },
    );
  });
});
