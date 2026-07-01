import assert from 'assert';
import { Driver } from '../../../webdriver/driver';
import { quoteXPathText } from '../../../../helpers/quoteXPathText';

class AddressListModal {
  private driver: Driver;

  private readonly accountAddress =
    '[data-testid="multichain-address-row-address"]';

  private readonly copyButton =
    '[data-testid="multichain-address-row-copy-button"]';

  private readonly qrButton =
    '[data-testid="multichain-address-row-qr-button"]';

  private readonly backButton =
    '[data-testid="multichain-account-address-list-page-back-button"]';

  private readonly shortenedAddress =
    '[data-testid="multichain-address-row-address"]';

  private readonly addressRowsList =
    '[data-testid="multichain-address-rows-list"]';

  private readonly addressRow = '[data-testid="multichain-address-row"]';

  private readonly qrModalAddress = '[data-testid="account-address"]';

  private readonly qrModalCopyButton =
    '[data-testid="address-qr-code-modal-copy-button"]';

  private readonly viewOnExplorerButton =
    '[data-testid="view-address-on-etherscan"]';

  private readonly addressCopiedMessage = {
    css: '[data-testid="multichain-address-row-address"]',
    text: 'Address copied',
  };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  private addressListRowByNetworkName(networkName: string) {
    return {
      xpath: `//*[@data-testid='multichain-address-row'][.//*[@data-testid='multichain-address-row-network-name' and contains(normalize-space(.), ${quoteXPathText(networkName)})]]`,
    };
  }

  private quickCopyRowByNetworkName(networkName: string) {
    return {
      xpath: `//*[@data-testid='multichain-address-row'][contains(normalize-space(.), ${quoteXPathText(networkName)}) and not(.//*[@data-testid='multichain-address-row-network-name'])]`,
    };
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
      await this.driver.waitForMultipleSelectors([
        this.addressRowsList,
        this.addressRow,
      ]);
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
      `Check "${networkAddress}" is displayed for network "${networkName}"`,
    );
    const row = await this.driver.findElement(
      this.addressListRowByNetworkName(networkName),
    );
    await this.driver.findNestedElement(row, {
      css: this.shortenedAddress,
      text: networkAddress,
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
      `Check quick-copy popover shows "${networkAddress}" for "${networkName}"`,
    );
    const row = await this.driver.findElement(
      this.quickCopyRowByNetworkName(networkName),
    );
    const rowText = await row.getText();
    if (!rowText.includes(networkAddress)) {
      throw new Error(
        `Expected quick-copy row for "${networkName}" to include "${networkAddress}" but got "${rowText}"`,
      );
    }
  }

  async clickCopyButtonForNetwork(networkName: string): Promise<void> {
    console.log(`Click copy button for network "${networkName}"`);
    const row = await this.driver.findElement(
      this.addressListRowByNetworkName(networkName),
    );
    const copyButton = await this.driver.findNestedElement(
      row,
      this.copyButton,
    );
    await copyButton.click();
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
    console.log(`Click quick-copy row for network "${networkName}"`);
    const row = await this.driver.findElement(
      this.quickCopyRowByNetworkName(networkName),
    );
    await row.click();
    assert.strictEqual(
      await this.driver.getClipboardContent(),
      expectedAddress,
    );
  }

  async clickQRbuttonForNetwork(networkName: string): Promise<void> {
    console.log(`Click QR button for network "${networkName}"`);
    const row = await this.driver.findElement(
      this.addressListRowByNetworkName(networkName),
    );
    const qrButton = await this.driver.findNestedElement(row, this.qrButton);
    await qrButton.click();
  }

  async checkQrPopupShowsAddress(expectedAddress: string): Promise<void> {
    console.log(`Check QR popup shows address "${expectedAddress}"`);
    await this.driver.waitForSelector(this.qrModalAddress);
    const addressElement = await this.driver.findElement(this.qrModalAddress);
    const displayedAddress = (await addressElement.getText()).replace(
      /\s+/gu,
      '',
    );
    if (displayedAddress !== expectedAddress) {
      throw new Error(
        `Expected QR popup address "${expectedAddress}" but got "${displayedAddress}"`,
      );
    }
  }

  async checkViewOnTronscanButton(): Promise<void> {
    console.log('Verify View on Tronscan button is present');
    await this.driver.waitForSelector({
      css: this.viewOnExplorerButton,
      text: 'View on Tronscan',
    });
  }

  async clickQrCopyAddressLink(expectedAddress: string): Promise<void> {
    console.log('Click copy address button in QR popup');
    await this.driver.clickElement(this.qrModalCopyButton);
    assert.strictEqual(
      await this.driver.getClipboardContent(),
      expectedAddress,
    );
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
}

export default AddressListModal;
