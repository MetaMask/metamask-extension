import { Suite } from 'mocha';
import { switchToNetworkFlow } from '../../page-objects/flows/network.flow';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import AccountListPage from '../../page-objects/pages/account-list-page';
import { withBtcAccountSnap } from './common-btc';
import { DEFAULT_BTC_ACCOUNT_NAME } from '../../constants';

describe('BTC network', function (this: Suite) {
  it('keeps the network selector enabled when the BTC network is selected', async function () {
    await withBtcAccountSnap(async (driver) => {
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.check_pageIsLoaded();
        await headerNavbar.check_accountLabel(DEFAULT_BTC_ACCOUNT_NAME);
        await headerNavbar.check_currentSelectedNetwork('BTC');
        await headerNavbar.check_ifNetworkPickerClickable(true);
        await headerNavbar.openAccountMenu();
        const accountMenu = new AccountListPage(driver);
        await accountMenu.switchToAccount('Account 1');
        await headerNavbar.check_currentSelectedNetwork('Localhost 8545');
        await headerNavbar.check_ifNetworkPickerClickable(true);
      },
    );
  });

  it('can delete the previously selected EVM network when BTC network is selected', async function () {
    await withBtcAccountSnap(async (driver) => {
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.check_pageIsLoaded();

        // Switch to Linea Mainnet to set it as the selected network
        // in the network-controller
        await switchToNetworkFlow(driver, 'Linea Mainnet');

        // Switch back to BTC Mainnet
        await switchToNetworkFlow(driver, 'Bitcoin');

        // Linea, still as the selected network in the network-controller
        // but not in the UI, should be removed from the network-controller
        await headerNavbar.clickSwitchNetworkDropDown();
        await driver.clickElement(
          '[data-testid="network-list-item-bip122:000000000019d6689c085ae165831e93"]',
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
