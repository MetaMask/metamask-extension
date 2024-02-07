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
        await editNetworkDetails(driver, 2, 'Update Network');
        await driver.clickElement(selectors.saveButton);
        //Validate the network name is updated
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
        //Validate the information symbol appears for chain id
        assert.equal(
          informationSymbolAppears,
          true,
          'Information symbol did not appear for chain id',
        );

        await driver.clickElement(selectors.ethereumNetwork);
        // Validate the Save,Cancel Delete button is not present
        await driver.assertElementNotPresent(selectors.deleteButton);
        await driver.assertElementNotPresent(selectors.cancelButton);
        await driver.assertElementNotPresent(selectors.saveButton);
      },
    );
  });
});
