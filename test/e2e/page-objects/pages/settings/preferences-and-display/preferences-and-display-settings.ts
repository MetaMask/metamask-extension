import { Driver } from '../../../../webdriver/driver';
import {
  ACCOUNT_IDENTICON_ROUTE,
  LANGUAGE_ROUTE,
} from '../../../../../../ui/helpers/constants/routes';

/**
 * Settings → Preferences and display.
 *
 * Screen: `#/settings/preferences-and-display`.
 * Owns: show-default-address toggle and navigation into the language and
 * account identicon sub-pages.
 * Boundaries: not the Settings hub. The language and account identicon
 * sub-pages belong to `LanguageSettings` and `AccountIdenticonSettings`; the
 * assets tab to `AssetsSettings`.
 * Related: `SettingsPage`, `LanguageSettings`, `AccountIdenticonSettings`,
 * `flows/settings.flow.ts`.
 *
 * @see ui/pages/settings/preferences-and-display-tab/preferences-and-display-tab.tsx
 */
class PreferencesAndDisplaySettings {
  private readonly accountIdenticonSubpageLink = `a[href="#${ACCOUNT_IDENTICON_ROUTE}"]`;

  private readonly driver: Driver;

  private readonly languageSubpageLink = `a[href="#${LANGUAGE_ROUTE}"]`;

  private readonly loadingOverlay = '.loading-overlay';

  private readonly loadingOverlaySpinner = '.loading-overlay__spinner';

  private readonly preferencesTabButton =
    '[data-testid="settings-tab-item-preferences-and-display"]';

  private readonly settingsPage = {
    testId: 'parent-selector-settings-page',
  };

  private readonly showDefaultAddressToggle =
    '[data-testid="show-default-address-toggle"]';

  private readonly showDefaultAddressToggleLabel =
    "label.toggle-button:has([data-testid='show-default-address-toggle'])";

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async assertLoadingOverlayNotPresent(): Promise<void> {
    await this.driver.assertElementNotPresent(this.loadingOverlay);
  }

  async checkNoLoadingOverlaySpinner(): Promise<void> {
    await this.driver.assertElementNotPresent(this.loadingOverlaySpinner);
  }

  async checkPageIsLoaded(): Promise<void> {
    try {
      await this.driver.clickElement(this.preferencesTabButton);
      await this.checkNoLoadingOverlaySpinner();
      await this.driver.waitForMultipleSelectors([
        this.languageSubpageLink,
        this.settingsPage,
      ]);
    } catch (e) {
      console.log(
        'Timeout while waiting for Preferences and Display settings page to be loaded',
        e,
      );
      throw e;
    }
    console.log('Preferences and Display settings page is loaded');
  }

  async checkShowDefaultAddressSectionIsDisplayed(): Promise<void> {
    await this.driver.clickElement(this.preferencesTabButton);
    await this.checkNoLoadingOverlaySpinner();
    await this.driver.waitForSelector(this.showDefaultAddressToggle);
  }

  async checkShowDefaultAddressSectionIsNotDisplayed(): Promise<void> {
    await this.driver.clickElement(this.preferencesTabButton);
    await this.checkNoLoadingOverlaySpinner();
    await this.driver.assertElementNotPresent(this.showDefaultAddressToggle);
  }

  async openAccountIdenticonSettings(): Promise<void> {
    console.log('Opening account identicon settings');
    await this.driver.clickElement(this.preferencesTabButton);
    await this.checkNoLoadingOverlaySpinner();
    await this.driver.clickElement(this.accountIdenticonSubpageLink);
  }

  async openLanguageSettings(): Promise<void> {
    console.log('Opening language settings');
    await this.driver.clickElement(this.preferencesTabButton);
    await this.checkNoLoadingOverlaySpinner();
    await this.driver.clickElement(this.languageSubpageLink);
    await this.checkNoLoadingOverlaySpinner();
  }

  async toggleShowDefaultAddress(): Promise<void> {
    await this.driver.clickElement(this.preferencesTabButton);
    await this.checkNoLoadingOverlaySpinner();
    await this.driver.waitForSelector(this.showDefaultAddressToggleLabel);
    await this.driver.clickElement(this.showDefaultAddressToggleLabel);
  }
}

export default PreferencesAndDisplaySettings;
