import {
  GENERAL_ROUTE,
  ADVANCED_ROUTE,
  CONTACT_LIST_ROUTE,
  SECURITY_ROUTE,
  ALERTS_ROUTE,
  NETWORKS_ROUTE,
  ABOUT_US_ROUTE,
} from '../../../../ui/helpers/constants/routes';
import { BasePage } from './base-page';

export class GeneralTab extends BasePage {}

export class AdvancedTab extends BasePage {
  private smartTransactionsToggle =
    '[data-testid="advanced-setting-enable-smart-transactions"] label';

  async toggleSmartTransactions(): Promise<void> {
    await this.driver.scrollToAndClickElement(this.smartTransactionsToggle);
  }
}

export class ContactsTab extends BasePage {}

export class SecurityTab extends BasePage {}

export class AlertsTab extends BasePage {}

export class NetworksTab extends BasePage {}

export class AboutUsTab extends BasePage {}

export class SettingsPage extends BasePage {
  private generalTab = `[data-testid="${GENERAL_ROUTE}"]`;

  private advancedTab = `[data-testid="${ADVANCED_ROUTE}"]`;

  private contactsTab = `[data-testid="${CONTACT_LIST_ROUTE}"]`;

  private securityTab = `[data-testid="${SECURITY_ROUTE}"]`;

  private alertsTab = `[data-testid="${ALERTS_ROUTE}"]`;

  private networksTab = `[data-testid="${NETWORKS_ROUTE}"]`;

  private aboutUsTab = `[data-testid="${ABOUT_US_ROUTE}"]`;

  private closeSettingsButton = '[data-testid="close-settings"]';

  async showGeneralTab(): Promise<GeneralTab> {
    await this.driver.clickElement(this.generalTab);
    return new GeneralTab(this.driver);
  }

  async showAdvancedTab(): Promise<AdvancedTab> {
    await this.driver.clickElement(this.advancedTab);
    return new AdvancedTab(this.driver);
  }

  async showContactsTab(): Promise<ContactsTab> {
    await this.driver.clickElement(this.contactsTab);
    return new ContactsTab(this.driver);
  }

  async showSecurityTab(): Promise<SecurityTab> {
    await this.driver.clickElement(this.securityTab);
    return new SecurityTab(this.driver);
  }

  async showAlertsTab(): Promise<AlertsTab> {
    await this.driver.clickElement(this.alertsTab);
    return new AlertsTab(this.driver);
  }

  async showNetworksTab(): Promise<NetworksTab> {
    await this.driver.clickElement(this.networksTab);
    return new NetworksTab(this.driver);
  }

  async showAboutUsTab(): Promise<AboutUsTab> {
    await this.driver.clickElement(this.aboutUsTab);
    return new AboutUsTab(this.driver);
  }

  async closeSettings(): Promise<void> {
    await this.driver.clickElement(this.closeSettingsButton);
  }
}
