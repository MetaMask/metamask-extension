import { Suite } from 'mocha';
import FixtureBuilder from '../../fixture-builder';
import { withFixtures } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import { Mockttp } from '../../mock-e2e';
import AddNetworkRpcUrlModal from '../../page-objects/pages/dialog/add-network-rpc-url';
import AddEditNetworkModal from '../../page-objects/pages/dialog/add-edit-network';
import HomePage from '../../page-objects/pages/home/homepage';
import SelectNetwork from '../../page-objects/pages/dialog/select-network';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import { switchToEditRPCViaGlobalMenuNetworks } from '../../page-objects/flows/network.flow';

describe('Update Network:', function (this: Suite) {
  it('update network details and validate the ui elements', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        const inputData = {
          networkName: 'Update Network',
          rpcUrl: 'test',
        };
        await loginWithBalanceValidation(driver);
        await switchToEditRPCViaGlobalMenuNetworks(driver);

        const selectNetworkDialog = new SelectNetwork(driver);
        await selectNetworkDialog.checkPageIsLoaded();
        await selectNetworkDialog.openNetworkListOptions('eip155:1337');
        await selectNetworkDialog.openEditNetworkModal();

        // Verify chain id is not editable when updating a network
        const editNetworkModal = new AddEditNetworkModal(driver);
        await editNetworkModal.checkPageIsLoaded();
        await editNetworkModal.checkChainIdInputFieldIsEnabled(false);

        // Update the network name and save the changes
        await editNetworkModal.fillNetworkNameInputField(inputData.networkName);
        await editNetworkModal.saveEditedNetwork();

        // Verify the new network name is visible
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await homePage.checkEditNetworkMessageIsDisplayed(
          inputData.networkName,
        );
        await homePage.closeUseNetworkNotificationModal();
        // Since switching networks is disabled via the networks modal in global menu, we don't need to check the selected network anymore
        await switchToEditRPCViaGlobalMenuNetworks(driver);

        await selectNetworkDialog.checkPageIsLoaded();
        await selectNetworkDialog.openNetworkListOptions('eip155:1337');
        await selectNetworkDialog.openEditNetworkModal();
        await editNetworkModal.checkPageIsLoaded();

        // Edit the RPC URL to something invalid
        await editNetworkModal.openAddRpcUrlModal();
        const addNetworkRpcUrlModal = new AddNetworkRpcUrlModal(driver);
        await addNetworkRpcUrlModal.checkPageIsLoaded();
        await addNetworkRpcUrlModal.fillAddRpcUrlInput(inputData.rpcUrl);

        // Validate the error message that appears for the invalid url format
        await addNetworkRpcUrlModal.checkErrorMessageInvalidUrlIsDisplayed();

        // Validate the Save button is disabled for the invalid url format
        await addNetworkRpcUrlModal.checkAddRpcUrlButtonIsEnabled(false);
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
        fixtures: new FixtureBuilder()
          .withNetworkController({
            providerConfig: {
              rpcPrefs: { blockExplorerUrl: 'https://etherscan.io/' },
            },
            networkConfigurations: {
              networkConfigurationId: {
                chainId: '0x539',
                nickname: 'Localhost 8545',
                rpcUrl: 'http://localhost:8545',
                ticker: 'ETH',
                rpcPrefs: { blockExplorerUrl: 'https://etherscan.io/' },
              },
              '2ce66016-8aab-47df-b27f-318c80865eb0': {
                chainId: '0xa4b1',
                id: '2ce66016-8aab-47df-b27f-318c80865eb0',
                nickname: 'Arbitrum mainnet',
                rpcPrefs: {},
                rpcUrl: 'https://arbitrum-mainnet.infura.io',
                ticker: 'ETH',
              },
              '2ce66016-8aab-47df-b27f-318c80865eb1': {
                chainId: '0xa4b1',
                id: '2ce66016-8aab-47df-b27f-318c80865eb1',
                nickname: 'Arbitrum mainnet 2',
                rpcPrefs: {},
                rpcUrl: 'https://responsive-rpc.test/',
                ticker: 'ETH',
              },
            },
            selectedNetworkClientId: 'networkConfigurationId',
          })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockRPCURLAndChainId,
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);
        await switchToEditRPCViaGlobalMenuNetworks(driver);

        const selectNetworkDialog = new SelectNetwork(driver);
        await selectNetworkDialog.checkPageIsLoaded();

        // Go to Edit Menu
        await selectNetworkDialog.openNetworkListOptions('eip155:42161');
        await selectNetworkDialog.openEditNetworkModal();
        const editNetworkModal = new AddEditNetworkModal(driver);
        await editNetworkModal.checkPageIsLoaded();

        // Remove the RPC
        await editNetworkModal.removeRPCInEditNetworkModal(2);
        await editNetworkModal.checkRpcIsDisplayed(
          'responsive-rpc.test',
          false,
        );
        await editNetworkModal.saveEditedNetwork();
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await homePage.checkEditNetworkMessageIsDisplayed('Arbitrum');
        await homePage.closeUseNetworkNotificationModal();

        // Re-open the network menu and go back to edit the network
        await switchToEditRPCViaGlobalMenuNetworks(driver);

        await selectNetworkDialog.checkPageIsLoaded();
        await selectNetworkDialog.openNetworkListOptions('eip155:42161');
        await selectNetworkDialog.openEditNetworkModal();
        await editNetworkModal.checkPageIsLoaded();

        // Verify the rpc endpoint is removed
        await editNetworkModal.checkRpcIsDisplayed(
          'responsive-rpc.test',
          false,
        );
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
        fixtures: new FixtureBuilder()
          .withNetworkController({
            providerConfig: {
              rpcPrefs: { blockExplorerUrl: 'https://etherscan.io/' },
            },
            networkConfigurations: {
              networkConfigurationId: {
                chainId: '0x539',
                nickname: 'Localhost 8545',
                rpcUrl: 'http://localhost:8545',
                ticker: 'ETH',
                rpcPrefs: { blockExplorerUrl: 'https://etherscan.io/' },
              },
              '2ce66016-8aab-47df-b27f-318c80865eb0': {
                chainId: '0xa4b1',
                id: '2ce66016-8aab-47df-b27f-318c80865eb0',
                nickname: 'Arbitrum mainnet',
                rpcPrefs: {},
                rpcUrl: 'https://arbitrum-mainnet.infura.io',
                ticker: 'ETH',
              },
            },
            selectedNetworkClientId: 'networkConfigurationId',
          })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockRPCURLAndChainId,
      },

      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);
        await switchToEditRPCViaGlobalMenuNetworks(driver);

        const selectNetworkDialog = new SelectNetwork(driver);
        await selectNetworkDialog.checkPageIsLoaded();

        // Go to Edit Menu
        await selectNetworkDialog.openNetworkListOptions('eip155:42161');
        await selectNetworkDialog.openEditNetworkModal();
        const editNetworkModal = new AddEditNetworkModal(driver);
        await editNetworkModal.checkPageIsLoaded();

        // Add a new rpc url and verify it appears in the dropdown
        await editNetworkModal.openAddRpcUrlModal();
        const addNetworkRpcUrlModal = new AddNetworkRpcUrlModal(driver);
        await addNetworkRpcUrlModal.checkPageIsLoaded();
        await addNetworkRpcUrlModal.fillAddRpcUrlInput(
          'https://responsive-rpc.test',
        );
        await addNetworkRpcUrlModal.fillAddRpcNameInput('testName');
        await addNetworkRpcUrlModal.checkAddRpcUrlButtonIsEnabled();
        await addNetworkRpcUrlModal.saveAddRpcUrl();
        await editNetworkModal.checkRpcIsDisplayed('responsive-rpc.test');

        // Save the network
        await editNetworkModal.saveEditedNetwork();
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await homePage.checkEditNetworkMessageIsDisplayed('Arbitrum');
        await homePage.closeUseNetworkNotificationModal();

        // Re-open the network menu and go back to edit the network
        await switchToEditRPCViaGlobalMenuNetworks(driver);

        await selectNetworkDialog.checkPageIsLoaded();
        await selectNetworkDialog.openNetworkListOptions('eip155:42161');
        await selectNetworkDialog.openEditNetworkModal();
        await editNetworkModal.checkPageIsLoaded();

        // Verify the new endpoint is still there
        await editNetworkModal.checkRpcIsDisplayed('responsive-rpc.test');
      },
    );
  });
});
