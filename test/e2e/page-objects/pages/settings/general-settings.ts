import { Driver } from '../../../webdriver/driver';

class GeneralSettings {
  private readonly driver: Driver;

  private readonly blockiesAccountIdenticon = {
    tag: 'h6',
    text: 'Blockies',
  };

  private readonly generalSettingsPageTitle = {
    text: 'General',
    tag: 'h4',
  };

  private readonly jazziconsAccountIdenticon = {
    tag: 'h6',
    text: 'Jazzicons',
  };

  private readonly loadingOverlaySpinner = '.loading-overlay__spinner';

  private readonly selectLanguageField = '[data-testid="locale-select"]';

  private readonly blockiesIcon = '[data-testid="blockie_icon"]';

  private readonly jazziconIcon = '[data-testid="jazz_icon"]';

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
   * Verify that both Jazzicon and Blockies options are visible
   */
  async check_identiconOptionsAreDisplayed(): Promise<void> {
    console.log(
      'Checking if identicon options are displayed on general settings page',
    );
    await this.driver.waitForSelector(this.jazziconsAccountIdenticon);
    await this.driver.waitForSelector(this.blockiesAccountIdenticon);
  }

  /**
   * Check if the specified identicon type is active
   *
   * @param identicon - The type of identicon to check ('jazzicon' or 'blockies')
   */
  async check_identiconIsActive(
    identicon: 'jazzicon' | 'blockies',
  ): Promise<void> {
    console.log(
      `Checking if ${identicon} identicon is active on general settings page`,
    );
    const iconSelector =
      identicon === 'jazzicon' ? this.jazziconIcon : this.blockiesIcon;
    const activeSelector = `${iconSelector} .settings-page__content-item__identicon__item__icon--active`;
    await this.driver.waitForSelector(activeSelector);
  }

  async check_noLoadingOverlaySpinner(): Promise<void> {
    await this.driver.assertElementNotPresent(this.loadingOverlaySpinner);
  }
}

export default GeneralSettings;
