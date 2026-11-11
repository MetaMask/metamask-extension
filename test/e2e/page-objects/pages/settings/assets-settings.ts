import { Driver } from '../../../webdriver/driver';

/**
 * Settings → Assets: balance display and token/NFT detection toggles.
 *
 * Screen: `#/settings/assets`, reached from `SettingsPage.goToAssetsSettings`.
 * Owns: show native token as main balance, hide tokens without balance, and
 * token/NFT autodetect toggles.
 * Boundaries: the assets tab only. Currency lives on its own sub-page.
 * Related: `SettingsPage`, `flows/settings.flow.ts`.
 *
 * @see ui/pages/settings/assets-tab/assets-tab.tsx
 */
class AssetsSettings {
  private readonly autodetectNftsToggleLabel =
    "label.toggle-button:has([data-testid='use-nft-detection-input'])";

  private readonly autoDetectTokensToggleLabel =
    "label.toggle-button:has([data-testid='autodetect-tokens'])";

  private readonly driver: Driver;

  /**
   * Hidden checkbox; click the wrapping label (same pattern as native-token toggle).
   */
  private readonly hideTokensWithoutBalanceToggleLabel =
    "label.toggle-button:has([data-testid='toggle-zero-balance-button'])";

  private readonly settingsPage = {
    testId: 'parent-selector-settings-page',
  };

  /**
   * Visible toggle: `data-testid="show-native-token-as-main-balance"` is on the
   * hidden input inside ToggleButton; click the wrapping label.
   */
  private readonly showNativeTokenAsMainBalanceToggleLabel = {
    xpath:
      "//label[contains(@class,'toggle-button')][.//*[@data-testid='show-native-token-as-main-balance']]",
  };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkPageIsLoaded(): Promise<void> {
    console.log('Check Assets settings page is loaded');
    await this.driver.waitForMultipleSelectors([
      this.showNativeTokenAsMainBalanceToggleLabel,
      this.settingsPage,
    ]);
  }

  async toggleAutodetectNfts(): Promise<void> {
    console.log('Toggle autodetect NFTs on Assets settings page');
    await this.driver.clickElement(this.autodetectNftsToggleLabel);
  }

  async toggleAutoDetectTokens(): Promise<void> {
    console.log('Toggle auto detect tokens on Assets settings page');
    await this.driver.clickElement(this.autoDetectTokensToggleLabel);
  }

  async toggleHideTokensWithoutBalance(): Promise<void> {
    console.log('Toggle hide tokens without balance on Assets settings page');
    await this.driver.clickElement(this.hideTokensWithoutBalanceToggleLabel);
  }

  async toggleShowNativeTokenAsMainBalance(): Promise<void> {
    console.log(
      'Toggle show native token as main balance on Assets settings page',
    );
    await this.driver.clickElement(
      this.showNativeTokenAsMainBalanceToggleLabel,
    );
  }
}

export default AssetsSettings;
