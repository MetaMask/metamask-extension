import { Suite } from 'mocha';
import FixtureBuilder from '../../fixture-builder';
import {
  regularDelayMs,
  unlockWallet,
  withFixtures,
} from '../../helpers';
import { Driver } from '../../webdriver/driver';
import { Mockttp } from '../../mock-e2e';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import SelectNetwork from '../../page-objects/pages/dialog/select-network';
import EditNetworkModal from '../../page-objects/pages/dialog/edit-network';
import HomePage from '../../page-objects/pages/home/homepage';
import AddNetworkRpcUrlModal from '../../page-objects/pages/dialog/add-network-rpc-url';

const selectors = {
  accountOptionsMenuButton: '[data-testid="account-options-menu-button"]',
  informationSymbol: '[data-testid="info-tooltip"]',
  settingsOption: { text: 'Settings', tag: 'div' },
  networkOption: { text: 'Networks', tag: 'div' },
  generalOption: { text: 'General', tag: 'div' },
  generalTabHeader: { text: 'General', tag: 'h4' },
  ethereumNetwork: { text: 'Ethereum Mainnet', tag: 'div' },
  newUpdateNetwork: { text: 'Update Network', tag: 'div' },
  deleteButton: { text: 'Delete', tag: 'button' },
  cancelButton: { text: 'Cancel', tag: 'button' },
  saveButton: { text: 'Save', tag: 'button' },
  updatedNetworkDropDown: { tag: 'p', text: 'Update Network' },
  errorMessageInvalidUrl: {
    text: 'URLs require the appropriate HTTP/HTTPS prefix.',
  },
  networkNameInputField: '[data-testid="network-form-network-name"]',
  networkNameInputFieldSetToEthereumMainnet: {
    xpath:
      "//input[@data-testid = 'network-form-network-name'][@value = 'Ethereum Mainnet']",
  },
  rpcUrlInputField: '[data-testid="network-form-rpc-url"]',
  chainIdInputField: '[data-testid="network-form-chain-id"]',
  errorContainer: '.settings-tab__error',
};

const inputData = {
  networkName: 'Update Network',
  rpcUrl: 'test',
  chainId_part1: '0x53',
  chainId_part2: '9',
};

