import { Driver } from '../../../../webdriver/driver';

/**
 * Settings → Security and password → Auto-lock.
 *
 * Screen: `#/settings/security-and-password/auto-lock`, reached from
 * `SecurityAndPasswordSettings.openAutoLockSettings`.
 * Owns: the auto-lock timeout options.
 * Boundaries: the auto-lock sub-page only.
 * Related: `SecurityAndPasswordSettings`.
 *
 * @see ui/pages/settings/security-and-password-tab/auto-lock-sub-page.tsx
 */
class AutoLockSettings {
  private readonly autoLockOptionQuarterMinute =
    '[data-testid="auto-lock-option-0.25"]';

  private readonly autoLockOptionsList =
    '[data-testid="auto-lock-options-list"]';

  private readonly driver: Driver;

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkPageIsLoaded(): Promise<void> {
    console.log('Check Auto-lock settings page is loaded');
    await this.driver.waitForSelector(this.autoLockOptionsList);
  }

  async selectQuarterMinuteAutoLockOption(): Promise<void> {
    console.log('Select the 15 seconds auto-lock option');
    await this.driver.clickElement(this.autoLockOptionQuarterMinute);
  }
}

export default AutoLockSettings;
