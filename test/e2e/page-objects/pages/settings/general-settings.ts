import { Driver } from '../../../webdriver/driver';

class GeneralSettings {
  private readonly driver: Driver;

  // Page elements
  private readonly generalSettingsPageTitle = {
    text: 'General',
    tag: 'h4',
  };

  private readonly selectLanguageField = '[data-testid="locale-select"]';
  private readonly loadingOverlaySpinner = '.loading-overlay__spinner';

  // Identicon selectors
  private readonly jazziconActiveSelector =
    '[data-testid="jazz_icon"] .settings-page__content-item__identicon__item__icon--active';
  private readonly jazziconsTextSelector = {
    tag: 'h6',
    text: 'Jazzicons',
  };
  private readonly blockiesTextSelector = {
    tag: 'h6',
    text: 'Blockies',
  };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  /**
   * Check if the General Settings page is loaded
   */
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

  /**
   * Verify that both Jazzicon and Blockies options are visible and Jazzicon is active
   */
  async verifyIdenticonOptions(): Promise<void> {
    console.log('Verifying identicon options');

    // Check if Jazzicon is active
    await this.driver.findElement(this.jazziconActiveSelector);

    // Check if both text elements are visible
    await this.driver.waitForSelector(this.jazziconsTextSelector);
    await this.driver.waitForSelector(this.blockiesTextSelector);
  }
}

export default GeneralSettings;
