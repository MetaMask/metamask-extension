import { strict as assert } from 'assert';
import { Suite } from 'mocha';
import FixtureBuilder from '../../fixture-builder';
import {
  defaultGanacheOptions,
  tinyDelayMs,
  unlockWallet,
  withFixtures,
} from '../../helpers';
import { Driver } from '../../webdriver/driver';

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
});
