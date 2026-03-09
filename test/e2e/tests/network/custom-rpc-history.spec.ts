import { Suite } from 'mocha';
import { NetworkStatus, RpcEndpointType } from '@metamask/network-controller';
import { withFixtures } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import AddEditNetworkModal from '../../page-objects/pages/dialog/add-edit-network';
import AddNetworkRpcUrlModal from '../../page-objects/pages/dialog/add-network-rpc-url';
import Homepage from '../../page-objects/pages/home/homepage';
import SelectNetwork from '../../page-objects/pages/dialog/select-network';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
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
        await loginWithBalanceValidation(driver);

        const rpcUrl = `http://127.0.0.1:${port}`;
        const networkName = 'Secondary Local Testnet';

        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.openGlobalNetworksMenu();
        const selectNetworkDialog = new SelectNetwork(driver);
        await selectNetworkDialog.checkPageIsLoaded();
        await selectNetworkDialog.openAddCustomNetworkModal();

        const addEditNetworkModal = new AddEditNetworkModal(driver);
        await addEditNetworkModal.checkPageIsLoaded();
        await addEditNetworkModal.fillNetworkNameInputField(networkName);
        await addEditNetworkModal.fillNetworkChainIdInputField(
          chainId.toString(),
        );
        await addEditNetworkModal.fillCurrencySymbolInputField(symbol);
        await addEditNetworkModal.openAddRpcUrlModal();

        // Add rpc url
        const addRpcUrlModal = new AddNetworkRpcUrlModal(driver);
        await addRpcUrlModal.checkPageIsLoaded();
        await addRpcUrlModal.fillAddRpcUrlInput(rpcUrl);
        await addRpcUrlModal.fillAddRpcNameInput('test-name');
        await addRpcUrlModal.saveAddRpcUrl();
        await addEditNetworkModal.saveEditedNetwork();

        // Validate the network was added
        const homepage = new Homepage(driver);
        await homepage.checkPageIsLoaded();
        await homepage.checkAddNetworkMessageIsDisplayed(networkName);
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
        await loginWithBalanceValidation(driver);

        // Duplicate network
        const duplicateRpcUrl = 'https://mainnet.infura.io/v3/';

        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.openGlobalNetworksMenu();
        const selectNetworkDialog = new SelectNetwork(driver);
        await selectNetworkDialog.checkPageIsLoaded();
        await selectNetworkDialog.openAddCustomNetworkModal();
        const addEditNetworkModal = new AddEditNetworkModal(driver);
        await addEditNetworkModal.checkPageIsLoaded();
        await addEditNetworkModal.openAddRpcUrlModal();

        // Add rpc url
        const addRpcUrlModal = new AddNetworkRpcUrlModal(driver);
        await addRpcUrlModal.checkPageIsLoaded();
        await addRpcUrlModal.fillAddRpcUrlInput(duplicateRpcUrl);
        await addRpcUrlModal.fillAddRpcNameInput('test-name');
        await addRpcUrlModal.saveAddRpcUrl();

        await addEditNetworkModal.checkPageIsLoaded();
        await addEditNetworkModal.fillNetworkChainIdInputField('1');
        await addEditNetworkModal.checkChainIdInputErrorMessageIsDisplayed(
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
        await loginWithBalanceValidation(driver);

        // Duplicate network
        const duplicateChainId = '1';

        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.openGlobalNetworksMenu();
        const selectNetworkDialog = new SelectNetwork(driver);
        await selectNetworkDialog.checkPageIsLoaded();
        await selectNetworkDialog.openAddCustomNetworkModal();
        const addEditNetworkModal = new AddEditNetworkModal(driver);
        await addEditNetworkModal.checkPageIsLoaded();
        await addEditNetworkModal.fillNetworkChainIdInputField(
          duplicateChainId,
        );
        await addEditNetworkModal.checkChainIdInputErrorMessageIsDisplayed(
          'This Chain ID is currently used by the Ethereum network.',
        );

        // Add invalid rcp url
        await addEditNetworkModal.openAddRpcUrlModal();
        const addRpcUrlModal = new AddNetworkRpcUrlModal(driver);
        await addRpcUrlModal.checkPageIsLoaded();
        await addRpcUrlModal.fillAddRpcUrlInput('test');
        await addRpcUrlModal.fillAddRpcNameInput('test-name');
        await addRpcUrlModal.checkErrorMessageInvalidUrlIsDisplayed();
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
                    networkClientId: 'networkConfigurationId',
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
        await loginWithBalanceValidation(driver);
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.openGlobalNetworksMenu();
        const selectNetworkDialog = new SelectNetwork(driver);
        await selectNetworkDialog.checkPageIsLoaded();

        // Custom rpcs length is 1 because networks has been merged
        await selectNetworkDialog.checkNetworkOptionIsDisplayed(
          'Localhost 8545',
        );

        // Only recent 3 are found and in correct order (most recent at the top)
        await selectNetworkDialog.openNetworkRPC('eip155:1337');
        await selectNetworkDialog.checkNetworkRPCNumber(3);
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
                    networkClientId: 'networkConfigurationId',
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
        await loginWithBalanceValidation(driver);
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.openGlobalNetworksMenu();
        const selectNetworkDialog = new SelectNetwork(driver);
        await selectNetworkDialog.checkPageIsLoaded();
        await selectNetworkDialog.checkNetworkOptionIsDisplayed(
          'http://127.0.0.1:8545/2',
        );

        // Delete network from network list
        await selectNetworkDialog.deleteNetwork('eip155:1344');
        const homepage = new Homepage(driver);
        await homepage.checkPageIsLoaded();
        await homepage.checkExpectedBalanceIsDisplayed();

        // Check custom network http://127.0.0.1:8545/2 is removed from network list
        // need a hard delay to avoid the background error message "network configuration not found" for removed network
        await driver.delay(2000);
        await headerNavbar.openGlobalNetworksMenu();
        await selectNetworkDialog.checkPageIsLoaded();
        await selectNetworkDialog.checkNetworkOptionIsDisplayed(
          'http://127.0.0.1:8545/2',
          false,
        );
      },
    );
  });
});
