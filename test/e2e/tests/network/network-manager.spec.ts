import { Suite } from 'mocha';
import { Mockttp } from 'mockttp';
import { Driver } from '../../webdriver/driver';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { NETWORK_CLIENT_ID, WINDOW_TITLES } from '../../constants';
import { withFixtures } from '../../helpers';
import { login } from '../../page-objects/flows/login.flow';
import NetworkManager, {
  NetworkId,
} from '../../page-objects/pages/network-manager';
import AssetListPage from '../../page-objects/pages/home/asset-list';
import TestDapp from '../../page-objects/pages/test-dapp';
import AddNetworkConfirmation from '../../page-objects/pages/confirmations/add-network-confirmations';

const MUSD_ADDRESS = '0xacA92E438df0B2401fF60dA7E4337B687a2435DA';

async function mockLineaAndMusd(mockServer: Mockttp) {
  return [
    await mockServer
      .forGet('https://price.api.cx.metamask.io/v3/spot-prices')
      .always()
      .thenCallback(() => ({
        statusCode: 200,
        json: {
          'eip155:1/slip44:60': {
            id: 'ethereum',
            price: 2500,
            marketCap: 0,
            pricePercentChange1d: 0,
          },
          'eip155:59144/slip44:60': {
            id: 'ethereum',
            price: 2500,
            marketCap: 0,
            pricePercentChange1d: 0,
          },
          [`eip155:1/erc20:${MUSD_ADDRESS.toLowerCase()}`]: {
            price: 1,
            marketCap: 0,
            pricePercentChange1d: 0,
          },
          [`eip155:59144/erc20:${MUSD_ADDRESS.toLowerCase()}`]: {
            price: 1,
            marketCap: 0,
            pricePercentChange1d: 0,
          },
        },
      })),
    await mockServer
      .forGet('https://price.api.cx.metamask.io/v1/exchange-rates')
      .always()
      .thenCallback(() => ({
        statusCode: 200,
        json: {
          usd: {
            name: 'US Dollar',
            ticker: 'usd',
            value: 1,
            currencyType: 'fiat',
          },
          eth: {
            name: 'Ether',
            ticker: 'eth',
            value: 1 / 2500,
            currencyType: 'crypto',
          },
        },
      })),
    await mockServer
      .forGet('https://accounts.api.cx.metamask.io/v2/supportedNetworks')
      .always()
      .thenJson(200, {
        fullSupport: [],
        partialSupport: { balances: [] },
      }),
    await mockServer
      .forGet(/https:\/\/tokens\.api\.cx\.metamask\.io\/v3\/assets/u)
      .always()
      .thenCallback((request) => {
        const url = new URL(request.url);
        const assetIds = url.searchParams.getAll('assetIds').join(',');
        const results = [];

        if (
          assetIds.includes('eip155:1/slip44:60') ||
          assetIds.includes('eip155:1/')
        ) {
          results.push({
            assetId: 'eip155:1/slip44:60',
            name: 'Ethereum',
            symbol: 'ETH',
            decimals: 18,
          });
        }

        if (assetIds.includes('eip155:59144')) {
          results.push({
            assetId: 'eip155:59144/slip44:60',
            name: 'Ether',
            symbol: 'ETH',
            decimals: 18,
          });
        }

        if (
          assetIds
            .toLowerCase()
            .includes(`eip155:1/erc20:${MUSD_ADDRESS.toLowerCase()}`)
        ) {
          results.push({
            assetId: `eip155:1/erc20:${MUSD_ADDRESS}`,
            name: 'MUSD',
            symbol: 'MUSD',
            decimals: 6,
          });
        }

        if (
          assetIds
            .toLowerCase()
            .includes(`eip155:59144/erc20:${MUSD_ADDRESS.toLowerCase()}`)
        ) {
          results.push({
            assetId: `eip155:59144/erc20:${MUSD_ADDRESS}`,
            name: 'MUSD',
            symbol: 'MUSD',
            decimals: 6,
          });
        }

        return { statusCode: 200, json: { data: results } };
      }),
  ];
}

