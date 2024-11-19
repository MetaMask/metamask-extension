import { strict as assert } from 'assert';
import { Suite } from 'mocha';
import FixtureBuilder from '../../fixture-builder';
import {
  defaultGanacheOptions,
  regularDelayMs,
  tinyDelayMs,
  unlockWallet,
  withFixtures,
} from '../../helpers';
import { Driver } from '../../webdriver/driver';
import { Mockttp } from '../../mock-e2e';

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
  updatedNetworkDropDown: { tag: 'span', text: 'Update Network' },
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

async function navigateToEditNetwork(driver: Driver) {
  await driver.clickElement('.mm-picker-network');
  await driver.clickElement(
    '[data-testid="network-list-item-options-button-0x539"]',
  );
  await driver.clickElement('[data-testid="network-list-item-options-edit"]');
}

describe('Update Network:', function (this: Suite) {
  it('update network details and validate the ui elements', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test?.fullTitle(),
      },

      async ({ driver }: { driver: Driver }) => {
        await unlockWallet(driver);
        await navigateToEditNetwork(driver);

        // Verify chain id is not editable when updating a network
        const chainIdInput = await driver.findElement(
          selectors.chainIdInputField,
        );
        assert.equal(
          await chainIdInput.isEnabled(),
          false,
          'chain id input should be disabled',
        );

        // Update the network name
        await driver.fill(
          selectors.networkNameInputField,
          inputData.networkName,
        );

        // Save, and verify the new network name is visible
        await driver.clickElement(selectors.saveButton);
        const updatedNetworkNamePresent = await driver.isElementPresent(
          selectors.updatedNetworkDropDown,
        );
        assert.equal(
          updatedNetworkNamePresent,
          true,
          'Network name is not updated',
        );

        // Start another edit
        await navigateToEditNetwork(driver);

        // Edit the RPC URL to something invalid
        const rpcUrlInputDropDown = await driver.waitForSelector(
          '[data-testid="test-add-rpc-drop-down"]',
        );
        await rpcUrlInputDropDown.click();
        await driver.delay(tinyDelayMs);
        await driver.clickElement({
          text: 'Add RPC URL',
          tag: 'button',
        });
        const rpcUrlInput = await driver.waitForSelector(
          '[data-testid="rpc-url-input-test"]',
        );
        await rpcUrlInput.sendKeys(inputData.rpcUrl);

        // Validate the error message that appears for the invalid url format
        const errorMessage = await driver.isElementPresent(
          selectors.errorMessageInvalidUrl,
        );
        assert.equal(
          errorMessage,
          true,
          'Error message for the invalid url did not appear',
        );

        // Validate the Save button is disabled for the invalid url format
        const addUrlButton = await driver.findElement({
          text: 'Add URL',
          tag: 'button',
        });
        assert.equal(
          await addUrlButton.isEnabled(),
          false,
          'Add url button should not be enabled',
        );
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
        ganacheOptions: defaultGanacheOptions,
        title: this.test?.fullTitle(),
        testSpecificMock: mockRPCURLAndChainId,
      },

      async ({ driver }: { driver: Driver }) => {
        await unlockWallet(driver);

        // Avoid a stale element error
        await driver.delay(regularDelayMs);
        await driver.clickElement('[data-testid="network-display"]');

        // Go to Edit Menu
        await driver.clickElement(
          '[data-testid="network-list-item-options-button-0xa4b1"]',
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
          '[data-testid="network-list-item-options-button-0xa4b1"]',
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
        ganacheOptions: defaultGanacheOptions,
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
          '[data-testid="network-list-item-options-button-0xa4b1"]',
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
          '[data-testid="network-list-item-options-button-0xa4b1"]',
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
