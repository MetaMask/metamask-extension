import { strict as assert } from 'assert';
import { Suite } from 'mocha';
import FixtureBuilder from '../../fixture-builder';
import {
  defaultGanacheOptions,
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
    tag: 'h6',
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
  chainId: '0x539',
};

async function navigateToEditNetwork(driver: Driver) {
  await driver.clickElement(selectors.accountOptionsMenuButton);
  await driver.clickElement(selectors.settingsOption);
  await driver.clickElement(selectors.networkOption);
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
        await driver.fill(
          selectors.networkNameInputField,
          inputData.networkName,
        );
        await driver.fill(selectors.chainIdInputField, inputData.chainId);
        await driver.clickElement(selectors.saveButton);

        // Validate the network name is updated
        const updatedNetworkNamePresent = await driver.isElementPresent(
          selectors.updatedNetworkDropDown,
        );
        assert.equal(
          updatedNetworkNamePresent,
          true,
          'Network name is not updated',
        );

        await navigateToEditNetwork(driver);
        await driver.fill(selectors.rpcUrlInputField, inputData.rpcUrl);

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
        const saveButton = await driver.findElement(selectors.saveButton);
        const saveButtonEnabled = await saveButton.isEnabled();
        assert.equal(saveButtonEnabled, false, 'Save button is enabled');

        // Validate the information symbol appears for chain id
        const informationSymbolAppears = await driver.isElementPresent(
          selectors.informationSymbol,
        );
        assert.equal(
          informationSymbolAppears,
          true,
          'Information symbol did not appear for chain id',
        );

        await driver.clickElement(selectors.ethereumNetwork);

        // Validate the Save, Cancel, and Delete buttons are not present for the default network
        await driver.assertElementNotPresent(selectors.deleteButton, {
          findElementGuard: selectors.networkNameInputFieldSetToEthereumMainnet, // Wait for the network selection to complete
        });
        // The findElementGuard above is sufficient for the next two assertions
        await driver.assertElementNotPresent(selectors.cancelButton);
        await driver.assertElementNotPresent(selectors.saveButton);

        // Validate the error does not appear on the General tab
        await driver.clickElement(selectors.generalOption);
        await driver.assertElementNotPresent(selectors.errorContainer, {
          findElementGuard: selectors.generalTabHeader, // Wait for the General tab to load
        });
      },
    );
  });
});
