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
  ethereumNetwork: { text: 'Ethereum Mainnet', tag: 'div' },
  deleteButton: { text: 'Delete', tag: 'button' },
  cancelButton: { text: 'Cancel', tag: 'button' },
  saveButton: { text: 'Save', tag: 'button' },
  updatedNetworkDropDown: { tag: 'span', text: 'Update Network' },
  errorMessageInvalidUrl: {
    tag: 'h6',
    text: 'URLs require the appropriate HTTP/HTTPS prefix.',
  },
  networkNameInputField: '[data-testid="network-form-network-name"]',
  rpcUrlInputField: '[data-testid="network-form-rpc-url"]',
};

async function editNetworkDetails(
  driver: Driver,
  inputField: string,
  inputValue: string,
) {
  const inputTextFieldToEdit = await driver.findElement(inputField);
  await inputTextFieldToEdit.clear();
  await inputTextFieldToEdit.sendKeys(inputValue);
}

async function navigateToEditNetwork(driver: Driver) {
  await driver.clickElement(selectors.accountOptionsMenuButton);
  await driver.clickElement(selectors.settingsOption);
  await driver.clickElement(selectors.networkOption);
}
describe('Update Network:', function (this: Suite) {
  it('name is updated and validate the ui elements', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test?.fullTitle(),
      },

      async ({ driver }: { driver: Driver }) => {
        await unlockWallet(driver);
        await navigateToEditNetwork(driver);
        await editNetworkDetails(
          driver,
          selectors.networkNameInputField,
          'Update Network',
        );
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
        await editNetworkDetails(driver, selectors.rpcUrlInputField, 'test');

        // Validate the error message that appears for the invalid url format
        const errorMessage = await driver.isElementPresent(
          selectors.errorMessageInvalidUrl,
        );
        assert.equal(
          errorMessage,
          true,
          'Error message for the invalid url did not appear',
        );

        // Validate the Save button is disabled
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

        // Validate the Save,Cancel Delete button is not present for the default network
        await driver.assertElementNotPresent(selectors.deleteButton);
        await driver.assertElementNotPresent(selectors.cancelButton);
        await driver.assertElementNotPresent(selectors.saveButton);
      },
    );
  });
});
