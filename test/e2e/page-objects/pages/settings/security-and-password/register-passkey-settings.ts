import { Driver } from '../../../../webdriver/driver';

/**
 * Settings → Security and password → Register passkey.
 *
 * Screen: `#/settings/security-and-password/register-passkey`, reached from
 * `SecurityAndPasswordSettings.clickPasskeyToggle` when no passkey is set up.
 * Owns: the password check and the passkey enrollment steps.
 * Boundaries: the register sub-page only.
 * Related: `SecurityAndPasswordSettings`, `TurnOffPasskeySettings`.
 *
 * @see ui/pages/settings/security-and-password-tab/passkey-register-sub-page.tsx
 */
class RegisterPasskeySettings {
  private readonly continueButton =
    '[data-testid="register-passkey-verify-continue-button"]';

  private readonly driver: Driver;

  private readonly enrollmentSteps = '[data-testid="passkey-setup-steps"]';

  private readonly enrollmentStepSuccess =
    '[data-testid="passkey-step-indicator-success"]';

  private readonly passwordInput =
    '[data-testid="register-passkey-password-input"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  /**
   * Check the page is loaded at its password step, which is where it opens
   * from the passkey toggle.
   */
  async checkPageIsLoaded(): Promise<void> {
    console.log('Check Register passkey settings page is loaded');
    await this.driver.waitForSelector(this.passwordInput);
  }

  async enterPasswordAndContinue(password: string): Promise<void> {
    console.log('Enter password and continue for passkey registration');
    await this.driver.fill(this.passwordInput, password);
    await this.driver.clickElement(this.continueButton);
  }

  async waitForEnrollmentSuccess(): Promise<void> {
    console.log('Waiting for passkey enrollment success in settings');
    await this.driver.waitForSelector(this.enrollmentSteps);
    await this.driver.waitForSelector(this.enrollmentStepSuccess);
  }
}

export default RegisterPasskeySettings;
