import { Driver } from '../../../webdriver/driver';

class GeneralSettings {
  private readonly driver: Driver;

  private readonly blockiesAccountIdenticon = {
    tag: 'h6',
    text: 'Blockies',
  };

  private readonly blockiesIdenticonIcon =
    '[data-testid="blockie_icon"] .settings-page__content-item__identicon__item__icon--active';

  private readonly generalSettingsPageTitle = {
    text: 'General',
    tag: 'h4',
  };

  private readonly jazziconIdenticonIcon =
    '[data-testid="jazz_icon"] .settings-page__content-item__identicon__item__icon--active';

  private readonly jazziconsAccountIdenticon = {
    tag: 'h6',
    text: 'Jazzicons',
  };

  private readonly loadingOverlaySpinner = '.loading-overlay__spinner';

  private readonly selectLanguageField = '[data-testid="locale-select"]';

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

  /**
   * Verify that both Jazzicon and Blockies options are visible and Jazzicon is active
   */
  async check_identiconOptionsAreDisplayed(): Promise<void> {
    console.log(
      'Checking if identicon options are displayed on general settings page',
    );
    await this.driver.waitForSelector(this.jazziconsAccountIdenticon);
    await this.driver.waitForSelector(this.blockiesAccountIdenticon);
  }

  /**
   * Check if expected identicon icon is active
   *
   * @param isJazzicon - Whether the expected active identicon is jazzicon
   */
  async check_identiconIsActive(isJazzicon: boolean = true): Promise<void> {
    const type = isJazzicon ? 'jazzicon' : 'blockies';
    console.log(
      `Checking if ${type} identicon is active on general settings page`,
    );
    const selector = isJazzicon
      ? this.jazziconIdenticonIcon
      : this.blockiesIdenticonIcon;
    await this.driver.waitForSelector(selector);
  }

  async check_noLoadingOverlaySpinner(): Promise<void> {
    await this.driver.assertElementNotPresent(this.loadingOverlaySpinner);
  }
}

export default GeneralSettings;
