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

  private readonly identicons = {
    maskicon: '[data-testid="mask_icon"]',
    blockies: '[data-testid="blockie_icon"]',
    jazzicon: '[data-testid="jazz_icon"]',
  };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  /**
   * Check if the General Settings page is loaded
   */
  async checkPageIsLoaded(): Promise<void> {
    try {
      await this.checkNoLoadingOverlaySpinner();
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
    await this.checkNoLoadingOverlaySpinner();
    // We use send keys, because clicking the dropdown causes flakiness, if it's not auto closed after selecting the language
    const dropdown = await this.driver.findElement(this.selectLanguageField);
    await dropdown.sendKeys(languageToSelect);
    await this.checkNoLoadingOverlaySpinner();
  }

  /**
   * Verify that both Jazzicon and Blockies options are visible
   */
  async checkIdenticonOptionsAreDisplayed(): Promise<void> {
    console.log(
      'Checking if identicon options are displayed on general settings page',
    );
    await this.driver.waitForSelector(this.jazziconsAccountIdenticon);
    await this.driver.waitForSelector(this.blockiesAccountIdenticon);
  }

  /**
   * Check if the specified identicon type is active
   *
   * @param identicon - The type of identicon to check ('maskicon' or 'jazzicon' or 'blockies')
   */
  async checkIdenticonIsActive(
    identicon: 'maskicon' | 'jazzicon' | 'blockies',
  ): Promise<void> {
    console.log(
      `Checking if ${identicon} identicon is active on general settings page`,
    );

    const activeSelector = this.identicons[identicon];
    await this.driver.waitForSelector(activeSelector);
  }

  async checkNoLoadingOverlaySpinner(): Promise<void> {
    await this.driver.assertElementNotPresent(this.loadingOverlaySpinner);
  }
}

export default GeneralSettings;
