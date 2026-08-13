import { Driver } from '../../../webdriver/driver';

/**
 * Optional passkey / biometrics enrollment during onboarding (Chrome).
 *
 * Screen: `#/onboarding/setup-passkey`
 * Owns: Set up / Maybe later CTAs and enrollment step / success indicators.
 * Boundaries: passkey setup or skip only. Shown for non-social SRP flows;
 * typically skipped in Firefox E2E. Does not handle SRP backup or metrics.
 * Related: after `OnboardingPasswordPage`; create path next is
 * `SecureWalletPage`, import path next is `OnboardingMetricsPage`;
 * `flows/onboarding.flow.ts` (`skipPasskeySetup`).
 *
 * @see ui/pages/onboarding-flow/setup-passkey/setup-passkey.tsx
 */
class SetupPasskeyPage {
  private driver: Driver;

  private readonly enrollmentSteps = '[data-testid="passkey-setup-steps"]';

  private readonly maybeLaterButton =
    '[data-testid="passkey-maybe-later-button"]';

  private readonly setUpPasskeyButton = '[data-testid="passkey-set-up-button"]';

  private readonly stepIndicatorSuccess =
    '[data-testid="passkey-step-indicator-success"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkPageIsLoaded(timeout?: number): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors(
        [this.maybeLaterButton, this.setUpPasskeyButton],
        { timeout },
      );
    } catch (e) {
      console.log(
        'Timeout while waiting for setup passkey page to be loaded',
        e,
      );
      throw e;
    }
    console.log('Setup passkey page is loaded');
  }

  async clickSetUpPasskey(): Promise<void> {
    console.log('Click Set up biometrics during onboarding');
    await this.driver.clickElement(this.setUpPasskeyButton);
  }

  async skipPasskeySetup(): Promise<void> {
    console.log('Skip passkey setup');
    await this.driver.clickElementAndWaitToDisappear(this.maybeLaterButton);
  }

  async waitForEnrollmentSteps(): Promise<void> {
    console.log('Waiting for passkey enrollment steps to appear');
    await this.driver.waitForSelector(this.enrollmentSteps);
  }

  async waitForEnrollmentSuccess(): Promise<void> {
    console.log('Waiting for passkey enrollment to complete successfully');
    await this.driver.waitForSelector(this.stepIndicatorSuccess);
  }
}

export default SetupPasskeyPage;
