import { Driver } from '../../../webdriver/driver';

/**
 * SRP backup password gate: enter the wallet password to reveal the SRP.
 *
 * Screen: `#/onboarding/reveal-recovery-phrase`, reached from the home backup
 * reminder (`HomePage.goToBackupSRPPage`). During onboarding the SRP is still
 * in memory, so the app skips this screen and opens `SecureWalletPage`.
 * Owns: the password input and the continue button.
 * Boundaries: the password gate only. After a correct password the app opens
 * the review screen, which belongs to `SecureWalletPage`.
 * Related: `SecureWalletPage`, `ConfirmRecoveryPhrasePage`,
 * `flows/onboarding.flow.ts` (`revealAndConfirmSrp`).
 *
 * @see ui/pages/onboarding-flow/recovery-phrase/reveal-recovery-phrase.tsx
 */
class RevealRecoveryPhrasePage {
  private readonly continueButton =
    '[data-testid="reveal-recovery-phrase-continue"]';

  private readonly driver: Driver;

  private readonly passwordInput = '#account-details-authenticate';

  private readonly revealRecoveryPhrasePage =
    '[data-testid="reveal-recovery-phrase"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkPageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([
        this.revealRecoveryPhrasePage,
        this.passwordInput,
      ]);
    } catch (e) {
      console.log(
        'Timeout while waiting for reveal recovery phrase page to be loaded',
        e,
      );
      throw e;
    }
    console.log('Reveal recovery phrase page is loaded');
  }

  /**
   * Enter the wallet password and continue to the review screen.
   *
   * @param password - The wallet password.
   */
  async enterPasswordAndContinue(password: string): Promise<void> {
    console.log('Enter password to reveal the Secret Recovery Phrase');
    await this.driver.fill(this.passwordInput, password);
    await this.driver.clickElement(this.continueButton);
  }
}

export default RevealRecoveryPhrasePage;
