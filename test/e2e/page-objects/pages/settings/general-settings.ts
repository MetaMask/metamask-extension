import { Driver } from '../../../webdriver/driver';

class GeneralSettings {
  private readonly driver: Driver;

  private readonly generalSettingsPageTitle = {
    text: 'General',
    tag: 'h4',
  };

  private readonly loadingOverlaySpinner = '.loading-overlay__spinner';

  private readonly selectLanguageField = '[data-testid="locale-select"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async check_pageIsLoaded(): Promise<void> {
    try {
      await this.check_noLoadingOverlaySpinner();
      await this.driver.waitForMultipleSelectors([
        this.generalSettingsPageTitle,
        this.selectLanguageField,
      ]);
    } catch (e) {
      console.log(
        'Timeout while waiting for General Settings page to be loaded',
        e,
      );
      throw e;
    }
    console.log('General Settings page is loaded');
  }

  /**
   * Change the language of MM on General Settings page
   *
   * @param languageToSelect - The language to select
   */
  async changeLanguage(languageToSelect: string): Promise<void> {
    console.log(
      'Changing language to ',
      languageToSelect,
      'on general settings page',
    );
    await this.check_noLoadingOverlaySpinner();
    await this.driver.clickElement(this.selectLanguageField);
    await this.driver.clickElement({
      text: languageToSelect,
      tag: 'option',
    });
    await this.check_noLoadingOverlaySpinner();
  }

  async check_noLoadingOverlaySpinner(): Promise<void> {
    await this.driver.assertElementNotPresent(this.loadingOverlaySpinner);
  }
}

export default GeneralSettings;
