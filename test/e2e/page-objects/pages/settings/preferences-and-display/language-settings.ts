import { Driver } from '../../../../webdriver/driver';

/**
 * Settings → Preferences and display → Language.
 *
 * Screen: `#/settings/preferences-and-display/language`, reached from
 * `PreferencesAndDisplaySettings.openLanguageSettings`.
 * Owns: the locale list and selecting a language.
 * Boundaries: the language sub-page only.
 * Related: `PreferencesAndDisplaySettings`, `flows/settings.flow.ts`
 * `changeLanguage`.
 *
 * @see ui/pages/settings/preferences-and-display-tab/language-sub-page.tsx
 */
class LanguageSettings {
  private readonly driver: Driver;

  private readonly loadingOverlaySpinner = '.loading-overlay__spinner';

  private readonly localeSelectList = '[data-testid="locale-select-list"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkPageIsLoaded(): Promise<void> {
    console.log('Check Language settings page is loaded');
    await this.driver.waitForSelector(this.localeSelectList);
  }

  /**
   * Select a language from the locale list.
   *
   * @param language - The language name as shown in the list, e.g. 'Dansk'.
   */
  async selectLanguage(language: string): Promise<void> {
    console.log(`Selecting language ${language}`);
    await this.driver.clickElement({ text: language });
    await this.driver.assertElementNotPresent(this.loadingOverlaySpinner);
  }
}

export default LanguageSettings;
