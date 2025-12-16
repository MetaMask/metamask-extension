import FixtureBuilder from '../../fixtures/fixture-builder';
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
        await accountListPage.checkPageIsLoaded();
        await accountListPage.openConnectHardwareWalletModal();

        const connectHardwareWalletPage = new ConnectHardwareWalletPage(driver);
        await connectHardwareWalletPage.checkPageIsLoaded();
        await connectHardwareWalletPage.openConnectQrPage();

        const selectQRAccountPage = new SelectHardwareWalletAccountPage(driver);
        await selectQRAccountPage.checkPageIsLoaded();

        // Check that the first page of accounts is correct
        await selectQRAccountPage.checkAccountNumber();
        for (const address of KNOWN_QR_ACCOUNTS.slice(0, 3)) {
          const shortenedAddress = `${address.slice(0, 4)}...${address.slice(
            -4,
          )}`;
          await selectQRAccountPage.checkAddressIsDisplayed(shortenedAddress);
        }

        // Unlock first account of first page and check that the correct account has been added
        await selectQRAccountPage.unlockAccount(1);
        await headerNavbar.checkPageIsLoaded();
        await new HomePage(driver).checkExpectedBalanceIsDisplayed('0');
        await headerNavbar.openAccountMenu();
        await accountListPage.checkPageIsLoaded();
        await accountListPage.checkAccountDisplayedInAccountList(`QR 1`);
        await accountListPage.checkAccountAddressDisplayedInAccountList(
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
        await accountListPage.checkPageIsLoaded();
        await accountListPage.openConnectHardwareWalletModal();

        const connectHardwareWalletPage = new ConnectHardwareWalletPage(driver);
        await connectHardwareWalletPage.checkPageIsLoaded();
        await connectHardwareWalletPage.openConnectQrPage();

        // Unlock 3 QR accounts
        const selectQrAccountPage = new SelectHardwareWalletAccountPage(driver);
        await selectQrAccountPage.checkPageIsLoaded();
        await selectQrAccountPage.checkAccountNumber();
        for (let i = 1; i <= 3; i++) {
          await selectQrAccountPage.selectAccount(i);
        }
        await selectQrAccountPage.clickUnlockButton();

        // Check that all 3 QR accounts are displayed in account list
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await homePage.checkExpectedBalanceIsDisplayed('0');
        await headerNavbar.openAccountMenu();
        await accountListPage.checkPageIsLoaded();
        for (let i = 0; i < 3; i++) {
          await accountListPage.checkAccountDisplayedInAccountList(
            `QR ${i + 1}`,
          );
          await accountListPage.checkAccountAddressDisplayedInAccountList(
            shortenAddress(KNOWN_QR_ACCOUNTS[i]),
          );
        }

        // Remove QR 1 account and check QR 1 account is removed
        await accountListPage.removeAccount(`QR 1`);
        await homePage.checkPageIsLoaded();
        await homePage.checkExpectedBalanceIsDisplayed('0');
        await headerNavbar.openAccountMenu();
        await accountListPage.checkAccountIsNotDisplayedInAccountList('QR 1');
      },
    );
  });
});
