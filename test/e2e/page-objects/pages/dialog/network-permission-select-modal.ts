import { strict as assert } from 'assert';
import { By } from 'selenium-webdriver';
import { Driver } from '../../../webdriver/driver';

class NetworkPermissionSelectModal {
  driver: Driver;

  private readonly checkBox = 'input[type="checkbox"]';

  private readonly confirmEditButton = {
    text: 'Update',
    tag: 'button',
  };

  private readonly editNetworksModalTitle = {
    text: 'Edit networks',
    tag: 'h4',
  };

  private readonly networkListItems = '.multichain-network-list-item';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async check_pageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([
        this.editNetworksModalTitle,
        this.networkListItems,
      ]);
    } catch (e) {
      console.log(
        'Timeout while waiting for network selection modal to be loaded',
        e,
      );
      throw e;
    }
    console.log('Network selection modal is loaded');
  }

  async clickConfirmEditButton(): Promise<void> {
    console.log('Clicking confirm edit button');
    await this.driver.clickElementAndWaitToDisappear(this.confirmEditButton);
  }

  /**
   * Update Multichain network edit form so that only matching networks are selected.
   *
   * @param selectedNetworkNames - Array of network names that should be selected
   */
  async updateNetworkStatus(selectedNetworkNames: string[]): Promise<void> {
    console.log('Updating network selection in edit network permission modal');
    const networkItems = await this.driver.findElements(this.networkListItems);

    for (const networkItem of networkItems) {
      const networkNameDiv = await networkItem.findElement(
        By.css('div[data-testid]'),
      );
      const networkName = await networkNameDiv.getAttribute('data-testid');
      const checkbox = await networkItem.findElement(By.css(this.checkBox));
      const isChecked = await checkbox.isSelected();
      const isSelectedNetwork = selectedNetworkNames.some(
        (selectedNetworkName) => networkName.includes(selectedNetworkName),
      );

      const shouldBeChecked = !isChecked && isSelectedNetwork;
      const shouldNotBeChecked = isChecked && !isSelectedNetwork;
      if (shouldBeChecked || shouldNotBeChecked) {
        await checkbox.click();
      }
    }
  }

  /**
   * Validates that the specified networks are selected and all others are unselected
   *
   * @param expectedSelectedNetworks - Array of network names that should be selected
   */
  async check_networkStatus(expectedSelectedNetworks: string[]): Promise<void> {
    console.log(
      'Validating network selection in edit network permission modal',
    );
    const networkItems = await this.driver.findElements(this.networkListItems);

    for (const networkItem of networkItems) {
      const networkNameDiv = await networkItem.findElement(
        By.css('div[data-testid]'),
      );
      const networkName = await networkNameDiv.getAttribute('data-testid');
      const checkbox = await networkItem.findElement(By.css(this.checkBox));
      const isChecked = await checkbox.isSelected();
      if (expectedSelectedNetworks.includes(networkName)) {
        assert.strictEqual(
          isChecked,
          true,
          `Expected ${networkName} to be selected.`,
        );
      } else {
        assert.strictEqual(
          isChecked,
          false,
          `Expected ${networkName} to NOT be selected.`,
        );
      }
    }
  }
}

export default NetworkPermissionSelectModal;
