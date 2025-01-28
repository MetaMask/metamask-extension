import { Driver } from '../../../webdriver/driver';
import HeaderNavbar from '../header-navbar';
import SettingsPage from './settings-page';

class SecurityAndPrivacySettings {
  private readonly driver: Driver;

  private readonly securityAndPrivacySettingsPageTitle = {
    text: 'Security & privacy',
    tag: 'h4',
  };

  private readonly participateInMetaMetricsToggle =
    '[data-testid="participate-in-meta-metrics-toggle"] .toggle-button';

  private readonly dataCollectionForMarketingToggle =
    '[data-testid="data-collection-for-marketing-toggle"] .toggle-button';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async check_pageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForSelector(
        this.securityAndPrivacySettingsPageTitle,
      );
    } catch (e) {
      console.log(
        'Timeout while waiting for Security and Privacy settings page to be loaded',
        e,
      );
      throw e;
    }
    console.log('Security and Privacy settings page is loaded');
  }

  async navigateToPage() {
    const headerNavbar = new HeaderNavbar(this.driver);
    await headerNavbar.openSettingsPage();
    const settingsPage = new SettingsPage(this.driver);
    await settingsPage.check_pageIsLoaded();
    await settingsPage.goToPrivacySettings();
    await this.check_pageIsLoaded();
  }

  async toggleParticipateInMetaMetrics(): Promise<void> {
    console.log(
      'Toggle participate in meta metrics in Security and Privacy settings page',
    );
    await this.driver.clickElement(this.participateInMetaMetricsToggle);
  }

  async toggleDataCollectionForMarketing(): Promise<void> {
    console.log(
      'Toggle data collection for marketing in Security and Privacy settings page',
    );
    await this.driver.clickElement(this.dataCollectionForMarketingToggle);
  }
}

export default SecurityAndPrivacySettings;
