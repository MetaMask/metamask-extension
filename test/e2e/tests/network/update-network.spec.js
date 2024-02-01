const { strict: assert } = require('assert');
const {
  defaultGanacheOptions,
  withFixtures,
  unlockWallet,
} = require('../../helpers');
const FixtureBuilder = require('../../fixture-builder');

const selectors = {
  accountOptionsMenuButton: '[data-testid="account-options-menu-button"]',
  settingsOption: { text: 'Settings', tag: 'div' },
  networkOption: { text: 'Networks', tag: 'div' },
  ethereumNetwork: { text: 'Ethereum Mainnet', tag: 'div' },
  appHeaderLogo: '[data-testid="app-header-logo"]',
  deleteButton: { text: 'Delete', tag: 'button' },
  cancelButton: { text: 'Cancel', tag: 'button' },
  saveButton: { text: 'Save', tag: 'button' },
  networkText: { text: 'Localhost 8545', tag: 'input' },
  informationSymbol: '[data-testid="info-tooltip"]',
  inputText: 'input[type="text"]',
  updatedNameDropDown: { tag: 'span', text: 'Update Network' },
  errorMessageInvalidUrl: {
    tag: 'h6',
    text: 'URLs require the appropriate HTTP/HTTPS prefix.',
  },
  errorMessageInvalidChainId: {
    tag: 'h6',
    text: 'Could not fetch chain ID. Is your RPC URL correct?',
  },
};

const editNetworkDetails = async (driver, indexOfInputField, inputValue) => {
  const getAllInputText = await driver.findElements(selectors.inputText);
  const inputTextFieldToEdit = getAllInputText[indexOfInputField];
  await inputTextFieldToEdit.clear();
  await inputTextFieldToEdit.fill(inputValue);
};

async function navigateToEditNetwork(driver) {
  await driver.clickElement(selectors.accountOptionsMenuButton);
  await driver.clickElement(selectors.settingsOption);
  await driver.clickElement(selectors.networkOption);
}

describe('Update Network:', function () {
  it('default network should not be edited', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
      },

      async ({ driver }) => {
        await unlockWallet(driver);
        await navigateToEditNetwork(driver);
        await driver.clickElement(selectors.ethereumNetwork);
        // Validate the Delete button is disabled
        const deleteButtonVisible = await driver.isElementPresentAndVisible(
          selectors.deleteButton,
        );
        assert.equal(deleteButtonVisible, false, 'Delete button is visible');
        // Validate the Cancel button is disabled
        const cancelButtonVisible = await driver.isElementPresentAndVisible(
          selectors.cancelButton,
        );
        assert.equal(cancelButtonVisible, false, 'Cancel button is visible');
        // Validate the Save button is disabled
        const saveButtonVisible = await driver.isElementPresentAndVisible(
          selectors.saveButton,
        );
        assert.equal(saveButtonVisible, false, 'Save button is visible');
      },
    );
  });

  it('validate network name is updated', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
      },

      async ({ driver }) => {
        await unlockWallet(driver);
        await navigateToEditNetwork(driver);
        await editNetworkDetails(driver, 2, 'Update Network');
        await driver.clickElement(selectors.saveButton);

        const updatedNetworkName = await driver.findElement(
          selectors.updatedNameDropDown,
        );
        assert.equal(
          await updatedNetworkName.getText(),
          'Update Network',
          'Network name is not updated',
        );
      },
    );
  });

  it('error message for invalid rpc url format', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
      },

      async ({ driver }) => {
        await unlockWallet(driver);
        await navigateToEditNetwork(driver);
        await editNetworkDetails(driver, 3, 'test');

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
        const saveButtonEnable = await driver.findElement(selectors.saveButton);
        assert.equal(await saveButtonEnable.isEnabled(), false);
      },
    );
  });

  it('information symbol “i” appears for chain id', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
      },

      async ({ driver }) => {
        await unlockWallet(driver);
        await navigateToEditNetwork(driver);

        const informationSymbolAppears = await driver.isElementPresent(
          selectors.informationSymbol,
        );
        assert.equal(
          informationSymbolAppears,
          true,
          'Information symbol did not appear for chain id',
        );
      },
    );
  });
});
