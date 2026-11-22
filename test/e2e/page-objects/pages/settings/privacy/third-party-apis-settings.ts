import { Driver } from '../../../../webdriver/driver';

/**
 * Settings → Privacy → Third-party APIs.
 *
 * Screen: `#/settings/privacy/third-party-apis`, reached from
 * `PrivacySettings.openThirdPartyApisSettings`.
 * Owns: the network details check and ENS domain resolution toggles.
 * Boundaries: the third-party APIs sub-page only.
 * Related: `PrivacySettings`.
 *
 * @see ui/pages/settings/privacy-tab/third-party-apis-sub-page.tsx
 */
class ThirdPartyApisSettings {
  private readonly driver: Driver;

  private readonly ensDomainResolutionToggle =
    '[data-testid="ipfs-gateway-resolution-container"] .toggle-button';

  private readonly networkDetailsCheckToggle =
    '[data-testid="useSafeChainsListValidation"] .toggle-button';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkPageIsLoaded(): Promise<void> {
    console.log('Check Third-party APIs settings page is loaded');
    await this.driver.waitForSelector(this.networkDetailsCheckToggle);
  }

  async toggleEnsDomainResolution(): Promise<void> {
    console.log('Toggle ENS domain resolution');
    await this.driver.clickElement(this.ensDomainResolutionToggle);
  }

  async toggleNetworkDetailsCheck(): Promise<void> {
    console.log('Toggle network details check');
    await this.driver.clickElement(this.networkDetailsCheckToggle);
  }
}

export default ThirdPartyApisSettings;