describe('Update Network:', function (this: Suite) {
  it('update network details and validate the ui elements', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
      },

      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.clickSwitchNetworkDropDown();

        const selectNetworkDialog = new SelectNetwork(driver);
        await selectNetworkDialog.check_pageIsLoaded();
        await selectNetworkDialog.openNetworkListOptions('eip155:1337');
        await selectNetworkDialog.openEditNetworkModal();

        // Verify chain id is not editable when updating a network
        const editNetworkModal = new EditNetworkModal(driver);
        await editNetworkModal.check_pageIsLoaded()
        await editNetworkModal.check_chainIdInputFieldIsEnabled(false);

        // Update the network name and save the changes
        await editNetworkModal.fillNetworkNameInputField(inputData.networkName);
        await editNetworkModal.saveEditedNetwork();

        // Verify the new network name is visible
        const homePage = new HomePage(driver);
        await homePage.check_pageIsLoaded();
        await homePage.check_editNetworkMessageIsDisplayed(inputData.networkName);
        await homePage.closeUseNetworkNotificationModal();
        await headerNavbar.check_currentSelectedNetwork(inputData.networkName);

        // Start another edit
        await headerNavbar.clickSwitchNetworkDropDown();
        await selectNetworkDialog.check_pageIsLoaded();
        await selectNetworkDialog.openNetworkListOptions('eip155:1337');
        await selectNetworkDialog.openEditNetworkModal();
        await editNetworkModal.check_pageIsLoaded()

        // Edit the RPC URL to something invalid
        await editNetworkModal.openAddRpcUrlModal();
        const addNetworkRpcUrlModal = new AddNetworkRpcUrlModal(driver);
        await addNetworkRpcUrlModal.check_pageIsLoaded();
        await addNetworkRpcUrlModal.fillAddRpcUrlInput(inputData.rpcUrl);

        // Validate the error message that appears for the invalid url format
        await addNetworkRpcUrlModal.check_errorMessageInvalidUrlIsDisplayed();

        // Validate the Save button is disabled for the invalid url format
        await addNetworkRpcUrlModal.check_addRpcUrlButtonIsEnabled(false);
      },
    );
  });

  it.only('should delete added rpc url for existing network', async function () {
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
        await unlockWallet(driver);

        // Avoid a stale element error
        await driver.delay(regularDelayMs);
        await driver.clickElement('[data-testid="network-display"]');
        throw new Error('test');

        // Go to Edit Menu
        await driver.clickElement(
          '[data-testid="network-list-item-options-button-eip155:42161"]',
        );

        await driver.delay(regularDelayMs);
        await driver.clickElement(
          '[data-testid="network-list-item-options-edit"]',
        );

        await driver.delay(regularDelayMs);
        await driver.clickElement('[data-testid="test-add-rpc-drop-down"]');
        await driver.delay(regularDelayMs);

        // Assert the endpoint is in the list
        await driver.findElement({
          text: 'responsive-rpc.test',
          tag: 'p',
        });

        // Delete it
        await driver.clickElement('[data-testid="delete-item-1"]');

        // Verify it went away
        await driver.assertElementNotPresent({
          text: 'responsive-rpc.test',
          tag: 'p',
        });

        // Save the network
        await driver.clickElement(selectors.saveButton);

        //  Re-open the network menu
        await driver.delay(regularDelayMs);
        // We need to use clickElementSafe + assertElementNotPresent as sometimes the network dialog doesn't appear, as per this issue (#27870)
        // TODO: change the 2 actions for clickElementAndWaitToDisappear, once the issue is fixed
        await driver.clickElementSafe({ text: 'Got it', tag: 'h6' });
        await driver.assertElementNotPresent({
          tag: 'h6',
          text: 'Got it',
        });
        await driver.clickElement('[data-testid="network-display"]');

        // Go back to edit the network
        await driver.clickElement(
          '[data-testid="network-list-item-options-button-eip155:42161"]',
        );
        await driver.delay(regularDelayMs);
        await driver.clickElement(
          '[data-testid="network-list-item-options-edit"]',
        );

        // Verify the rpc endpoint is still deleted
        await driver.clickElement('[data-testid="test-add-rpc-drop-down"]');
        await driver.assertElementNotPresent({
          text: 'responsive-rpc.test',
          tag: 'p',
        });
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
        await unlockWallet(driver);

        // Avoid a stale element error
        await driver.delay(regularDelayMs);
        await driver.clickElement('[data-testid="network-display"]');

        // Go to edit the network
        await driver.clickElement(
          '[data-testid="network-list-item-options-button-eip155:42161"]',
        );
        await driver.delay(regularDelayMs);
        await driver.clickElement(
          '[data-testid="network-list-item-options-edit"]',
        );

        // Add a new rpc url
        await driver.delay(regularDelayMs);
        await driver.clickElement('[data-testid="test-add-rpc-drop-down"]');
        await driver.delay(regularDelayMs);
        await driver.clickElement({
          text: 'Add RPC URL',
          tag: 'button',
        });
        const rpcUrlInput = await driver.waitForSelector(
          '[data-testid="rpc-url-input-test"]',
        );
        await rpcUrlInput.clear();
        await rpcUrlInput.sendKeys('https://responsive-rpc.test');

        const rpcNameInput = await driver.waitForSelector(
          '[data-testid="rpc-name-input-test"]',
        );
        await rpcNameInput.sendKeys('testName');
        await driver.clickElement({
          text: 'Add URL',
          tag: 'button',
        });
        await driver.delay(regularDelayMs);

        // Verify it appears in the dropdown
        await driver.findElement({
          text: 'responsive-rpc.test',
          tag: 'p',
        });

        // Save the network
        await driver.clickElement(selectors.saveButton);

        //  Re-open the network menu
        await driver.delay(regularDelayMs);
        // We need to use clickElementSafe + assertElementNotPresent as sometimes the network dialog doesn't appear, as per this issue (#27870)
        // TODO: change the 2 actions for clickElementAndWaitToDisappear, once the issue is fixed
        await driver.clickElementSafe({ text: 'Got it', tag: 'h6' });
        await driver.assertElementNotPresent({
          tag: 'h6',
          text: 'Got it',
        });
        await driver.clickElement('[data-testid="network-display"]');

        // Go back to edit the network
        await driver.clickElement(
          '[data-testid="network-list-item-options-button-eip155:42161"]',
        );
        await driver.delay(regularDelayMs);
        await driver.clickElement(
          '[data-testid="network-list-item-options-edit"]',
        );

        // Verify the new endpoint is still there
        await driver.findElement({
          text: 'responsive-rpc.test',
          tag: 'p',
        });
      },
    );
  });
});
