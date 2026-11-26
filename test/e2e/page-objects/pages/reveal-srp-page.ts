import { Driver } from '../../webdriver/driver';

/**
 * Reveal Secret Recovery Phrase: quiz, password prompt and the revealed SRP.
 *
 * Screen: `#/seed` and `#/seed/:keyringId`, reached from
 * `ManageWalletRecoverySettings.selectSrp` (see `flows/settings.flow.ts`
 * `openRevealSrp`) or from the account details SRP row.
 * Owns: the SRP quiz, the password prompt, the revealed SRP (text and QR) and
 * copying it, and going back to the SRP list.
 * Boundaries: the reveal page only. The SRP list belongs to
 * `ManageWalletRecoverySettings`.
 * Related: `ManageWalletRecoverySettings`, `AccountDetailsPage`.
 *
 * @see ui/pages/keychains/reveal-seed.tsx
 */
class RevealSrpPage {
  private readonly backToSrpListButton =
    '[data-testid="reveal-recovery-phrase-back-button"]';

  private readonly copiedSrpWarning =
    '[data-testid="sensitive-clipboard-warning"]';

  private readonly copySrpButton = '[data-testid="reveal-seed-copy-button"]';

  private readonly displayedSrpText = '[data-testid="recovery-phrase-chip-0"]';

  private readonly driver: Driver;

  private readonly pageContainer = '[data-testid="reveal-seed-page"]';

  private readonly passwordContinueButton =
    '[data-testid="reveal-seed-password-continue"]';

  private readonly passwordInput = '[data-testid="input-password"]';

  private readonly quizContinueButton = '[data-testid="srp-quiz-continue"]';

  private readonly quizGetStartedButton =
    '[data-testid="reveal-seed-quiz-get-started"]';

  private readonly quizQuestionOne = '[data-testid="srp_stage_question_one"]';

  private readonly quizQuestionTwo = '[data-testid="srp_stage_question_two"]';

  private readonly quizRightAnswerButton =
    '[data-testid="srp-quiz-right-answer"]';

  private readonly quizTryAgainButton = '[data-testid="srp-quiz-try-again"]';

  private readonly quizWrongAnswerButton =
    '[data-testid="srp-quiz-wrong-answer"]';

  private readonly quizWrongAnswerMessageOne = {
    text: 'Wrong! No one can help get your Secret Recovery Phrase back',
    tag: 'h2',
  };

  private readonly quizWrongAnswerMessageTwo = {
    text: 'Nope! Never share your Secret Recovery Phrase with anyone, ever',
    tag: 'h2',
  };

  private readonly srpQrCodeImage = '[data-testid="qr-srp"]';

  private readonly tapToRevealButton = '[data-testid="recovery-phrase-reveal"]';

  private readonly wrongPasswordMessage = '.mm-help-text';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async backToSrpList(): Promise<void> {
    console.log('Back to SRP list from reveal SRP page');
    await this.driver.clickElement(this.backToSrpListButton);
  }

  async checkDisplayedSrpCanBeCopied(): Promise<void> {
    console.log('Check displayed SRP can be copied');
    await this.driver.clickElement(this.copySrpButton);
    await this.driver.waitForSelector(this.copiedSrpWarning);
  }

  async checkPageIsLoaded(): Promise<void> {
    console.log('Check reveal SRP page is loaded');
    await this.driver.waitForSelector(this.pageContainer);
  }

  async checkSrpQrCodeIsDisplayed(): Promise<void> {
    console.log('Check SRP QR code is displayed');
    await this.driver.clickNestedButton('QR');
    await this.driver.waitForSelector(this.srpQrCodeImage);
  }

  /**
   * Check that the SRP text is displayed.
   *
   * @param expectedSrpText - The expected SRP text.
   */
  async checkSrpTextIsDisplayed(expectedSrpText: string): Promise<void> {
    console.log('Check SRP text is displayed');
    await this.driver.waitForSelector({
      css: this.displayedSrpText,
      text: expectedSrpText.split(' ')[0],
    });
  }

  /**
   * Complete the reveal SRP quiz to get to the password prompt.
   *
   * @param checkErrorAnswer - Whether to check for error answers during answering the quiz. Defaults to false.
   */
  async completeRevealSrpQuiz(
    checkErrorAnswer: boolean = false,
  ): Promise<void> {
    console.log('Complete reveal SRP quiz');
    await this.driver.clickElement(this.quizGetStartedButton);

    // answer quiz question 1
    if (checkErrorAnswer) {
      await this.driver.waitForSelector(this.quizQuestionOne);
      await this.driver.clickElement(this.quizWrongAnswerButton);
      await this.driver.waitForSelector(this.quizWrongAnswerMessageOne);
      await this.driver.clickElement(this.quizTryAgainButton);
    }
    await this.driver.waitForSelector(this.quizQuestionOne);
    await this.driver.findScrollToAndClickElement(this.quizRightAnswerButton);
    await this.driver.clickElement(this.quizContinueButton);

    // answer quiz question 2
    if (checkErrorAnswer) {
      await this.driver.waitForSelector(this.quizQuestionTwo);
      await this.driver.clickElement(this.quizWrongAnswerButton);
      await this.driver.waitForSelector(this.quizWrongAnswerMessageTwo);
      await this.driver.clickElement(this.quizTryAgainButton);
    }
    await this.driver.waitForSelector(this.quizQuestionTwo);
    await this.driver.findScrollToAndClickElement(this.quizRightAnswerButton);
    await this.driver.clickElement(this.quizContinueButton);
  }

  /**
   * Fill the password input and click the next button to reveal the SRP.
   *
   * @param password - The password to fill in the input.
   * @param expectedErrorMessage - Whether to expect an error message.
   */
  async fillPasswordToRevealSrp(
    password: string,
    expectedErrorMessage?: string,
  ): Promise<void> {
    console.log('Fill password to reveal SRP');
    await this.driver.fill(this.passwordInput, password);
    await this.driver.clickElement(this.passwordContinueButton);
    if (expectedErrorMessage) {
      await this.driver.waitForSelector({
        css: this.wrongPasswordMessage,
        text: expectedErrorMessage,
      });
    } else {
      await this.driver.waitForSelector(this.tapToRevealButton);
      await this.driver.clickElement(this.tapToRevealButton);
    }
  }

  async getSrpText(): Promise<string> {
    console.log('Get the revealed SRP');
    await this.driver.waitForSelector(this.displayedSrpText);
    return (await this.driver.findElement(this.displayedSrpText)).getText();
  }
}

export default RevealSrpPage;
