import { Driver } from '../../../../webdriver/driver';

/**
 * Settings → Security and password → Turn off passkey.
 *
 * Screen: `#/settings/security-and-password/turn-off-passkey`, reached from
 * `SecurityAndPasswordSettings.clickPasskeyToggle` when a passkey is set up.
 * Owns: the password check that turns the passkey off.
 * Boundaries: the turn-off sub-page only.
 * Related: `SecurityAndPasswordSettings`, `RegisterPasskeySettings`.
 *
 * @see ui/pages/settings/security-and-password-tab/passkey-turn-off-sub-page.tsx
 */
class TurnOffPasskeySettings {
  private readonly continueButton =
    '[data-testid="turn-off-passkey-verify-continue-button"]';

  private readonly driver: Driver;

  private readonly passwordInput =
    '[data-testid="turn-off-passkey-password-input"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkPageIsLoaded(): Promise<void> {
    console.log('Check Turn off passkey settings page is loaded');
    await this.driver.waitForSelector(this.passwordInput);
  }

  async enterPasswordAndContinue(password: string): Promise<void> {
    console.log('Enter password and continue for passkey turn off');
    await this.driver.fill(this.passwordInput, password);
    await this.driver.clickElement(this.continueButton);
  }
}

export default TurnOffPasskeySettings;
