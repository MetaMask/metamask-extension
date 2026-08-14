import { Suite } from 'mocha';
import { NetworkStatus, RpcEndpointType } from '@metamask/network-controller';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { withFixtures } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import { Mockttp } from '../../mock-e2e';
import AddEditRpcUrlPage from '../../page-objects/pages/networks/add-edit-rpc-url-page';
import AddEditNetworkPage from '../../page-objects/pages/networks/add-edit-network-page';
import HomePage from '../../page-objects/pages/home/homepage';
import NetworkFilter from '../../page-objects/pages/networks/network-filter';
import NetworksPage from '../../page-objects/pages/networks/networks-page';
import { login } from '../../page-objects/flows/login.flow';
import HeaderNavbar from '../../page-objects/pages/header-navbar';

describe('Update Network:', function (this: Suite) {
  it('update network details and validate the ui elements', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        const inputData = {
          networkName: 'Update Network',
          rpcUrl: 'test',
        };
        await login(driver);
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.openGlobalNetworksMenu();

        const networksPage = new NetworksPage(driver);
        await networksPage.checkPageIsLoaded();
        await networksPage.openNetworkListOptions('eip155:1337');
        await networksPage.openEditNetworkPage();

        // Verify chain id is not editable when updating a network
        const editNetworkPage = new AddEditNetworkPage(driver);
        await editNetworkPage.checkPageIsLoaded();
        await editNetworkPage.checkChainIdInputFieldIsEnabled(false);

        // Update the network name and save the changes
        await editNetworkPage.fillNetworkNameInputField(inputData.networkName);
        await editNetworkPage.saveEditedNetwork();
        await networksPage.checkEditNetworkMessageIsDisplayed(
          inputData.networkName,
        );
        await networksPage.clickCloseButton();

        // Verify the new network name is visible
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        // Since switching networks is disabled via the networks modal in global menu, we don't need to check the selected network anymore
        await headerNavbar.openGlobalNetworksMenu();

        await networksPage.checkPageIsLoaded();
        await networksPage.openNetworkListOptions('eip155:1337');
        await networksPage.openEditNetworkPage();
        await editNetworkPage.checkPageIsLoaded();

        // Edit the RPC URL to something invalid
        await editNetworkPage.openAddRpcUrlPage();
        const addEditRpcUrlPage = new AddEditRpcUrlPage(driver);
        await addEditRpcUrlPage.checkPageIsLoaded();
        await addEditRpcUrlPage.fillAddRpcUrlInput(inputData.rpcUrl);

        // Validate the error message that appears for the invalid url format
        await addEditRpcUrlPage.checkErrorMessageInvalidUrlIsDisplayed();

        // Validate the Save button is disabled for the invalid url format
        await addEditRpcUrlPage.checkAddRpcUrlButtonIsEnabled(false);
      },
    );
  });

  it('should delete added rpc url for existing network', async function () {
    async function mockRPCURLAndChainId(mockServer: Mockttp) {
      return [
        await mockServer
          .forPost('https://responsive-rpc.test/')
          .thenCallback(() => ({
            statusCode: 200,
            json: {
              id: '1694444405781',
              jsonrpc: '2.0',
              result: '0xa4b1',
            },
          })),
        await mockServer
          .forPost('https://arbitrum-mainnet.infura.io/')
          .thenCallback(() => ({
            statusCode: 200,
            json: {
              id: '1694444405781',
              jsonrpc: '2.0',
              result: '0xa4b1',
            },
          })),
      ];
    }
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2()
          .withNetworkController({
            networkConfigurationsByChainId: {
              '0xa4b1': {
                blockExplorerUrls: [],
                chainId: '0xa4b1',
                defaultRpcEndpointIndex: 0,
                name: 'Arbitrum',
                nativeCurrency: 'ETH',
                rpcEndpoints: [
                  {
                    networkClientId: '2ce66016-8aab-47df-b27f-318c80865eb0',
                    type: RpcEndpointType.Custom,
                    url: 'https://arbitrum-mainnet.infura.io',
                  },
                  {
                    networkClientId: '2ce66016-8aab-47df-b27f-318c80865eb1',
                    type: RpcEndpointType.Custom,
                    url: 'https://responsive-rpc.test/',
                  },
                ],
              },
            },
            networksMetadata: {
              '2ce66016-8aab-47df-b27f-318c80865eb0': {
                EIPS: {},
                status: NetworkStatus.Available,
              },
              '2ce66016-8aab-47df-b27f-318c80865eb1': {
                EIPS: {},
                status: NetworkStatus.Available,
              },
            },
          })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockRPCURLAndChainId,
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);
        const networkFilter = new NetworkFilter(driver);
        const originalFilterLabel = await networkFilter.getLabel();
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.openGlobalNetworksMenu();

        const networksPage = new NetworksPage(driver);
        await networksPage.checkPageIsLoaded();

        // Go to Edit Menu
        await networksPage.openNetworkListOptions('eip155:42161');
        await networksPage.openEditNetworkPage();
        const editNetworkPage = new AddEditNetworkPage(driver);
        await editNetworkPage.checkPageIsLoaded();

        // Remove the RPC
        await editNetworkPage.removeRpcUrl(2);
        await editNetworkPage.checkRpcIsDisplayed('responsive-rpc.test', false);
        await editNetworkPage.saveEditedNetwork();
        await networksPage.checkEditNetworkMessageIsDisplayed('Arbitrum');
        await networksPage.clickCloseButton();
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await networkFilter.waitUntilLabelIs(originalFilterLabel);

        // Re-open the network menu and go back to edit the network
        await headerNavbar.openGlobalNetworksMenu();

        await networksPage.checkPageIsLoaded();
        await networksPage.openNetworkListOptions('eip155:42161');
        await networksPage.openEditNetworkPage();
        await editNetworkPage.checkPageIsLoaded();

        // Verify the rpc endpoint is removed
        await editNetworkPage.checkRpcIsDisplayed('responsive-rpc.test', false);
      },
    );
  });

  it('should update added rpc url for existing network', async function () {
    async function mockRPCURLAndChainId(mockServer: Mockttp) {
      return [
        await mockServer
          .forPost('https://responsive-rpc.test/')
          .thenCallback(() => ({
            statusCode: 200,
            json: {
              id: '1694444405781',
              jsonrpc: '2.0',
              result: '0xa4b1',
            },
          })),
      ];
    }
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2()
          .withNetworkController({
            networkConfigurationsByChainId: {
              '0xa4b1': {
                blockExplorerUrls: [],
                chainId: '0xa4b1',
                defaultRpcEndpointIndex: 0,
                name: 'Arbitrum',
                nativeCurrency: 'ETH',
                rpcEndpoints: [
                  {
                    networkClientId: '2ce66016-8aab-47df-b27f-318c80865eb0',
                    type: RpcEndpointType.Custom,
                    url: 'https://arbitrum-mainnet.infura.io',
                  },
                ],
              },
            },
            networksMetadata: {
              '2ce66016-8aab-47df-b27f-318c80865eb0': {
                EIPS: {},
                status: NetworkStatus.Available,
              },
            },
          })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockRPCURLAndChainId,
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);
        const networkFilter = new NetworkFilter(driver);
        const originalFilterLabel = await networkFilter.getLabel();
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.openGlobalNetworksMenu();

        const networksPage = new NetworksPage(driver);
        await networksPage.checkPageIsLoaded();

        // Go to Edit Menu
        await networksPage.openNetworkListOptions('eip155:42161');
        await networksPage.openEditNetworkPage();
        const editNetworkPage = new AddEditNetworkPage(driver);
        await editNetworkPage.checkPageIsLoaded();

        // Add a new rpc url and verify it appears in the dropdown
        await editNetworkPage.openAddRpcUrlPage();
        const addEditRpcUrlPage = new AddEditRpcUrlPage(driver);
        await addEditRpcUrlPage.checkPageIsLoaded();
        await addEditRpcUrlPage.fillAddRpcUrlInput(
          'https://responsive-rpc.test',
        );
        await addEditRpcUrlPage.fillAddRpcNameInput('testName');
        await addEditRpcUrlPage.checkAddRpcUrlButtonIsEnabled();
        await addEditRpcUrlPage.saveAddRpcUrl();
        await editNetworkPage.checkRpcIsDisplayed('responsive-rpc.test');

        // Save the network
        await editNetworkPage.saveEditedNetwork();
        await networksPage.checkEditNetworkMessageIsDisplayed('Arbitrum');
        await networksPage.clickCloseButton();
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await networkFilter.waitUntilLabelIs(originalFilterLabel);

        // Re-open the network menu and go back to edit the network
        await headerNavbar.openGlobalNetworksMenu();

        await networksPage.checkPageIsLoaded();
        await networksPage.openNetworkListOptions('eip155:42161');
        await networksPage.openEditNetworkPage();
        await editNetworkPage.checkPageIsLoaded();

        // Verify the new endpoint is still there
        await editNetworkPage.checkRpcIsDisplayed('responsive-rpc.test');
      },
    );
  });
});
