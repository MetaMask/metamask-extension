import { Driver } from '../../../webdriver/driver';
import { quoteXPathText } from '../../../../helpers/quoteXPathText';

/**
 * Multichain per-network address rows: copy, QR, and explorer links.
 *
 * Screen: `#/multichain-account-address-list`.
 * Owns: address rows by network, copy feedback, opening QR for a row, view on
 * explorer, and back navigation.
 * Boundaries: the address list. The QR / single-address overlay is
 * `AccountAddressModal`; account details that open this list are
 * `AccountDetailsPage`.
 * Related: `AccountAddressModal`, `AccountDetailsPage`.
 *
 * @see ui/pages/multichain-accounts/multichain-account-address-list-page/multichain-account-address-list-page.tsx
 */
class AccountAddressListPage {
  private readonly accountAddress =
    '[data-testid="multichain-address-row-address"]';

  private readonly addressCopiedMessage = {
    css: '[data-testid="multichain-address-row-address"]',
    text: 'Address copied',
  };

  private readonly backButton =
    '[data-testid="multichain-account-address-list-page-back-button"]';

  private driver: Driver;

  private readonly parentSelector =
    '[data-testid="parent-selector-multichain-account-address-list-page"]';

  private readonly qrButton =
    '[data-testid="multichain-address-row-qr-button"]';

  private readonly shortenedAddress =
    '[data-testid="multichain-address-row-address"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  private addressListRowByNetworkName(networkName: string) {
    return {
      xpath: `//*[@data-testid='multichain-address-row'][.//*[@data-testid='multichain-address-row-network-name' and contains(normalize-space(.), ${quoteXPathText(networkName)})]]`,
    };
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

  async checkNetworkNameisDisplayed(networkName: string): Promise<void> {
    console.log(`Check network "${networkName}" is displayed`);
    await this.driver.waitForSelector({
      text: networkName,
      tag: 'p',
    });
  }

  async checkPageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([
        this.parentSelector,
        this.qrButton,
      ]);
    } catch (e) {
      console.log(
        'Timeout while waiting for address list modal to be loaded',
        e,
      );
      throw e;
    }
    console.log('Address list modal is loaded');
  }

  async clickCopyButton(addressIndex: number = 0): Promise<void> {
    await this.driver.clickElement({
      xpath: `(//*[@data-testid='multichain-address-row-copy-button'])[${
        addressIndex + 1
      }]`,
    });
  }

  async clickCopyButtonForNetwork(networkName: string): Promise<void> {
    console.log(`Click copy button for network "${networkName}"`);
    await this.driver.clickElement({
      xpath: `${this.addressListRowByNetworkName(networkName).xpath}//*[@data-testid='multichain-address-row-copy-button']`,
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
    await this.driver.waitForClipboardContent(expectedAddress);
  }

  async clickQRbutton(addressIndex: number = 0): Promise<void> {
    await this.driver.clickElement({
      xpath: `(//*[@data-testid='multichain-address-row-qr-button'])[${
        addressIndex + 1
      }]`,
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

  async verifyCopyButtonFeedback(): Promise<void> {
    console.log(`Look for "Address copied'!" state change`);
    await this.driver.waitForSelector(this.addressCopiedMessage);
  }
}

export default AccountAddressListPage;
