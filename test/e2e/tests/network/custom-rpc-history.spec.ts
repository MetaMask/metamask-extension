import { Suite } from 'mocha';
import { mockNetworkStateOld } from '../../../stub/networks';
import { withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import AddEditNetworkModal from '../../page-objects/pages/dialog/add-edit-network';
import AddNetworkRpcUrlModal from '../../page-objects/pages/dialog/add-network-rpc-url';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import Homepage from '../../page-objects/pages/home/homepage';
import SelectNetwork from '../../page-objects/pages/dialog/select-network';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';

describe('Custom RPC history', function (this: Suite) {
  it(`creates first custom RPC entry`, async function () {
    const port = 8546;
    const chainId = 1338;
    const symbol = 'TEST';

    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
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

        await new HeaderNavbar(driver).clickSwitchNetworkDropDown();
        const selectNetworkDialog = new SelectNetwork(driver);
        await selectNetworkDialog.check_pageIsLoaded();
        await selectNetworkDialog.openAddCustomNetworkModal();

        const addEditNetworkModal = new AddEditNetworkModal(driver);
        await addEditNetworkModal.check_pageIsLoaded();
        await addEditNetworkModal.fillNetworkNameInputField(networkName);
        await addEditNetworkModal.fillNetworkChainIdInputField(
          chainId.toString(),
        );
        await addEditNetworkModal.fillCurrencySymbolInputField(symbol);
        await addEditNetworkModal.openAddRpcUrlModal();

        // Add rpc url
        const addRpcUrlModal = new AddNetworkRpcUrlModal(driver);
        await addRpcUrlModal.check_pageIsLoaded();
        await addRpcUrlModal.fillAddRpcUrlInput(rpcUrl);
        await addRpcUrlModal.fillAddRpcNameInput('test-name');
        await addRpcUrlModal.saveAddRpcUrl();
        await addEditNetworkModal.saveEditedNetwork();

        // Validate the network was added
        const homepage = new Homepage(driver);
        await homepage.check_pageIsLoaded();
        await homepage.check_addNetworkMessageIsDisplayed(networkName);
      },
    );
  });

  it('warns user when they enter url for an already configured network', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);

        // Duplicate network
        const duplicateRpcUrl = 'https://mainnet.infura.io/v3/';

        await new HeaderNavbar(driver).clickSwitchNetworkDropDown();
        const selectNetworkDialog = new SelectNetwork(driver);
        await selectNetworkDialog.check_pageIsLoaded();
        await selectNetworkDialog.openAddCustomNetworkModal();
        const addEditNetworkModal = new AddEditNetworkModal(driver);
        await addEditNetworkModal.check_pageIsLoaded();
        await addEditNetworkModal.openAddRpcUrlModal();

        // Add rpc url
        const addRpcUrlModal = new AddNetworkRpcUrlModal(driver);
        await addRpcUrlModal.check_pageIsLoaded();
        await addRpcUrlModal.fillAddRpcUrlInput(duplicateRpcUrl);
        await addRpcUrlModal.fillAddRpcNameInput('test-name');
        await addRpcUrlModal.saveAddRpcUrl();

        await addEditNetworkModal.check_pageIsLoaded();
        await addEditNetworkModal.fillNetworkChainIdInputField('1');
        await addEditNetworkModal.check_chainIdInputErrorMessageIsDisplayed(
          'The RPC URL you have entered returned a different chain ID (1337).',
        );
      },
    );
  });

  it('warns user when they enter chainId for an already configured network', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);

        // Duplicate network
        const duplicateChainId = '1';

        await new HeaderNavbar(driver).clickSwitchNetworkDropDown();
        const selectNetworkDialog = new SelectNetwork(driver);
        await selectNetworkDialog.check_pageIsLoaded();
        await selectNetworkDialog.openAddCustomNetworkModal();
        const addEditNetworkModal = new AddEditNetworkModal(driver);
        await addEditNetworkModal.check_pageIsLoaded();
        await addEditNetworkModal.fillNetworkChainIdInputField(
          duplicateChainId,
        );
        await addEditNetworkModal.check_chainIdInputErrorMessageIsDisplayed(
          'This Chain ID is currently used by the Ethereum Mainnet network.',
        );

        // Add invalid rcp url
        await addEditNetworkModal.openAddRpcUrlModal();
        const addRpcUrlModal = new AddNetworkRpcUrlModal(driver);
        await addRpcUrlModal.check_pageIsLoaded();
        await addRpcUrlModal.fillAddRpcUrlInput('test');
        await addRpcUrlModal.fillAddRpcNameInput('test-name');
        await addRpcUrlModal.check_errorMessageInvalidUrlIsDisplayed();
      },
    );
  });

  it('finds all recent RPCs in history', async function () {
    const networkState = mockNetworkStateOld(
      {
        rpcUrl: 'http://127.0.0.1:8545/1',
        chainId: '0x539',
        ticker: 'ETH',
        nickname: 'http://127.0.0.1:8545/1',
      },
      {
        rpcUrl: 'http://127.0.0.1:8545/2',
        chainId: '0x539',
        ticker: 'ETH',
        nickname: 'http://127.0.0.1:8545/2',
      },
    );
    // Use type assertion to make selectedNetworkClientId optional
    (
      networkState as { selectedNetworkClientId?: string }
    ).selectedNetworkClientId = undefined;

    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withNetworkController(networkState)
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);
        await new HeaderNavbar(driver).clickSwitchNetworkDropDown();
        const selectNetworkDialog = new SelectNetwork(driver);
        await selectNetworkDialog.check_pageIsLoaded();

        // Custom rpcs length is 1 because networks has been merged
        await selectNetworkDialog.check_rpcIsSelected('Localhost 8545');
        await selectNetworkDialog.check_networkOptionIsDisplayed(
          'Localhost 8545',
        );

        // Only recent 3 are found and in correct order (most recent at the top)
        await selectNetworkDialog.openNetworkRPC('eip155:1337');
        await selectNetworkDialog.check_networkRPCNumber(3);
      },
    );
  });

  it('deletes a custom RPC', async function () {
    const networkState = mockNetworkStateOld(
      {
        rpcUrl: 'http://127.0.0.1:8545/1',
        chainId: '0x539',
        ticker: 'ETH',
        nickname: 'http://127.0.0.1:8545/1',
      },
      {
        rpcUrl: 'http://127.0.0.1:8545/2',
        chainId: '0x540',
        ticker: 'ETH',
        nickname: 'http://127.0.0.1:8545/2',
      },
    );
    // Use type assertion to make selectedNetworkClientId optional
    (
      networkState as { selectedNetworkClientId?: string }
    ).selectedNetworkClientId = undefined;

    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withNetworkController(networkState)
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.clickSwitchNetworkDropDown();
        const selectNetworkDialog = new SelectNetwork(driver);
        await selectNetworkDialog.check_pageIsLoaded();
        await selectNetworkDialog.check_networkOptionIsDisplayed(
          'http://127.0.0.1:8545/2',
        );

        // Delete network from network list
        await selectNetworkDialog.deleteNetwork('eip155:1344');
        const homepage = new Homepage(driver);
        await homepage.check_pageIsLoaded();
        await homepage.check_expectedBalanceIsDisplayed();
        await homepage.headerNavbar.check_currentSelectedNetwork(
          'Localhost 8545',
        );

        // Check custom network http://127.0.0.1:8545/2 is removed from network list
        // need a hard delay to avoid the background error message "network configuration not found" for removed network
        await driver.delay(2000);
        await headerNavbar.clickSwitchNetworkDropDown();
        await selectNetworkDialog.check_pageIsLoaded();
        await selectNetworkDialog.check_networkOptionIsDisplayed(
          'http://127.0.0.1:8545/2',
          false,
        );
      },
    );
  });
});
