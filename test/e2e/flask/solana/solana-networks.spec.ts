import { Suite } from 'mocha';
import { switchToNetworkFlow } from '../../page-objects/flows/network.flow';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import AccountListPage from '../../page-objects/pages/account-list-page';
import { withSolanaAccountSnap } from './common-solana';

describe('Solana network', function (this: Suite) {
  it('keeps the network selector enabled when the Solana network is selected', async function () {
    await withSolanaAccountSnap(
      { title: this.test?.fullTitle() },
      async (driver) => {
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.check_pageIsLoaded();
        await headerNavbar.check_accountLabel('Solana 1');
        await headerNavbar.check_currentSelectedNetwork('Solana');
        await headerNavbar.check_ifNetworkPickerClickable(true);
        await headerNavbar.openAccountMenu();
        const accountMenu = new AccountListPage(driver);
        await accountMenu.switchToAccount('Account 1');
        await headerNavbar.check_currentSelectedNetwork('Localhost 8545');
        await headerNavbar.check_ifNetworkPickerClickable(true);
      },
    );
  });

  it('can delete the previously selected EVM network when Solana network is selected', async function () {
    await withSolanaAccountSnap(
      { title: this.test?.fullTitle() },
      async (driver) => {
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.check_pageIsLoaded();

        // Switch to Linea Mainnet to set it as the selected network
        // in the network-controller
        await switchToNetworkFlow(driver, 'Linea Mainnet');

        // Switch back to Solana Mainnet
        await switchToNetworkFlow(driver, 'Solana');

        // Linea, still as the selected network in the network-controller
        // but not in the UI, should be removed from the network-controller
        await headerNavbar.clickSwitchNetworkDropDown();
        await driver.clickElement(
          '[data-testid="network-list-item-options-button-eip155:59144"]',
        );
        await driver.clickElement(
          '[data-testid="network-list-item-options-delete"]',
        );
        await driver.clickElement({ text: 'Delete', tag: 'button' });

        // Lastly, switch to an EVM account and validate the Ethereum
        // Mainnet is the selected network
        await headerNavbar.openAccountMenu();
        const accountMenu = new AccountListPage(driver);
        await accountMenu.switchToAccount('Account 1');
        await headerNavbar.check_currentSelectedNetwork('Ethereum Mainnet');
      },
    );
  });
});
