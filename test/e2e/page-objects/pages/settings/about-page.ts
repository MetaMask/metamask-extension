import { Driver } from '../../../webdriver/driver';

class AboutPage {
  private readonly driver: Driver;

  private readonly aboutPageTitle = {
    text: 'About',
    tag: 'h4',
  };

  private readonly metaMaskLogo = '.info-tab__logo';

  private readonly metaMaskVersionNumber = '.info-tab__version-number';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkPageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([
        this.aboutPageTitle,
        this.metaMaskLogo,
        this.metaMaskVersionNumber,
      ]);
    } catch (e) {
      console.log('Timeout while waiting for About page to be loaded', e);
      throw e;
    }
    console.log('About page is loaded');
  }

  /**
   * Check the displayed MetaMask version is the expected version
   *
   * @param version - The expected version
   */
  async checkMetaMaskVersionNumber(version: string): Promise<void> {
    console.log('Checking displayed MetaMask version is ', version);
    await this.driver.waitForSelector({
      css: this.metaMaskVersionNumber,
      text: version,
    });
  }
}

export default AboutPage;
