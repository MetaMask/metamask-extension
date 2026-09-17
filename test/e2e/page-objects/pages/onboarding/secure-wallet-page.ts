import { Driver } from '../../../webdriver/driver';

/**
 * Create-wallet SRP backup: reveal, review, confirm quiz, or remind later.
 *
 * Screen: `#/onboarding/reveal-recovery-phrase`, then
 * `#/onboarding/review-recovery-phrase` and
 * `#/onboarding/confirm-recovery-phrase` (and the confirm success modal).
 * Owns: optional password gate, reveal/continue, quiz chip selection,
 * confirm success, and the "remind me later" skip.
 * Boundaries: create-flow SRP backup only. Import-flow SRP entry is
 * `OnboardingSrpPage`. Does not handle metrics or completion.
 * Related: preceded by `OnboardingPasswordPage` / `SetupPasskeyPage`; next
 * is `OnboardingMetricsPage` (Chrome) then `OnboardingCompletePage`;
 * `flows/onboarding.flow.ts`.
 *
 * @see ui/pages/onboarding-flow/recovery-phrase/reveal-recovery-phrase.tsx
 * @see ui/pages/onboarding-flow/recovery-phrase/review-recovery-phrase.tsx
 * @see ui/pages/onboarding-flow/recovery-phrase/confirm-recovery-phrase.tsx
 * @see ui/pages/onboarding-flow/recovery-phrase/confirm-srp-modal.tsx
 */
class SecureWalletPage {
  private readonly confirmPasswordButton =
    '[data-testid="reveal-recovery-phrase-continue"]';

  private readonly confirmSecretRecoveryPhraseMessage = {
    text: 'Confirm your Secret Recovery Phrase',
    tag: 'h2',
  };

  private readonly confirmSrpConfirmButton =
    '[data-testid="confirm-srp-modal-button"]';

  private readonly confirmSrpSuccessMessage = {
    text: 'Perfect',
    tag: 'h3',
  };

  private driver: Driver;

  private readonly page = '[data-testid="parent-selector-secure-wallet"]';

  private readonly passwordInput = '#account-details-authenticate';

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
   * Reveal and confirm SRP on secure wallet page during onboarding
   *
   * @param needEnterPassword - Whether to enter the password
   */
  async revealAndConfirmSRP(needEnterPassword: string = ''): Promise<void> {
    console.log('Reveal and confirm SRP on Reveal SRP Onboarding page');
    if (needEnterPassword) {
      await this.driver.fill(this.passwordInput, needEnterPassword);
      await this.driver.clickElement(this.confirmPasswordButton);
    }
    await this.driver.waitForMultipleSelectors([
      this.writeDownSecretRecoveryPhraseMessage,
      this.revealSecretRecoveryPhraseButton,
    ]);

    // click reveal button to reveal SRP
    await this.driver.clickElementAndWaitToDisappear(
      this.revealSecretRecoveryPhraseButton,
    );
    await this.driver.clickElementAndWaitToDisappear(
      this.recoveryPhraseContinueButton,
    );

    await this.driver.waitForMultipleSelectors([
      this.confirmSecretRecoveryPhraseMessage,
      this.recoveryPhraseChips,
    ]);

    let quizWordsString = '';
    const recoveryPhraseChips = await this.driver.findElement(
      this.recoveryPhraseChips,
    );
    quizWordsString = await recoveryPhraseChips.getAttribute('data-quiz-words');

    // confirm SRP
    const quizWords = JSON.parse(quizWordsString).sort(
      (
        a: { word: string; index: number },
        b: { word: string; index: number },
      ) => a.index - b.index,
    );
    const quizInputSelector0 = `[data-testid="recovery-phrase-quiz-unanswered-${quizWords[0].index}"]`;
    const quizInputSelector1 = `[data-testid="recovery-phrase-quiz-unanswered-${quizWords[1].index}"]`;
    const quizInputSelector2 = `[data-testid="recovery-phrase-quiz-unanswered-${quizWords[2].index}"]`;

    await this.driver.waitForMultipleSelectors([
      quizInputSelector0,
      quizInputSelector1,
      quizInputSelector2,
    ]);
    await this.driver.clickElement(quizInputSelector0);
    await this.driver.clickElement(quizInputSelector1);
    await this.driver.clickElement(quizInputSelector2);

    // Modal opens automatically after all three quiz words are selected
    await this.driver.waitForMultipleSelectors([
      this.confirmSrpSuccessMessage,
      this.confirmSrpConfirmButton,
    ]);

    await this.driver.clickElementAndWaitToDisappear(
      this.confirmSrpConfirmButton,
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
