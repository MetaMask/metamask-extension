import { Suite } from 'mocha';
import FixtureBuilder from '../../../fixture-builder';
import { withFixtures } from '../../../helpers';
import { shortenAddress } from '../../../../../ui/helpers/utils/util';
import { KNOWN_PUBLIC_KEY_ADDRESSES } from '../../../../stub/keyring-bridge';
import AccountListPage from '../../../page-objects/pages/account-list-page';
import ConnectHardwareWalletPage from '../../../page-objects/pages/hardware-wallet/connect-hardware-wallet-page';
import HeaderNavbar from '../../../page-objects/pages/header-navbar';
import HomePage from '../../../page-objects/pages/home/homepage';
import SelectHardwareWalletAccountPage from '../../../page-objects/pages/hardware-wallet/select-hardware-wallet-account-page';
import { loginWithBalanceValidation } from '../../../page-objects/flows/login.flow';

describe('Trezor Hardware - Forget Device', function (this: Suite) {
  it('should forget a trezor device and remove all associated accounts', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);

        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.openAccountMenu();

        // Connect hardware wallet from the account menu
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

        // Unlock multiple Trezor accounts to verify they get removed
        await selectTrezorAccountPage.checkAccountNumber();
        await selectTrezorAccountPage.selectAccount(1);
        await selectTrezorAccountPage.selectAccount(2);
        await selectTrezorAccountPage.clickUnlockButton();

        // Verify accounts were added successfully
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await homePage.checkExpectedBalanceIsDisplayed('0');
        
        await headerNavbar.openAccountMenu();
        await accountListPage.checkPageIsLoaded();
        await accountListPage.checkAccountDisplayedInAccountList('Trezor 1');
        await accountListPage.checkAccountDisplayedInAccountList('Trezor 2');
        await accountListPage.checkAccountAddressDisplayedInAccountList(
          shortenAddress(KNOWN_PUBLIC_KEY_ADDRESSES[0].address),
        );
        await accountListPage.checkAccountAddressDisplayedInAccountList(
          shortenAddress(KNOWN_PUBLIC_KEY_ADDRESSES[1].address),
        );

        // Now connect hardware wallet again to access forget device functionality
        await accountListPage.openConnectHardwareWalletModal();
        await connectHardwareWalletPage.checkPageIsLoaded();
        await connectHardwareWalletPage.openConnectTrezorPage();
        await selectTrezorAccountPage.checkPageIsLoaded();

        // Click the "Forget this device" link
        console.log('Clicking forget device');
        await driver.clickElement({ text: 'Forget this device', tag: 'a' });

        // Verify the device was forgotten by checking the UI state
        // The page should reset and show no accounts selected
        await selectTrezorAccountPage.checkPageIsLoaded();
        await selectTrezorAccountPage.checkAccountNumber();

        // Cancel out of the hardware wallet connection flow
        await driver.clickElement({ text: 'Cancel', tag: 'button' });

        // Verify that Trezor accounts have been removed from the account list
        await headerNavbar.openAccountMenu();
        await accountListPage.checkPageIsLoaded();
        await accountListPage.checkAccountIsNotDisplayedInAccountList('Trezor 1');
        await accountListPage.checkAccountIsNotDisplayedInAccountList('Trezor 2');
        
        // Verify the addresses are also removed
        const accountElements = await driver.findElements('[data-testid="account-menu-icon"]');
        let trezorAccountsFound = 0;
        
        for (const element of accountElements) {
          const accountContainer = await element.findElement('..');
          const accountText = await accountContainer.getText();
          if (accountText.includes(shortenAddress(KNOWN_PUBLIC_KEY_ADDRESSES[0].address)) ||
              accountText.includes(shortenAddress(KNOWN_PUBLIC_KEY_ADDRESSES[1].address))) {
            trezorAccountsFound++;
          }
        }
        
        if (trezorAccountsFound > 0) {
          throw new Error(`Found ${trezorAccountsFound} Trezor accounts that should have been removed`);
        }

        console.log('Trezor device successfully forgotten and all accounts removed');
      },
    );
  });

  it('should be able to reconnect after forgetting device', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);

        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.openAccountMenu();

        // Connect hardware wallet and unlock an account
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
        await selectTrezorAccountPage.unlockAccount(1);

        // Verify account was added
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await headerNavbar.openAccountMenu();
        await accountListPage.checkAccountDisplayedInAccountList('Trezor 1');

        // Forget the device
        await accountListPage.openConnectHardwareWalletModal();
        await connectHardwareWalletPage.checkPageIsLoaded();
        await connectHardwareWalletPage.openConnectTrezorPage();
        await selectTrezorAccountPage.checkPageIsLoaded();
        
        console.log('Forgetting device');
        await driver.clickElement({ text: 'Forget this device', tag: 'a' });
        
        // Verify device was forgotten
        await selectTrezorAccountPage.checkPageIsLoaded();
        
        // Now reconnect the same account to verify functionality works
        console.log('Reconnecting device after forget');
        await selectTrezorAccountPage.unlockAccount(1);
        
        // Verify the account is reconnected successfully
        await homePage.checkPageIsLoaded();
        await headerNavbar.openAccountMenu();
        await accountListPage.checkAccountDisplayedInAccountList('Trezor 1');
        await accountListPage.checkAccountAddressDisplayedInAccountList(
          shortenAddress(KNOWN_PUBLIC_KEY_ADDRESSES[0].address),
        );

        console.log('Successfully reconnected Trezor device after forgetting');
      },
    );
  });

  it('should handle forget device with no accounts connected', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);

        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.openAccountMenu();

        // Connect hardware wallet but don't unlock any accounts
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

        // Try to forget device without any accounts unlocked
        console.log('Forgetting device with no accounts unlocked');
        await driver.clickElement({ text: 'Forget this device', tag: 'a' });

        // Verify the device was forgotten successfully (should not throw error)
        await selectTrezorAccountPage.checkPageIsLoaded();
        await selectTrezorAccountPage.checkAccountNumber();

        // Cancel out and verify no accounts are in the list
        await driver.clickElement({ text: 'Cancel', tag: 'button' });
        await headerNavbar.openAccountMenu();
        await accountListPage.checkPageIsLoaded();
        
        // Should not have any Trezor accounts
        await accountListPage.checkAccountIsNotDisplayedInAccountList('Trezor 1');

        console.log('Successfully handled forget device with no accounts');
      },
    );
  });
});