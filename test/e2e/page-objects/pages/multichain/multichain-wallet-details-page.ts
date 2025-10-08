import { Driver } from '../../../webdriver/driver';

class MultichainWalletDetailsPage {
  private readonly driver: Driver;

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkPageIsLoaded(walletName: string): Promise<void> {
    await this.driver.waitForSelector({
      css: 'h4',
      text: `${walletName} / Accounts`,
    });
  }
}

export default MultichainWalletDetailsPage;
