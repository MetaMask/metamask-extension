import { Driver } from '../../../webdriver/driver';
import {
  ACCOUNT_IDENTICON_ROUTE,
  ASSETS_ROUTE,
  LANGUAGE_ROUTE,
  PREFERENCES_AND_DISPLAY_ROUTE,
} from '../../../../../ui/helpers/constants/routes';

class PreferencesAndDisplaySettings {
  private readonly driver: Driver;

  private readonly preferencesAndDisplayLanguageLink =
    'a[href="#/settings/preferences-and-display/language"]';

  private readonly hideTokensWithoutBalanceToggle =
    '[data-testid="toggle-zero-balance-button"]';

  private readonly loadingOverlay = '.loading-overlay';

  private readonly loadingOverlaySpinner = '.loading-overlay__spinner';

  private readonly localeSelectList = '[data-testid="locale-select-list"]';

  private readonly identicons = {
    maskicon: '[data-testid="maskicon_icon"]',
    blockies: '[data-testid="blockie_icon"]',
    jazzicon: '[data-testid="jazz_icon"]',
  };

  private readonly toggleNativeTokenAsMainBalance =
    '[data-testid="show-native-token-as-main-balance"]';

  private readonly showDefaultAddressToggle =
    '[data-testid="show-default-address-toggle"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkPageIsLoaded(): Promise<void> {
    try {
      await this.navigateToRoute(PREFERENCES_AND_DISPLAY_ROUTE);
      await this.checkNoLoadingOverlaySpinner();
      await this.driver.waitForMultipleSelectors([
        this.preferencesAndDisplayLanguageLink,
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

  async changeLanguage(languageToSelect: string): Promise<void> {
    console.log(
      'Changing language to ',
      languageToSelect,
      'on preferences and display settings page',
    );
    await this.navigateToRoute(LANGUAGE_ROUTE);
    await this.checkNoLoadingOverlaySpinner();
    await this.driver.waitForSelector(this.localeSelectList);
    await this.driver.clickElement({ text: languageToSelect });
    await this.checkNoLoadingOverlaySpinner();
  }

  async checkIdenticonOptionsAreDisplayed(): Promise<void> {
    console.log(
      'Checking if identicon options are displayed on preferences and display settings page',
    );
    await this.navigateToRoute(ACCOUNT_IDENTICON_ROUTE);
    await this.driver.waitForSelector('[data-testid="account-identicon-list"]');
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
    await this.navigateToRoute(ACCOUNT_IDENTICON_ROUTE);
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
    await this.navigateToRoute(ASSETS_ROUTE);
    await this.driver.clickElement(this.hideTokensWithoutBalanceToggle);
  }

  async toggleShowNativeTokenAsMainBalance(): Promise<void> {
    await this.navigateToRoute(ASSETS_ROUTE);
    await this.driver.clickElement(this.toggleNativeTokenAsMainBalance);
  }

  async toggleShowDefaultAddress(): Promise<void> {
    await this.navigateToRoute(PREFERENCES_AND_DISPLAY_ROUTE);
    await this.driver.clickElement(this.showDefaultAddressToggle);
  }

  async checkShowDefaultAddressSectionIsDisplayed(): Promise<void> {
    await this.navigateToRoute(PREFERENCES_AND_DISPLAY_ROUTE);
    await this.driver.waitForSelector(this.showDefaultAddressToggle);
  }

  async checkShowDefaultAddressSectionIsNotDisplayed(): Promise<void> {
    await this.navigateToRoute(PREFERENCES_AND_DISPLAY_ROUTE);
    await this.driver.assertElementNotPresent(this.showDefaultAddressToggle);
  }

  private async navigateToRoute(route: string): Promise<void> {
    await this.driver.executeScript(
      `window.location.hash = ${JSON.stringify(route)};`,
    );
  }
}

export default PreferencesAndDisplaySettings;
