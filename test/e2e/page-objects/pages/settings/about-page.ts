import { Driver } from '../../../webdriver/driver';

class AboutPage {
  private readonly driver: Driver;

  private readonly aboutPageTitle = {
    text: 'About',
    tag: 'h4',
  };

  private readonly metaMaskHeaderText = {
    text: 'MetaMask is designed and built around the world.',
    tag: 'div',
  };

  private readonly metaMaskVersionHeader = {
    text: 'MetaMask Version',
    css: '.info-tab__version-header',
  };

  private readonly metaMaskVersionNumber = {
    css: '.info-tab__version-number',
  };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  async check_pageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([
        this.aboutPageTitle,
        this.metaMaskHeaderText,
        this.metaMaskVersionHeader,
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
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  async check_metaMaskVersionNumber(version: string): Promise<void> {
    console.log('Checking displayed MetaMask version is ', version);
    await this.driver.waitForSelector({
      css: this.metaMaskVersionNumber.css,
      text: version,
    });
  }
}

export default AboutPage;
