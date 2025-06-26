import FixtureBuilder from '../../fixture-builder';
import { withFixtures } from '../../helpers';
import { shortenAddress } from '../../../../ui/helpers/utils/util';
import { KNOWN_QR_ACCOUNTS } from '../../../stub/keyring-bridge';
import AccountListPage from '../../page-objects/pages/account-list-page';
import ConnectHardwareWalletPage from '../../page-objects/pages/hardware-wallet/connect-hardware-wallet-page';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import HomePage from '../../page-objects/pages/home/homepage';
import SelectHardwareWalletAccountPage from '../../page-objects/pages/hardware-wallet/select-hardware-wallet-account-page';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';

describe('QR Hardware', function () {
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
        await connectHardwareWalletPage.openConnectQRPage();

        const selectQRAccountPage = new SelectHardwareWalletAccountPage(driver);
        await selectQRAccountPage.check_pageIsLoaded();

        // Check that the first page of accounts is correct
        await selectQRAccountPage.check_accountNumber();
        for (const address of KNOWN_QR_ACCOUNTS.slice(0, 3)) {
          const shortenedAddress = `${address.slice(0, 4)}...${address.slice(
            -4,
          )}`;
          await selectQRAccountPage.check_addressIsDisplayed(shortenedAddress);
        }

        // Unlock first account of first page and check that the correct account has been added
        await selectQRAccountPage.unlockAccount(1);
        await headerNavbar.check_pageIsLoaded();
        await new HomePage(driver).check_expectedBalanceIsDisplayed('0');
        await headerNavbar.openAccountMenu();
        await accountListPage.check_pageIsLoaded();
        await accountListPage.check_accountDisplayedInAccountList('QR 1');
        await accountListPage.check_accountAddressDisplayedInAccountList(
          shortenAddress(KNOWN_QR_ACCOUNTS[0]),
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
        await connectHardwareWalletPage.openConnectQRPage();

        // Unlock 3 QR accounts
        const selectQRAccountPage = new SelectHardwareWalletAccountPage(driver);
        await selectQRAccountPage.check_pageIsLoaded();
        await selectQRAccountPage.check_accountNumber();
        for (let i = 1; i <= 3; i++) {
          await selectQRAccountPage.selectAccount(i);
        }
        await selectQRAccountPage.clickUnlockButton();

        // Check that all 3 QR accounts are displayed in account list
        const homePage = new HomePage(driver);
        await homePage.check_pageIsLoaded();
        await homePage.check_expectedBalanceIsDisplayed('0');
        await headerNavbar.openAccountMenu();
        await accountListPage.check_pageIsLoaded();
        for (let i = 0; i < 3; i++) {
          await accountListPage.check_accountDisplayedInAccountList(
            `QR ${i + 1}`,
          );
          await accountListPage.check_accountAddressDisplayedInAccountList(
            shortenAddress(KNOWN_QR_ACCOUNTS[i]),
          );
        }

        // Remove QR 1 account and check QR 1 account is removed
        await accountListPage.removeAccount('QR 1');
        await homePage.check_pageIsLoaded();
        await homePage.check_expectedBalanceIsDisplayed('0');
        await headerNavbar.openAccountMenu();
        await accountListPage.check_accountIsNotDisplayedInAccountList('QR 1');
      },
    );
  });
});
