import { Driver } from '../../../../webdriver/driver';

/**
 * Settings → Preferences and display → Account identicon.
 *
 * Screen: `#/settings/preferences-and-display/account-identicon`, reached
 * from `PreferencesAndDisplaySettings.openAccountIdenticonSettings`.
 * Owns: the identicon options (maskicon, jazzicon, blockies) and which one is
 * active.
 * Boundaries: the account identicon sub-page only.
 * Related: `PreferencesAndDisplaySettings`.
 *
 * @see ui/pages/settings/preferences-and-display-tab/account-identicon-sub-page.tsx
 */
class AccountIdenticonSettings {
  private readonly accountIdenticonList =
    '[data-testid="account-identicon-list"]';

  private readonly driver: Driver;

  private readonly identicons = {
    maskicon: '[data-testid="account-identicon-option-maskicon"]',
    blockies: '[data-testid="account-identicon-option-blockies"]',
    jazzicon: '[data-testid="account-identicon-option-jazzicon"]',
  };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkIdenticonIsActive(
    identicon: 'maskicon' | 'jazzicon' | 'blockies',
  ): Promise<void> {
    console.log(`Checking if ${identicon} identicon is active`);
    await this.driver.waitForSelector(this.identicons[identicon]);
  }

  async checkIdenticonOptionsAreDisplayed(): Promise<void> {
    console.log('Checking if identicon options are displayed');
    await this.driver.waitForMultipleSelectors([
      this.identicons.blockies,
      this.identicons.jazzicon,
    ]);
  }

  async checkPageIsLoaded(): Promise<void> {
    console.log('Check Account identicon settings page is loaded');
    await this.driver.waitForSelector(this.accountIdenticonList);
  }
}

export default AccountIdenticonSettings;
