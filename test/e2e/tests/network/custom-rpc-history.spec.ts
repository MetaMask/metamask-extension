import { Suite } from 'mocha';
import { NetworkStatus, RpcEndpointType } from '@metamask/network-controller';
import { withFixtures } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { LOCALHOST_NETWORK_CLIENT_ID } from '../../constants';
import AddEditNetworkPage from '../../page-objects/pages/networks/add-edit-network-page';
import AddEditRpcUrlPage from '../../page-objects/pages/networks/add-edit-rpc-url-page';
import Homepage from '../../page-objects/pages/home/homepage';
import NetworksPage from '../../page-objects/pages/networks/networks-page';
import { login } from '../../page-objects/flows/login.flow';
import HeaderNavbar from '../../page-objects/pages/header-navbar';

describe('Custom RPC history', function (this: Suite) {
  it(`creates first custom RPC entry`, async function () {
    const port = 8546;
    const chainId = 1338;
    const symbol = 'TEST';

    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        localNodeOptions: [
          {
            type: 'anvil',
          },
          {
            type: 'anvil',
            options: {
              port,
              chainId,
            },
          },
        ],
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await login(driver);

        const rpcUrl = `http://127.0.0.1:${port}`;
        const networkName = 'Secondary Local Testnet';

        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.openGlobalNetworksMenu();
        const networksPage = new NetworksPage(driver);
        await networksPage.checkPageIsLoaded();
        await networksPage.openAddCustomNetworkPage();

        const addEditNetworkPage = new AddEditNetworkPage(driver);
        await addEditNetworkPage.checkPageIsLoaded();
        await addEditNetworkPage.fillNetworkNameInputField(networkName);
        await addEditNetworkPage.fillNetworkChainIdInputField(
          chainId.toString(),
        );
        await addEditNetworkPage.fillCurrencySymbolInputField(symbol);
        await addEditNetworkPage.openAddRpcUrlPage();

        // Add rpc url
        const addEditRpcUrlPage = new AddEditRpcUrlPage(driver);
        await addEditRpcUrlPage.checkPageIsLoaded();
        await addEditRpcUrlPage.fillAddRpcUrlInput(rpcUrl);
        await addEditRpcUrlPage.fillAddRpcNameInput('test-name');
        await addEditRpcUrlPage.saveAddRpcUrl();
        await addEditNetworkPage.saveEditedNetwork();
        // Validate the network was added
        await networksPage.checkAddNetworkMessageIsDisplayed(networkName);
      },
    );
  });

  it('warns user when they enter url for an already configured network', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await login(driver);

        // Duplicate network
        const duplicateRpcUrl = 'https://mainnet.infura.io/v3/';

        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.openGlobalNetworksMenu();
        const networksPage = new NetworksPage(driver);
        await networksPage.checkPageIsLoaded();
        await networksPage.openAddCustomNetworkPage();
        const addEditNetworkPage = new AddEditNetworkPage(driver);
        await addEditNetworkPage.checkPageIsLoaded();
        await addEditNetworkPage.openAddRpcUrlPage();

        // Add rpc url
        const addEditRpcUrlPage = new AddEditRpcUrlPage(driver);
        await addEditRpcUrlPage.checkPageIsLoaded();
        await addEditRpcUrlPage.fillAddRpcUrlInput(duplicateRpcUrl);
        await addEditRpcUrlPage.fillAddRpcNameInput('test-name');
        await addEditRpcUrlPage.saveAddRpcUrl();

        await addEditNetworkPage.checkPageIsLoaded();
        await addEditNetworkPage.fillNetworkChainIdInputField('1');
        await addEditNetworkPage.checkChainIdInputErrorMessageIsDisplayed(
          'The RPC URL you have entered returned a different chain ID (1337).',
        );
      },
    );
  });

  it('warns user when they enter chainId for an already configured network', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await login(driver);

        // Duplicate network
        const duplicateChainId = '1';

        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.openGlobalNetworksMenu();
        const networksPage = new NetworksPage(driver);
        await networksPage.checkPageIsLoaded();
        await networksPage.openAddCustomNetworkPage();
        const addEditNetworkPage = new AddEditNetworkPage(driver);
        await addEditNetworkPage.checkPageIsLoaded();
        await addEditNetworkPage.fillNetworkChainIdInputField(duplicateChainId);
        await addEditNetworkPage.checkChainIdInputErrorMessageIsDisplayed(
          'This Chain ID is currently used by the Ethereum network.',
        );

        // Add invalid rcp url
        await addEditNetworkPage.openAddRpcUrlPage();
        const addEditRpcUrlPage = new AddEditRpcUrlPage(driver);
        await addEditRpcUrlPage.checkPageIsLoaded();
        await addEditRpcUrlPage.fillAddRpcUrlInput('test');
        await addEditRpcUrlPage.fillAddRpcNameInput('test-name');
        await addEditRpcUrlPage.checkErrorMessageInvalidUrlIsDisplayed();
      },
    );
  });

  it('finds all recent RPCs in history', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2()
          .withNetworkController({
            networkConfigurationsByChainId: {
              '0x539': {
                blockExplorerUrls: [],
                chainId: '0x539',
                defaultRpcEndpointIndex: 0,
                name: 'Localhost 8545',
                nativeCurrency: 'ETH',
                rpcEndpoints: [
                  {
                    networkClientId: LOCALHOST_NETWORK_CLIENT_ID,
                    type: RpcEndpointType.Custom,
                    url: 'http://localhost:8545',
                  },
                  {
                    networkClientId: 'rpc-id-1',
                    type: RpcEndpointType.Custom,
                    url: 'http://127.0.0.1:8545/1',
                  },
                  {
                    networkClientId: 'rpc-id-2',
                    type: RpcEndpointType.Custom,
                    url: 'http://127.0.0.1:8545/2',
                  },
                ],
              },
            },
            networksMetadata: {
              'rpc-id-1': { EIPS: {}, status: NetworkStatus.Available },
              'rpc-id-2': { EIPS: {}, status: NetworkStatus.Available },
            },
          })
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await login(driver);
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.openGlobalNetworksMenu();
        const networksPage = new NetworksPage(driver);
        await networksPage.checkPageIsLoaded();

        // Custom rpcs length is 1 because networks has been merged
        await networksPage.checkNetworkOptionIsDisplayed('Localhost 8545');

        // Only recent 3 are found and in correct order (most recent at the top)
        await networksPage.openNetworkRPC('eip155:1337');
        await networksPage.checkNetworkRPCNumber(3);
      },
    );
  });

  it('deletes a custom RPC', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2()
          .withNetworkController({
            networkConfigurationsByChainId: {
              '0x539': {
                blockExplorerUrls: [],
                chainId: '0x539',
                defaultRpcEndpointIndex: 0,
                name: 'Localhost 8545',
                nativeCurrency: 'ETH',
                rpcEndpoints: [
                  {
                    networkClientId: LOCALHOST_NETWORK_CLIENT_ID,
                    type: RpcEndpointType.Custom,
                    url: 'http://localhost:8545',
                  },
                  {
                    networkClientId: 'rpc-id-1',
                    type: RpcEndpointType.Custom,
                    url: 'http://127.0.0.1:8545/1',
                  },
                ],
              },
              '0x540': {
                blockExplorerUrls: [],
                chainId: '0x540',
                defaultRpcEndpointIndex: 0,
                name: 'http://127.0.0.1:8545/2',
                nativeCurrency: 'ETH',
                rpcEndpoints: [
                  {
                    networkClientId: 'rpc-id-2',
                    type: RpcEndpointType.Custom,
                    url: 'http://127.0.0.1:8545/2',
                  },
                ],
              },
            },
            networksMetadata: {
              'rpc-id-1': { EIPS: {}, status: NetworkStatus.Available },
              'rpc-id-2': { EIPS: {}, status: NetworkStatus.Available },
            },
          })
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await login(driver);
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.openGlobalNetworksMenu();
        const networksPage = new NetworksPage(driver);
        await networksPage.checkPageIsLoaded();
        await networksPage.checkNetworkOptionIsDisplayed(
          'http://127.0.0.1:8545/2',
        );

        // Delete network from network list
        await networksPage.deleteNetwork('eip155:1344');
        await networksPage.clickCloseButton();
        const homepage = new Homepage(driver);
        await homepage.checkPageIsLoaded();
        await homepage.checkExpectedBalanceIsDisplayed();
        await homepage.closeUseNetworkNotificationModal();

        // Check custom network http://127.0.0.1:8545/2 is removed from network list
        // need a hard delay to avoid the background error message "network configuration not found" for removed network
        await driver.delay(2000);
        await headerNavbar.openGlobalNetworksMenu({ isDrawerOpen: true });
        await networksPage.checkPageIsLoaded();
        await networksPage.checkNetworkOptionIsDisplayed(
          'http://127.0.0.1:8545/2',
          false,
        );
      },
    );
  });
});
