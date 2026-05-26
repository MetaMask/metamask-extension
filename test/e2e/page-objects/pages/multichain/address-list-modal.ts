import { strict as assert } from 'assert';
import { WebElement } from 'selenium-webdriver';
import { Driver } from '../../../webdriver/driver';

class AddressListModal {
  private driver: Driver;

  private readonly accountAddress =
    '[data-testid="multichain-address-row-address"]';

  private readonly addressRow = '[data-testid="multichain-address-row"]';

  private readonly copyButton =
    '[data-testid="multichain-address-row-copy-button"]';

  private readonly qrButton =
    '[data-testid="multichain-address-row-qr-button"]';

  private readonly backButton =
    '[data-testid="multichain-account-address-list-page-back-button"]';

  private readonly networkName =
    '[data-testid="multichain-address-row-network-name"]';

  private readonly shortenedAddress =
    '[data-testid="multichain-address-row-address"]';

  private readonly addressCopiedMessage = {
    css: '[data-testid="multichain-address-row-address"]',
    text: 'Address copied',
  };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkPageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([this.qrButton]);
    } catch (e) {
      console.log(
        'Timeout while waiting for address list modal to be loaded',
        e,
      );
      throw e;
    }
    console.log('Address list modal is loaded');
  }

  async checkQuickCopyPopoverIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForSelector(this.addressRow);
    } catch (e) {
      console.log(
        'Timeout while waiting for quick-copy address popover to be loaded',
        e,
      );
      throw e;
    }
    console.log('Quick-copy address popover is loaded');
  }

  async checkNetworkNameisDisplayed(networkName: string): Promise<void> {
    console.log(`Check network "${networkName}" is displayed`);
    await this.driver.waitForSelector({
      text: networkName,
      tag: 'p',
    });
  }

  async checkQuickCopyAddressIsDisplayedForNetwork({
    networkName,
    networkAddress,
  }: {
    networkName: string;
    networkAddress: string;
  }): Promise<void> {
    console.log(
      `Check quick-copy ${networkName} address "${networkAddress}" is displayed`,
    );
    const row = await this.findQuickCopyAddressRowByNetworkName(networkName);
    assert.ok((await row.getText()).includes(networkAddress));
  }

  async checkNetworkAddressIsDisplayed(networkAddress: string): Promise<void> {
    console.log(`Check network "${networkAddress}" is displayed`);
    await this.driver.waitForSelector({
      text: networkAddress,
      css: this.shortenedAddress,
    });
  }

  async clickCopyButton(addressIndex: number = 0): Promise<void> {
    const copyButtonsList = await this.driver.findElements(this.copyButton);
    const copyButton = copyButtonsList[addressIndex];
    await copyButton.click();
  }

  async verifyCopyButtonFeedback(): Promise<void> {
    console.log(`Look for "Address copied'!" state change`);
    await this.driver.waitForSelector(this.addressCopiedMessage);
  }

  async clickQRbutton(addressIndex: number = 0): Promise<void> {
    const qrButtonsList = await this.driver.findElements(this.qrButton);
    const qrButton = qrButtonsList[addressIndex];
    await qrButton.click();
  }

  async getTruncatedAccountAddress(addressIndex: number = 0): Promise<string> {
    console.log('Get truncated account address');
    const addressElements = await this.driver.findElements(this.accountAddress);
    if (addressIndex < 0 || addressIndex >= addressElements.length) {
      throw new Error('Invalid account row index');
    }
    const addressElement = addressElements[addressIndex];
    const address = await addressElement.getText();
    return address;
  }

  async goBack(): Promise<void> {
    await this.driver.clickElementAndWaitToDisappear(this.backButton);
  }

  private async findQuickCopyAddressRowByNetworkName(
    networkName: string,
  ): Promise<WebElement> {
    let matchingRow: WebElement | undefined;

    await this.driver.waitUntil(
      async () => {
        const rows = await this.driver.findElements(this.addressRow);
        for (const row of rows) {
          if ((await row.getText()).includes(networkName)) {
            matchingRow = row;
            return true;
          }
        }
        return false;
      },
      { timeout: 10000, interval: 500 },
    );

    if (!matchingRow) {
      throw new Error(
        `Could not find quick-copy address row for network ${networkName}`,
      );
    }

    return matchingRow;
  }
}

export default AddressListModal;