describe('Network Manager', function (this: Suite) {
  it('should reflect the enabled networks state in the network manager', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2()
          .withSelectedNetwork(NETWORK_CLIENT_ID.MAINNET)
          .withEnabledNetworks({ eip155: { '0x1': true } })
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, { validateBalance: false });
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
        fixtures: new FixtureBuilderV2()
          .withSelectedNetwork(NETWORK_CLIENT_ID.MAINNET)
          .withEnabledNetworks({ eip155: { '0x1': true, '0xe708': true } })
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, { validateBalance: false });
        const networkManager = new NetworkManager(driver);
        await networkManager.openNetworkManager();

        // there cannot be an inbetween value, either 1 network or all networks. So the controller updates to all networks
        await networkManager.checkAllPopularNetworksIsSelected();
      },
    );
  });

  it('should select and deselect multiple default networks', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2()
          .withSelectedNetwork(NETWORK_CLIENT_ID.MAINNET)
          .withEnabledNetworks({ eip155: { '0x1': true } })
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, { validateBalance: false });
        const networkManager = new NetworkManager(driver);
        await networkManager.openNetworkManager();

        // Assert - initial Network Manager State (eth selected, linea deselected)
        await networkManager.checkNetworkIsSelected(NetworkId.ETHEREUM);
        await networkManager.checkNetworkIsDeselected(NetworkId.LINEA);

        // Act Assert - select linea will deselect etherum and select linea
        await networkManager.selectNetworkByChainId(NetworkId.LINEA);
        await networkManager.openNetworkManager();
        await networkManager.checkNetworkIsSelected(NetworkId.LINEA);
        await networkManager.checkNetworkIsDeselected(NetworkId.ETHEREUM);
        await networkManager.closeNetworkManager();

        // Act Assert - select ethereum will deselect linea and select ethereum
        await networkManager.openNetworkManager();
        await networkManager.selectNetworkByChainId(NetworkId.ETHEREUM);
        await networkManager.openNetworkManager();
        await networkManager.checkNetworkIsDeselected(NetworkId.LINEA);
        await networkManager.checkNetworkIsSelected(NetworkId.ETHEREUM);
        await networkManager.closeNetworkManager();
      },
    );
  });

  it('should default to custom tab when custom network is enabled', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, { validateBalance: false });
        const networkManager = new NetworkManager(driver);
        await networkManager.openNetworkManager();
        await networkManager.checkTabIsSelected('Custom');
      },
    );
  });

  it('should default to default tab when default network is enabled', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2()
          .withSelectedNetwork(NETWORK_CLIENT_ID.MAINNET)
          .withEnabledNetworks({ eip155: { '0x1': true } })
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, { validateBalance: false });
        const networkManager = new NetworkManager(driver);
        await networkManager.openNetworkManager();
        await networkManager.checkTabIsSelected('Popular');
      },
    );
  });

  it('should filter tokens by enabled networks', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2()
          .withSelectedNetwork(NETWORK_CLIENT_ID.MAINNET)
          .withEnabledNetworks({ eip155: { '0x1': true } })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockLineaAndMusd,
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, { validateBalance: false });
        const assetListPage = new AssetListPage(driver);
        const networkManager = new NetworkManager(driver);

        // Only Ethereum native token and MUSD
        await assetListPage.checkTokenItemNumber(2);

        // Change to Linea, only Linea native token and MUSD visible
        await networkManager.openNetworkManager();
        await networkManager.selectNetworkByChainId(NetworkId.LINEA);
        await assetListPage.checkTokenItemNumber(2);

        // Change to Ethereum, only Ethereum native token and MUSD visible
        await networkManager.openNetworkManager();
        await networkManager.selectNetworkByChainId(NetworkId.ETHEREUM);
        await assetListPage.checkTokenItemNumber(2);
      },
    );
  });

  it('should preserve existing enabled networks when adding a network via dapp', async function () {
    await withFixtures(
      {
        dappOptions: { numberOfTestDapps: 1 },
        fixtures: new FixtureBuilderV2()
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
        await login(driver, { validateBalance: false });

        await driver.delay(1000);

        // Add network via dapp
        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();
        await testDapp.checkPageIsLoaded();

        const addEthereumChainRequest = JSON.stringify({
          jsonrpc: '2.0',
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: '0xa86a', // avalanche mainnet
              chainName: 'Avalanche',
              nativeCurrency: {
                name: 'AVAX',
                symbol: 'AVAX',
                decimals: 18,
              },
              rpcUrls: ['http://localhost:8546'],
              blockExplorerUrls: ['https://snowtrace.io'],
            },
          ],
        });

        await driver.executeScript(
          `window.ethereum.request(${addEthereumChainRequest})`,
        );

        // Approve the network addition
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        const addNetworkConfirmation = new AddNetworkConfirmation(driver);
        await addNetworkConfirmation.checkPageIsLoaded('Avalanche');
        await addNetworkConfirmation.approveAddNetwork();

        // Switch back to MetaMask to verify preservation
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        // Now verify both networks are preserved in network manager
        const networkManager = new NetworkManager(driver);
        await networkManager.openNetworkManager();

        // Should be on Popular tab since both are popular networks
        await networkManager.checkTabIsSelected('Popular');

        // New network is selected (we do not keep both networks on, as UI does only supports single or all popular networks)
        await networkManager.checkNetworkIsSelected(NetworkId.AVALANCHE);
      },
    );
  });

  it('should deselect all networks when adding a custom network via dapp', async function () {
    await withFixtures(
      {
        dappOptions: { numberOfTestDapps: 1 },
        fixtures: new FixtureBuilderV2()
          .withPermissionControllerConnectedToTestDapp()
          .withEnabledNetworks({
            eip155: {
              '0x1': true, // Start with only Ethereum
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
        await login(driver, { validateBalance: false });

        await driver.delay(1000);

        // Add custom network via dapp
        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();
        await testDapp.checkPageIsLoaded();

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
        await addNetworkConfirmation.checkPageIsLoaded('Custom Test Network');
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

        // Switch to Popular tab and verify Ethereum is deselected
        await networkManager.selectTab('Popular');
        await networkManager.checkNetworkIsDeselected(NetworkId.ETHEREUM);
      },
    );
  });
});
