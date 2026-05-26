import { Driver } from '../../../webdriver/driver';
import {
  ACCOUNT_IDENTICON_ROUTE,
  LANGUAGE_ROUTE,
} from '../../../../../ui/helpers/constants/routes';

class PreferencesAndDisplaySettings {
  private readonly driver: Driver;

  private readonly preferencesTabButton =
    '[data-testid="settings-v2-tab-item-preferences-and-display"]';

  private readonly assetsTabButton =
    '[data-testid="settings-v2-tab-item-assets"]';

  private readonly languageSubpageLink = `a[href="#${LANGUAGE_ROUTE}"]`;

  private readonly accountIdenticonSubpageLink = `a[href="#${ACCOUNT_IDENTICON_ROUTE}"]`;

  /**
   * Hidden checkbox; click the wrapping label (same pattern as native-token toggle).
   */
  private readonly hideTokensWithoutBalanceToggleLabel =
    "label.toggle-button:has([data-testid='toggle-zero-balance-button'])";

  private readonly loadingOverlay = '.loading-overlay';

  private readonly loadingOverlaySpinner = '.loading-overlay__spinner';

  private readonly localeSelectList = '[data-testid="locale-select-list"]';

  private readonly accountIdenticonList =
    '[data-testid="account-identicon-list"]';

  private readonly identicons = {
    maskicon: '[data-testid="account-identicon-option-maskicon"]',
    blockies: '[data-testid="account-identicon-option-blockies"]',
    jazzicon: '[data-testid="account-identicon-option-jazzicon"]',
  };

  /**
   * Visible toggle: `data-testid="show-native-token-as-main-balance"` is on the
   * hidden input inside ToggleButton; click the wrapping label.
   */
  private readonly showNativeTokenAsMainBalanceToggleLabel =
    "label.toggle-button:has([data-testid='show-native-token-as-main-balance'])";

  private readonly showDefaultAddressToggle =
    '[data-testid="show-default-address-toggle"]';

  private readonly showDefaultAddressToggleLabel =
    "label.toggle-button:has([data-testid='show-default-address-toggle'])";

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkPageIsLoaded(): Promise<void> {
    try {
      await this.driver.clickElement(this.preferencesTabButton);
      await this.checkNoLoadingOverlaySpinner();
      await this.driver.waitForMultipleSelectors([this.languageSubpageLink]);
    } catch (e) {
      console.log(
        'Timeout while waiting for Preferences and Display settings page to be loaded',
        e,
      );
      throw e;
    }
    console.log('Preferences and Display settings page is loaded');
  }

  async checkAssetsPageIsLoaded(): Promise<void> {
    try {
      await this.driver.clickElement(this.assetsTabButton);
      await this.driver.waitForMultipleSelectors([
        this.showNativeTokenAsMainBalanceToggleLabel,
      ]);
    } catch (e) {
      console.log(
        'Timeout while waiting for Assets settings page to be loaded',
        e,
      );
      throw e;
    }
    console.log('Assets settings page is loaded');
  }

  async changeLanguage(languageToSelect: string): Promise<void> {
    console.log(
      'Changing language to ',
      languageToSelect,
      'on preferences and display settings page',
    );
    await this.driver.clickElement(this.preferencesTabButton);
    await this.checkNoLoadingOverlaySpinner();
    await this.driver.clickElement(this.languageSubpageLink);
    await this.checkNoLoadingOverlaySpinner();
    await this.driver.waitForSelector(this.localeSelectList);
    await this.driver.clickElement({ text: languageToSelect });
    await this.checkNoLoadingOverlaySpinner();
  }

  async checkIdenticonOptionsAreDisplayed(): Promise<void> {
    console.log(
      'Checking if identicon options are displayed on preferences and display settings page',
    );
    await this.driver.clickElement(this.preferencesTabButton);
    await this.checkNoLoadingOverlaySpinner();
    await this.driver.clickElement(this.accountIdenticonSubpageLink);
    await this.driver.waitForSelector(this.accountIdenticonList);
    await this.driver.waitForSelector(
      '[data-testid="account-identicon-option-blockies"]',
    );
    await this.driver.waitForSelector(
      '[data-testid="account-identicon-option-jazzicon"]',
    );
  }

  async checkIdenticonIsActive(
    identicon: 'maskicon' | 'jazzicon' | 'blockies',
  ): Promise<void> {
    console.log(
      `Checking if ${identicon} identicon is active on preferences and display settings page`,
    );
    await this.driver.clickElement(this.preferencesTabButton);
    await this.checkNoLoadingOverlaySpinner();
    await this.driver.clickElement(this.accountIdenticonSubpageLink);
    await this.driver.waitForSelector(this.accountIdenticonList);
    const activeSelector = this.identicons[identicon];
    await this.driver.waitForSelector(activeSelector);
  }

  async assertLoadingOverlayNotPresent(): Promise<void> {
    await this.driver.assertElementNotPresent(this.loadingOverlay);
  }

  async checkNoLoadingOverlaySpinner(): Promise<void> {
    await this.driver.assertElementNotPresent(this.loadingOverlaySpinner);
  }

  async toggleHideTokensWithoutBalance(): Promise<void> {
    await this.checkAssetsPageIsLoaded();
    await this.driver.clickElement(this.hideTokensWithoutBalanceToggleLabel);
  }

  async toggleShowNativeTokenAsMainBalance(): Promise<void> {
    await this.checkAssetsPageIsLoaded();
    await this.driver.clickElement(
      this.showNativeTokenAsMainBalanceToggleLabel,
    );
  }

  async toggleShowDefaultAddress(): Promise<void> {
    await this.driver.clickElement(this.preferencesTabButton);
    await this.checkNoLoadingOverlaySpinner();
    await this.driver.waitForSelector(this.showDefaultAddressToggleLabel);
    await this.driver.clickElement(this.showDefaultAddressToggleLabel);
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
}

export default PreferencesAndDisplaySettings;
