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

interface Selector {
  text?: string;
  tag?: string;
}
const testIdSelector: { [key: string]: string } = {
  accountOptionsMenuButton: '[data-testid="account-options-menu-button"]',
  informationSymbol: '[data-testid="info-tooltip"]',
  inputText: 'input[type="text"]',
};

const selectors: { [key: string]: Selector } = {
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
): Promise<void> {
  const getAllInputElements: WebElement[] = (await driver.findElements(
    testIdSelector.inputText,
  )) as WebElement[];
  const inputTextFieldToEdit: WebElement =
    getAllInputElements[indexOfInputField];
  await inputTextFieldToEdit.clear();
  await inputTextFieldToEdit.fill(inputValue);
}

async function navigateToEditNetwork(driver: Driver): Promise<void> {
  await driver.clickElement(testIdSelector.accountOptionsMenuButton);
  await driver.clickElement(selectors.settingsOption);
  await driver.clickElement(selectors.networkOption);
}
describe('Update Network:', function (this: Suite) {
  it('default network should not be edited', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test?.fullTitle(),
      },

      async ({ driver }: { driver: Driver }) => {
        await unlockWallet(driver);
        await navigateToEditNetwork(driver);
        await driver.clickElement(selectors.ethereumNetwork);
        // Validate the Delete button is disabled
        const deleteButtonDisabled = await driver.isElementPresentAndVisible(
          selectors.deleteButton,
        );
        assert.equal(deleteButtonDisabled, false, 'Delete button is enabled');
        // Validate the Cancel button is disabled
        const cancelButtonDisabled = await driver.isElementPresentAndVisible(
          selectors.cancelButton,
        );
        assert.equal(cancelButtonDisabled, false, 'Cancel button is enabled');
        // Validate the Save button is disabled
        const saveButtonDisabled = await driver.isElementPresentAndVisible(
          selectors.saveButton,
        );
        assert.equal(saveButtonDisabled, false, 'Save button is enabled');
      },
    );
  });

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
      },
    );
  });

  it('error message for invalid rpc url format', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test?.fullTitle(),
      },

      async ({ driver }: { driver: Driver }) => {
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
        const saveButtonDisabled = await saveButtonEnable.isEnabled();
        assert.equal(saveButtonDisabled, false, 'Save button is enabled');
      },
    );
  });

  it('information symbol “i” appears for chain id', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test?.fullTitle(),
      },

      async ({ driver }: { driver: Driver }) => {
        await unlockWallet(driver);
        await navigateToEditNetwork(driver);

        const informationSymbolAppears = await driver.isElementPresent(
          testIdSelector.informationSymbol,
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
