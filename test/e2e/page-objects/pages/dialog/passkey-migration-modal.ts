import { Driver } from '../../../webdriver/driver';

/**
 * Prompt shown after unlocking a legacy userHandle passkey.
 *
 * Screen: modal over the unlock page once passkey unlock succeeds.
 * Owns: the replace and remind-me-later actions.
 * Boundaries: does not run the replacement ceremony. That belongs to
 * `SetupPasskeyPage` inside the replacement modal.
 * Related: `SetupPasskeyPage`, `HomePage`.
 *
 * @see ui/components/app/passkey-migration-modal/passkey-migration-modal.tsx
 */
class PasskeyMigrationModal {
  private driver: Driver;

  private readonly modal = '[data-testid="passkey-migration-modal"]';

  private readonly remindMeLaterButton =
    '[data-testid="passkey-migration-modal-remind-me-later-button"]';

  private readonly replaceButton =
    '[data-testid="passkey-migration-modal-replace-button"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkPageIsLoaded(): Promise<void> {
    console.log('Check passkey migration modal is loaded');
    await this.driver.waitForSelector(this.modal);
    await this.driver.waitForSelector(this.replaceButton);
    await this.driver.waitForSelector(this.remindMeLaterButton);
  }

  async clickRemindMeLater(): Promise<void> {
    console.log('Click Remind me later on the passkey migration modal');
    await this.driver.clickElementAndWaitToDisappear(this.remindMeLaterButton);
  }

  async clickReplacePasskey(): Promise<void> {
    console.log('Click Replace passkey on the passkey migration modal');
    await this.driver.clickElementAndWaitToDisappear(this.replaceButton);
  }
}

export default PasskeyMigrationModal;
