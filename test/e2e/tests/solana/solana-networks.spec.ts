import { Suite } from 'mocha';
import { switchToEditRPCViaGlobalMenuNetworks } from '../../page-objects/flows/network.flow';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import AccountListPage from '../../page-objects/pages/account-list-page';
import AssetListPage from '../../page-objects/pages/home/asset-list';
import NetworkManager, {
  NetworkId,
} from '../../page-objects/pages/network-manager';
import { withSolanaAccountSnap } from './common-solana';

describe('Solana network', function (this: Suite) {
  // eslint-disable-next-line mocha/no-skipped-tests
  it.skip('keeps the network selector enabled when the Solana network is selected', async function () {
    await withSolanaAccountSnap(
      { title: this.test?.fullTitle() },
      async (driver) => {
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.checkPageIsLoaded();
        await headerNavbar.checkAccountLabel('Solana 1');
        const assetList = new AssetListPage(driver);
        await assetList.checkNetworkFilterText('Solana');
        await headerNavbar.checkIfNetworkPickerClickable(true);
        await headerNavbar.openAccountMenu();
        const accountMenu = new AccountListPage(driver);
        await accountMenu.switchToAccount('Account 1');
        await assetList.checkNetworkFilterText('Localhost 8545');
        await headerNavbar.checkIfNetworkPickerClickable(true);
      },
    );
  });

  it('can delete the previously selected EVM network when Solana network is selected', async function () {
    await withSolanaAccountSnap(
      { title: this.test?.fullTitle() },
      async (driver) => {
        const headerNavbar = new HeaderNavbar(driver);
        const assetList = new AssetListPage(driver);
        const accountMenu = new AccountListPage(driver);
        const networkManager = new NetworkManager(driver);
        await headerNavbar.checkPageIsLoaded();
        await headerNavbar.openAccountMenu();
        await accountMenu.switchToAccount('Account 1');

        // Switch to Linea Mainnet to set it as the selected network
        // in the network-controller
        await networkManager.openNetworkManager();
        await networkManager.selectTab('Default');
        await networkManager.selectNetwork(NetworkId.ETHEREUM);
        await networkManager.selectNetwork(NetworkId.LINEA);
        await networkManager.deselectNetwork(NetworkId.ETHEREUM);
        await networkManager.closeNetworkManager();

        // Switch back to Solana Mainnet
        await headerNavbar.openAccountMenu();
        await accountMenu.switchToAccount('Solana 1');
        await headerNavbar.checkAccountLabel('Solana 1');
        await assetList.checkNetworkFilterText('Solana');

        // Linea, still as the selected network in the network-controller
        // but not in the UI, should be removed from the network-controller
        await switchToEditRPCViaGlobalMenuNetworks(driver);
        await driver.clickElement(
          '[data-testid="network-list-item-options-button-eip155:59144"]',
        );
        await driver.clickElement(
          '[data-testid="network-list-item-options-delete"]',
        );
        await driver.clickElement({ text: 'Delete', tag: 'button' });

        // Lastly, switch to an EVM account and validate the Ethereum
        // Mainnet is the selected network
        await headerNavbar.checkPageIsLoaded();
        await headerNavbar.openAccountMenu();
        await accountMenu.checkPageIsLoaded();
        await accountMenu.selectAccount('Account 1');
        await assetList.checkNetworkFilterText('Ethereum');
      },
    );
  });
});
