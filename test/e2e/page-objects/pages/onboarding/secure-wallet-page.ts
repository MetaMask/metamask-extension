import { Driver } from '../../../webdriver/driver';

/**
 * Create-wallet SRP backup: reveal and review the SRP, or remind later.
 *
 * Screen: `#/onboarding/review-recovery-phrase`.
 * Owns: revealing the SRP, reading the revealed words, continue, and the
 * "remind me later" skip.
 * Boundaries: the review screen only. The password gate shown from the home
 * backup reminder belongs to `RevealRecoveryPhrasePage`, and the quiz belongs
 * to `ConfirmRecoveryPhrasePage` (see `revealAndConfirmSrp` in
 * `flows/onboarding.flow.ts`). Import-flow SRP entry is `OnboardingSrpPage`.
 * Related: preceded by `OnboardingPasswordPage` / `SetupPasskeyPage`; next
 * is `ConfirmRecoveryPhrasePage`, or `OnboardingMetricsPage` (Chrome) /
 * `OnboardingCompletePage` when skipping.
 *
 * @see ui/pages/onboarding-flow/recovery-phrase/review-recovery-phrase.tsx
 * @see ui/pages/onboarding-flow/recovery-phrase/recovery-phrase-chips.tsx
 */
class SecureWalletPage {
  private driver: Driver;

  private readonly page = '[data-testid="parent-selector-secure-wallet"]';

  private readonly recoveryPhraseChips =
    '[data-testid="recovery-phrase-chips"]';

  private readonly recoveryPhraseContinueButton =
    '[data-testid="recovery-phrase-continue"]';

  private readonly revealSecretRecoveryPhraseButton =
    '[data-testid="recovery-phrase-reveal"]';

  private readonly secureWalletRecommendedButton =
    '[data-testid="recovery-phrase-remind-later"]';

  private readonly writeDownSecretRecoveryPhraseMessage = {
    text: 'Save your Secret Recovery Phrase',
    tag: 'h2',
  };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkPageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([
        this.page,
        this.secureWalletRecommendedButton,
      ]);
    } catch (e) {
      console.log(
        'Timeout while waiting for secure wallet page to be loaded',
        e,
      );
      throw e;
    }
    console.log('Reveal SRP page is loaded');
  }

  /**
   * Reveal the SRP and continue to the confirm quiz.
   */
  async revealAndContinue(): Promise<void> {
    console.log('Reveal SRP and continue on review recovery phrase page');
    await this.driver.waitForMultipleSelectors([
      this.writeDownSecretRecoveryPhraseMessage,
      this.revealSecretRecoveryPhraseButton,
    ]);
    await this.driver.clickElementAndWaitToDisappear(
      this.revealSecretRecoveryPhraseButton,
    );
    await this.driver.clickElementAndWaitToDisappear(
      this.recoveryPhraseContinueButton,
    );
  }

  async revealAndDoNotConfirmSRP(): Promise<void> {
    console.log('Do not confirm SRP on secure wallet page during onboarding');
    await this.driver.waitForMultipleSelectors([
      this.writeDownSecretRecoveryPhraseMessage,
      this.revealSecretRecoveryPhraseButton,
    ]);

    // click reveal button to reveal SRP
    await this.driver.clickElementAndWaitToDisappear(
      this.revealSecretRecoveryPhraseButton,
    );
    await this.driver.waitForSelector(this.recoveryPhraseChips);

    let finalWords: string[] = [];
    await this.driver.wait(async () => {
      const recoveryPhraseChips = await this.driver.findElement(
        this.recoveryPhraseChips,
      );
      const recoveryPhrase = await recoveryPhraseChips.getAttribute(
        'data-recovery-phrase',
      );
      const words = recoveryPhrase.split(':');
      finalWords = words.filter((str) => str !== '');
      return finalWords.length === 12;
    }, this.driver.timeout);
    await this.driver.clickElementAndWaitToDisappear(
      this.recoveryPhraseContinueButton,
    );
  }

  async skipSRPBackup(): Promise<void> {
    console.log('Skip SRP backup on Reveal SRP Onboarding page');
    await this.driver.clickElement(this.secureWalletRecommendedButton);
  }
}

export default SecureWalletPage;
