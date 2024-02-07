import { strict as assert } from 'assert';
import { WebElement } from 'selenium-webdriver';
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
  inputText: 'input[type="text"]',
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
};

async function editNetworkDetails(
  driver: Driver,
  indexOfInputField: number,
  inputValue: string,
) {
  const getAllInputElements: WebElement[] = (await driver.findElements(
    selectors.inputText,
  )) as WebElement[];
  const inputTextFieldToEdit: WebElement =
    getAllInputElements[indexOfInputField];
  await inputTextFieldToEdit.clear();
  await inputTextFieldToEdit.sendKeys(inputValue);
}

async function navigateToEditNetwork(driver: Driver) {
  await driver.clickElement(selectors.accountOptionsMenuButton);
  await driver.clickElement(selectors.settingsOption);
  await driver.clickElement(selectors.networkOption);
}
describe('Update Network:', function (this: Suite) {
  it('validate network name is updated', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test?.fullTitle(),
      },

      async ({ driver }: { driver: Driver }) => {
        await unlockWallet(driver);
        await navigateToEditNetwork(driver);
        await editNetworkDetails(driver, 2, 'Update Network');
        await driver.clickElement(selectors.saveButton);

        const networkName = await driver.findElement(
          selectors.updatedNetworkDropDown,
        );
        const updatedNetworkName = await networkName.getText();
        assert.equal(
          updatedNetworkName,
          'Update Network',
          'Network name is not updated',
        );

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
        const saveButton = await driver.findElement(selectors.saveButton);
        const saveButtonEnabled = await saveButton.isEnabled();
        assert.equal(saveButtonEnabled, false, 'Save button is enabled');

        const informationSymbolAppears = await driver.isElementPresent(
          selectors.informationSymbol,
        );
        assert.equal(
          informationSymbolAppears,
          true,
          'Information symbol did not appear for chain id',
        );

        await driver.clickElement(selectors.ethereumNetwork);
        // Validate the Delete button is not visible
        const deleteButtonVisible = await driver.isElementPresentAndVisible(
          selectors.deleteButton,
        );
        assert.equal(deleteButtonVisible, false, 'Delete button is visible');
        // Validate the Cancel button is not visible
        const cancelButtonVisible = await driver.isElementPresentAndVisible(
          selectors.cancelButton,
        );
        assert.equal(cancelButtonVisible, false, 'Cancel button is visible');
        // Validate the Save button is not visible
        const saveButtonVisible = await driver.isElementPresentAndVisible(
          selectors.saveButton,
        );
        assert.equal(saveButtonVisible, false, 'Save button is visible');
      },
    );
  });
});
