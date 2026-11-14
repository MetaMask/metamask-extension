import { Driver } from '../../../webdriver/driver';

/**
 * SRP backup quiz: pick the missing words to confirm the SRP.
 *
 * Screen: `#/onboarding/confirm-recovery-phrase` and its success modal,
 * reached from `SecureWalletPage` after revealing the SRP.
 * Owns: the quiz chips, answering the quiz and closing the success modal.
 * Boundaries: the quiz only. After the success modal the app opens the
 * metrics step (`OnboardingMetricsPage`) or the completion screen
 * (`OnboardingCompletePage`).
 * Related: `SecureWalletPage`, `OnboardingMetricsPage`,
 * `OnboardingCompletePage`, `flows/onboarding.flow.ts`
 * (`revealAndConfirmSrp`).
 *
 * @see ui/pages/onboarding-flow/recovery-phrase/confirm-recovery-phrase.tsx
 * @see ui/pages/onboarding-flow/recovery-phrase/confirm-srp-modal.tsx
 */
class ConfirmRecoveryPhrasePage {
  private readonly confirmRecoveryPhrasePage =
    '[data-testid="confirm-recovery-phrase"]';

  private readonly confirmRecoveryPhraseTitle = {
    text: 'Confirm your Secret Recovery Phrase',
    tag: 'h2',
  };

  private readonly driver: Driver;

  private readonly quizUnansweredChip = (index: number) =>
    `[data-testid="recovery-phrase-quiz-unanswered-${index}"]`;

  private readonly recoveryPhraseChips =
    '[data-testid="recovery-phrase-chips"]';

  private readonly successModalButton =
    '[data-testid="confirm-srp-modal-button"]';

  private readonly successModalTitle = {
    text: 'Perfect',
    tag: 'h3',
  };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  /**
   * Pick the missing words in order and close the success modal, which opens
   * automatically once all quiz words are selected.
   */
  async answerQuizAndConfirm(): Promise<void> {
    console.log('Answer the Secret Recovery Phrase quiz and confirm');
    const recoveryPhraseChips = await this.driver.findElement(
      this.recoveryPhraseChips,
    );
    const quizWordsString =
      await recoveryPhraseChips.getAttribute('data-quiz-words');
    const quizChips = JSON.parse(quizWordsString)
      .sort(
        (
          a: { word: string; index: number },
          b: { word: string; index: number },
        ) => a.index - b.index,
      )
      .map(({ index }: { index: number }) => this.quizUnansweredChip(index));

    await this.driver.waitForMultipleSelectors(quizChips);
    for (const quizChip of quizChips) {
      await this.driver.clickElement(quizChip);
    }

    await this.driver.waitForMultipleSelectors([
      this.successModalTitle,
      this.successModalButton,
    ]);
    await this.driver.clickElementAndWaitToDisappear(this.successModalButton);
  }

  async checkPageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([
        this.confirmRecoveryPhrasePage,
        this.confirmRecoveryPhraseTitle,
        this.recoveryPhraseChips,
      ]);
    } catch (e) {
      console.log(
        'Timeout while waiting for confirm recovery phrase page to be loaded',
        e,
      );
      throw e;
    }
    console.log('Confirm recovery phrase page is loaded');
  }
}

export default ConfirmRecoveryPhrasePage;
