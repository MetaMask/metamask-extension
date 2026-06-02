import { strict as assert } from 'assert';
import { By, WebElement } from 'selenium-webdriver';
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

  async checkNetworkAddressIsDisplayed(networkAddress: string): Promise<void> {
    console.log(`Check network "${networkAddress}" is displayed`);
    await this.driver.waitForSelector({
      text: networkAddress,
      css: this.shortenedAddress,
    });
  }

  async checkNetworkAddressIsDisplayedForNetwork({
    networkName,
    networkAddress,
  }: {
    networkName: string;
    networkAddress: string;
  }): Promise<void> {
    console.log(
      `Check ${networkName} address "${networkAddress}" is displayed`,
    );
    const row = await this.findAddressRowByNetworkName(networkName);
    const address = await row.findElement(By.css(this.shortenedAddress));
    assert.strictEqual(await address.getText(), networkAddress);
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

  async clickCopyButton(addressIndex: number = 0): Promise<void> {
    const copyButtonsList = await this.driver.findElements(this.copyButton);
    const copyButton = copyButtonsList[addressIndex];
    await copyButton.click();
  }

  async clickCopyButtonForNetwork(networkName: string): Promise<void> {
    console.log(`Click ${networkName} copy address button`);
    await this.clickAddressRowButtonByNetworkName({
      networkName,
      buttonSelector: this.copyButton,
    });
  }

  async clickCopyButtonForNetworkAndAssertClipboard({
    networkName,
    expectedAddress,
  }: {
    networkName: string;
    expectedAddress: string;
  }): Promise<void> {
    await this.clickCopyButtonForNetwork(networkName);
    assert.strictEqual(
      await this.driver.getClipboardContent(),
      expectedAddress,
    );
  }

  async clickQuickCopyButtonForNetwork({
    networkName,
    expectedAddress,
  }: {
    networkName: string;
    expectedAddress: string;
  }): Promise<void> {
    console.log(`Click quick-copy ${networkName} copy address button`);
    const row = await this.findQuickCopyAddressRowByNetworkName(networkName);
    const copyButton = await row.findElement(
      By.css('[aria-label="Copy address"]'),
    );
    await copyButton.click();
    assert.strictEqual(
      await this.driver.getClipboardContent(),
      expectedAddress,
    );
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

  async clickQRbuttonForNetwork(networkName: string): Promise<void> {
    console.log(`Click ${networkName} QR button`);
    await this.clickAddressRowButtonByNetworkName({
      networkName,
      buttonSelector: this.qrButton,
    });
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

  async checkQrPopupShowsAddress(expected: string): Promise<void> {
    console.log(`Verify QR popup copies full Tron address ${expected}`);
    const copyButton = await this.driver.findElement({
      testId: 'address-copy-button-text',
    });
    assert.strictEqual(
      await copyButton.getAttribute('data-clipboard-text'),
      expected,
    );
  }

  async checkViewOnTronscanButton(): Promise<void> {
    console.log('Verify "View on Tronscan" button is shown in QR popup');
    await this.driver.waitForSelector({
      tag: 'button',
      text: 'View on Tronscan',
    });
  }

  async clickQrCopyAddressLink(expectedAddress: string): Promise<void> {
    console.log('Click copy address link in QR popup');
    await this.driver.clickElement({
      testId: 'address-copy-button-text',
    });
    assert.strictEqual(
      await this.driver.getClipboardContent(),
      expectedAddress,
    );
  }

  private async findAddressRowByNetworkName(
    networkName: string,
  ): Promise<WebElement> {
    let matchingRow: WebElement | undefined;

    await this.driver.waitUntil(
      async () => {
        const rows = await this.driver.findElements(this.addressRow);
        for (const row of rows) {
          const networkNameElement = await row.findElement(
            By.css(this.networkName),
          );
          if ((await networkNameElement.getText()) === networkName) {
            matchingRow = row;
            return true;
          }
        }

        return false;
      },
      { timeout: 10000, interval: 500 },
    );

    if (!matchingRow) {
      throw new Error(`Could not find address row for network ${networkName}`);
    }

    return matchingRow;
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

  private async clickAddressRowButtonByNetworkName({
    networkName,
    buttonSelector,
  }: {
    networkName: string;
    buttonSelector: string;
  }): Promise<void> {
    const row = await this.findAddressRowByNetworkName(networkName);
    const button = await row.findElement(By.css(buttonSelector));
    await this.driver.scrollToElement(button);
    await button.click();
  }
}

export default AddressListModal;
