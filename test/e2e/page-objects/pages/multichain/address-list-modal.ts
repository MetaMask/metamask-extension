
import { Driver } from '../../../webdriver/driver';

class addressListModal {
  private driver: Driver;

  private readonly qrButton =
    '[data-testid="multichain-address-row-qr-button"]';

  private readonly backButton =
    '[data-testid="multichain-account-address-list-page-back-button"]';

  private readonly networkName =
    '[data-testid="multichain-address-row-network-name"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkPageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([
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

  async checkNetworkNameisDisplayed( networkName: string ): Promise<void> {
    console.log(`Check network "${networkName}" is displayed`);
    await this.driver.waitForSelector({
      text: networkName,
      tag: 'p',
    });
  }

  async clickQRbutton(addressIndex: number = 0): Promise<void> {
    const qrButtonsList = await this.driver.findElements(this.qrButton)
    const qrButton = qrButtonsList[addressIndex];
    await qrButton.click();
  }

  async goBack(): Promise<void> {
    await this.driver.clickElement(
      this.backButton,
    );
  }
}

export default addressListModal;
