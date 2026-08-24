import { Driver } from '../../../webdriver/driver';

/**
 * Settings → About: MetaMask branding and version info.
 *
 * Screen: `#/settings/about-us`, reached from `SettingsPage.goToAboutPage`.
 * Owns: About page load checks and the displayed MetaMask version number.
 * Boundaries: About content only. Does not cover other settings tabs or
 * external links beyond what this page asserts.
 * Related: `SettingsPage` (how tests get here).
 *
 * @see ui/pages/settings/about-tab/about-tab.tsx
 * @see ui/pages/settings/about-tab/about-info.tsx
 */
class AboutPage {
  private readonly driver: Driver;

  private readonly metaMaskLogo = '.info-tab__logo';

  private readonly metaMaskVersionNumber = '.info-tab__version-number';

  constructor(driver: Driver) {
    this.driver = driver;
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

  async checkPageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([
        this.metaMaskLogo,
        this.metaMaskVersionNumber,
      ]);
    } catch (e) {
      console.log('Timeout while waiting for About page to be loaded', e);
      throw e;
    }
    console.log('About page is loaded');
  }
}

export default AboutPage;
