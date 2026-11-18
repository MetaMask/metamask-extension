import { Driver } from '../../../webdriver/driver';

/**
 * Page shown after unlocking a legacy userHandle passkey.
 *
 * Owns the migration prompt actions. The replacement ceremony belongs to
 * `SetupPasskeyPage` and is coordinated by the passkey migration flow.
 *
 * @see ui/pages/onboarding-flow/passkey-prf-migration/passkey-prf-migration.tsx
 */
class PasskeyPrfMigrationPage {
  private driver: Driver;

  private readonly page =
    '[data-testid="parent-selector-passkey-prf-migration"]';

  private readonly remindMeLaterButton =
    '[data-testid="passkey-migration-remind-me-later-button"]';

  private readonly replaceButton =
    '[data-testid="passkey-migration-replace-button"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkPageIsLoaded(): Promise<void> {
    console.log('Check passkey PRF migration page is loaded');
    await this.driver.waitForSelector(this.page);
    await this.driver.waitForSelector(this.replaceButton);
    await this.driver.waitForSelector(this.remindMeLaterButton);
  }

  async clickRemindMeLater(): Promise<void> {
    console.log('Click Remind me later on the passkey PRF migration page');
    await this.driver.clickElementAndWaitToDisappear(this.remindMeLaterButton);
  }

  async clickReplacePasskey(): Promise<void> {
    console.log('Click Replace passkey on the passkey PRF migration page');
    await this.driver.clickElementAndWaitToDisappear(this.replaceButton);
  }
}

export default PasskeyPrfMigrationPage;
