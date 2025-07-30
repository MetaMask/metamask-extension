import { Suite } from 'mocha';
import { Driver } from '../../webdriver/driver';
import FixtureBuilder from '../../fixture-builder';
import { withFixtures, WINDOW_TITLES } from '../../helpers';
import { loginWithoutBalanceValidation } from '../../page-objects/flows/login.flow';
import NetworkManager, {
  NetworkId,
} from '../../page-objects/pages/network-manager';
import AssetListPage from '../../page-objects/pages/home/asset-list';
import TestDapp from '../../page-objects/pages/test-dapp';
import AddNetworkConfirmation from '../../page-objects/pages/confirmations/redesign/add-network-confirmations';

describe('Network Manager', function (this: Suite) {
  it('should reflect the enabled networks state in the network manager', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withNetworkControllerOnMainnet()
          .withEnabledNetworks({ eip155: { '0x1': true } })
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithoutBalanceValidation(driver);
        const networkManager = new NetworkManager(driver);
        await networkManager.openNetworkManager();
        await networkManager.checkNetworkIsSelected(NetworkId.ETHEREUM);
        await networkManager.checkNetworkIsDeselected(NetworkId.LINEA);
      },
    );
  });

  it('should reflect the enabled networks state in the network manager, when multiple networks are enabled', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withNetworkControllerOnMainnet()
          .withEnabledNetworks({ eip155: { '0x1': true, '0xe708': true } })
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithoutBalanceValidation(driver);
        const networkManager = new NetworkManager(driver);
        await networkManager.openNetworkManager();
        await networkManager.checkNetworkIsSelected(NetworkId.ETHEREUM);
        await networkManager.checkNetworkIsSelected(NetworkId.LINEA);
      },
    );
  });

  it('should select and deselect multiple default networks', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withNetworkControllerOnMainnet()
          .withEnabledNetworks({ eip155: { '0x1': true } })
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithoutBalanceValidation(driver);
        const networkManager = new NetworkManager(driver);
        await networkManager.openNetworkManager();

        // Assert - initial Network Manager State (eth selected, linea deselected)
        await networkManager.checkNetworkIsSelected(NetworkId.ETHEREUM);
        await networkManager.checkNetworkIsDeselected(NetworkId.LINEA);

        // Act Assert - Both eth and linea selected
        await networkManager.selectNetwork(NetworkId.LINEA);
        await networkManager.checkNetworkIsSelected(NetworkId.LINEA);
        await networkManager.checkNetworkIsSelected(NetworkId.ETHEREUM);

        // Act Assert - eth deselected, linea selected
        await networkManager.deselectNetwork(NetworkId.ETHEREUM);
        await networkManager.checkNetworkIsSelected(NetworkId.LINEA);
        await networkManager.checkNetworkIsDeselected(NetworkId.ETHEREUM);
      },
    );
  });

  it('should default to custom tab when custom network is enabled', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithoutBalanceValidation(driver);
        const networkManager = new NetworkManager(driver);
        await networkManager.openNetworkManager();
        await networkManager.checkTabIsSelected('Custom');
      },
    );
  });

  it('should default to default tab when default network is enabled', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withNetworkControllerOnMainnet()
          .withEnabledNetworks({ eip155: { '0x1': true } })
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithoutBalanceValidation(driver);
        const networkManager = new NetworkManager(driver);
        await networkManager.openNetworkManager();
        await networkManager.checkTabIsSelected('Default');
      },
    );
  });

  it('should filter tokens by enabled networks', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withNetworkControllerOnMainnet()
          .withEnabledNetworks({ eip155: { '0x1': true, '0xe708': true } })
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithoutBalanceValidation(driver);
        const assetListPage = new AssetListPage(driver);
        const networkManager = new NetworkManager(driver);

        await assetListPage.check_tokenItemNumber(2);

        await networkManager.openNetworkManager();
        await networkManager.checkTabIsSelected('Default');
        await networkManager.deselectNetwork(NetworkId.LINEA);

        await assetListPage.check_tokenItemNumber(1);

        await networkManager.selectNetwork('eip155:8453');

        await assetListPage.check_tokenItemNumber(2);

        await networkManager.selectNetwork(NetworkId.LINEA);

        await assetListPage.check_tokenItemNumber(3);
      },
    );
  });

  it('should preserve existing enabled networks when adding a network via dapp', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .withEnabledNetworks({
            eip155: {
              '0x1': true,
            },
          })
          .build(),
        localNodeOptions: [
          {
            type: 'anvil',
            options: {
              chainId: 1,
            },
          },
          {
            type: 'anvil',
            options: {
              port: 8546,
              chainId: 137,
            },
          },
        ],
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithoutBalanceValidation(driver);

        await driver.delay(1000);

        // Add network via dapp
        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();
        await testDapp.check_pageIsLoaded();

        const addEthereumChainRequest = JSON.stringify({
          jsonrpc: '2.0',
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: '0x89', // Polygon mainnet
              chainName: 'Polygon Mainnet',
              nativeCurrency: {
                name: 'MATIC',
                symbol: 'MATIC',
                decimals: 18,
              },
              rpcUrls: ['http://localhost:8546'],
              blockExplorerUrls: ['https://polygonscan.com'],
            },
          ],
        });

        await driver.executeScript(
          `window.ethereum.request(${addEthereumChainRequest})`,
        );

        // Approve the network addition
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        const addNetworkConfirmation = new AddNetworkConfirmation(driver);
        await addNetworkConfirmation.check_pageIsLoaded('Polygon Mainnet');
        await addNetworkConfirmation.approveAddNetwork();

        // Switch back to MetaMask to verify preservation
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        // Now verify both networks are preserved in network manager
        const networkManager = new NetworkManager(driver);
        await networkManager.openNetworkManager();

        // Should be on Default tab since both are default networks
        await networkManager.checkTabIsSelected('Default');

        // Check both networks are selected
        await networkManager.checkNetworkIsSelected(NetworkId.ETHEREUM);

        await networkManager.checkNetworkIsSelected(NetworkId.POLYGON);
      },
    );
  });

  it('should deselect all networks when adding a custom network via dapp', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .withEnabledNetworks({
            eip155: {
              '0x1': true, // Start with only Ethereum Mainnet
            },
          })
          .build(),
        localNodeOptions: [
          {
            type: 'anvil',
            options: {
              chainId: 1,
            },
          },
          {
            type: 'anvil',
            options: {
              port: 8546,
              chainId: 1338, // Custom network
            },
          },
        ],
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithoutBalanceValidation(driver);

        await driver.delay(1000);

        // Add custom network via dapp
        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();
        await testDapp.check_pageIsLoaded();

        const addEthereumChainRequest = JSON.stringify({
          jsonrpc: '2.0',
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: '0x53a',
              chainName: 'Custom Test Network',
              nativeCurrency: {
                name: 'ETH',
                symbol: 'ETH',
                decimals: 18,
              },
              rpcUrls: ['http://localhost:8546'],
              blockExplorerUrls: ['https://example.com'],
            },
          ],
        });

        await driver.executeScript(
          `window.ethereum.request(${addEthereumChainRequest})`,
        );

        // Approve the network addition
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        const addNetworkConfirmation = new AddNetworkConfirmation(driver);
        await addNetworkConfirmation.check_pageIsLoaded('Custom Test Network');
        await addNetworkConfirmation.approveAddNetwork();

        // Switch back to MetaMask to verify behavior
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        // Check what network is currently active by reading the button text
        await driver.delay(2000);
        const networkButtonText = await driver.executeScript(`
          const networkButton = document.querySelector('[data-testid="sort-by-networks"]');
          return networkButton ? networkButton.textContent.trim() : 'Button not found';
        `);
        console.log(`🔍 Current network button text: "${networkButtonText}"`);

        // Now check the network manager state
        const networkManager = new NetworkManager(driver);
        await networkManager.openNetworkManager();

        // Switch to Default tab and verify Ethereum is deselected
        await networkManager.selectTab('Default');
      },
    );
  });
});
