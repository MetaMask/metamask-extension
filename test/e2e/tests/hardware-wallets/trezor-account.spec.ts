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

describe('Trezor Hardware', function () {
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
        await connectHardwareWalletPage.openConnectTrezorPage();

        const selectTrezorAccountPage = new SelectHardwareWalletAccountPage(
          driver,
        );
        await selectTrezorAccountPage.checkPageIsLoaded();

        // Check that the first page of accounts is correct
        await selectTrezorAccountPage.checkAccountNumber();
        for (const { address } of KNOWN_PUBLIC_KEY_ADDRESSES.slice(0, 4)) {
          const shortenedAddress = `${address.slice(0, 4)}...${address.slice(
            -4,
          )}`;
          await selectTrezorAccountPage.checkAddressIsDisplayed(
            shortenedAddress,
          );
        }

        // Unlock first account of first page and check that the correct account has been added
        await selectTrezorAccountPage.unlockAccount(1);
        await headerNavbar.checkPageIsLoaded();
        await new HomePage(driver).checkExpectedBalanceIsDisplayed('0');
        await headerNavbar.openAccountMenu();
        await accountListPage.checkPageIsLoaded();
        await accountListPage.checkAccountDisplayedInAccountList('Trezor 1');
        await accountListPage.checkAccountAddressDisplayedInAccountList(
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
        await accountListPage.checkPageIsLoaded();
        await accountListPage.openConnectHardwareWalletModal();

        const connectHardwareWalletPage = new ConnectHardwareWalletPage(driver);
        await connectHardwareWalletPage.checkPageIsLoaded();
        await connectHardwareWalletPage.openConnectTrezorPage();

        // Unlock 5 Trezor accounts
        const selectTrezorAccountPage = new SelectHardwareWalletAccountPage(
          driver,
        );
        await selectTrezorAccountPage.checkPageIsLoaded();
        await selectTrezorAccountPage.checkAccountNumber();
        for (let i = 1; i <= 5; i++) {
          await selectTrezorAccountPage.selectAccount(i);
        }
        await selectTrezorAccountPage.clickUnlockButton();

        // Check that all 5 Trezor accounts are displayed in account list
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await homePage.checkExpectedBalanceIsDisplayed('0');
        await headerNavbar.openAccountMenu();
        await accountListPage.checkPageIsLoaded();
        for (let i = 0; i < 5; i++) {
          await accountListPage.checkAccountDisplayedInAccountList(
            `Trezor ${i + 1}`,
          );
          await accountListPage.checkAccountAddressDisplayedInAccountList(
            shortenAddress(KNOWN_PUBLIC_KEY_ADDRESSES[i].address),
          );
        }

        // Remove Trezor 1 account and check Trezor 1 account is removed
        await accountListPage.removeAccount('Trezor 1');
        await homePage.checkPageIsLoaded();
        await homePage.checkExpectedBalanceIsDisplayed('0');
        await headerNavbar.openAccountMenu();
        await accountListPage.checkAccountIsNotDisplayedInAccountList(
          'Trezor 1',
        );
      },
    );
  });
});
