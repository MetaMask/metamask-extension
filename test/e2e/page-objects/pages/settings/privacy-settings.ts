import { Driver } from '../../../webdriver/driver';
import { clickNestedButton } from '../../../helpers';
import { tEn } from '../../../../lib/i18n-helpers';

class PrivacySettings {
  private readonly driver: Driver;

  private readonly privacySettingsPageTitle = {
    text: 'Security & privacy',
    tag: 'h4',
  };

  // SRP related locators
  private readonly closeRevealSrpDialogButton = {
    text: tEn('close'),
    tag: 'button',
  };

  private readonly copySrpButton = {
    text: tEn('copyToClipboard'),
    tag: 'button',
  };

  private readonly copiedSrpExclamation = {
    text: tEn('copiedExclamation'),
    tag: 'button',
  };

  private readonly displayedSrpText = '[data-testid="srp_text"]';

  private readonly holdToRevealSRPButton = {
    text: tEn('holdToRevealSRP'),
    tag: 'span',
  };

  private readonly revealSrpButton = '[data-testid="reveal-seed-words"]';

  private readonly revealSrpNextButton = {
    text: 'Next',
    tag: 'button',
  };

  private readonly revealSrpPasswordInput = '[data-testid="input-password"]';

  private readonly revealSrpQrCodeImage = '[data-testid="qr-srp"]';

  private readonly revealSrpQuizContinueButton =
    '[data-testid="srp-quiz-continue"]';

  private readonly revealSrpQuizGetStartedButton =
    '[data-testid="srp-quiz-get-started"]';

  private readonly revealSrpQuizModalTitle = {
    text: 'Security quiz',
    tag: 'header',
  };

  private readonly revealSrpQuizQuestionOne =
    '[data-testid="srp_stage_question_one"]';

  private readonly revealSrpQuizQuestionTwo =
    '[data-testid="srp_stage_question_two"]';

  private readonly revealSrpQuizRightAnswerButton =
    '[data-testid="srp-quiz-right-answer"]';

  private readonly revealSrpQuizTryAgainButton =
    '[data-testid="srp-quiz-try-again"]';

  private readonly revealSrpQuizWrongAnswerButton =
    '[data-testid="srp-quiz-wrong-answer"]';

  private readonly revealSrpQuizWrongAnswerMessageOne = {
    text: 'Wrong! No one can help get your Secret Recovery Phrase back',
    tag: 'p',
  };

  private readonly revealSrpQuizWrongAnswerMessageTwo = {
    text: 'Nope! Never share your Secret Recovery Phrase with anyone, ever',
    tag: 'p',
  };

  private readonly revealSrpWrongPasswordMessage = '.mm-help-text';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async check_pageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForSelector(this.privacySettingsPageTitle);
    } catch (e) {
      console.log(
        'Timeout while waiting for Privacy & Security Settings page to be loaded',
        e,
      );
      throw e;
    }
    console.log('Privacy & Security Settings page is loaded');
  }

  async closeRevealSrpDialog(): Promise<void> {
    console.log('Close reveal SRP dialog on privacy settings page');
    await this.driver.clickElement(this.closeRevealSrpDialogButton);
  }

  /**
   * Complete reveal SRP quiz to open reveal SRP dialog.
   *
   * @param checkErrorAnswer - Whether to check for error answers during answering the quiz.
   */
  async completeRevealSrpQuiz(checkErrorAnswer?: boolean): Promise<void> {
    console.log('Complete reveal SRP quiz on privacy settings page');
    await this.driver.clickElement(this.revealSrpQuizGetStartedButton);

    // answer quiz question 1
    if (checkErrorAnswer) {
      await this.driver.waitForSelector(this.revealSrpQuizQuestionOne);
      await this.driver.clickElement(this.revealSrpQuizWrongAnswerButton);
      await this.driver.waitForSelector(
        this.revealSrpQuizWrongAnswerMessageOne,
      );
      await this.driver.clickElement(this.revealSrpQuizTryAgainButton);
    }
    await this.driver.waitForSelector(this.revealSrpQuizQuestionOne);
    await this.driver.clickElement(this.revealSrpQuizRightAnswerButton);
    await this.driver.clickElement(this.revealSrpQuizContinueButton);

    // answer quiz question 2
    if (checkErrorAnswer) {
      await this.driver.waitForSelector(this.revealSrpQuizQuestionTwo);
      await this.driver.clickElement(this.revealSrpQuizWrongAnswerButton);
      await this.driver.waitForSelector(
        this.revealSrpQuizWrongAnswerMessageTwo,
      );
      await this.driver.clickElement(this.revealSrpQuizTryAgainButton);
    }
    await this.driver.waitForSelector(this.revealSrpQuizQuestionTwo);
    await this.driver.clickElement(this.revealSrpQuizRightAnswerButton);
    await this.driver.clickElement(this.revealSrpQuizContinueButton);
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
    console.log('Fill password to reveal SRP on privacy settings page');
    await this.driver.fill(this.revealSrpPasswordInput, password);
    await this.driver.clickElement(this.revealSrpNextButton);
    if (expectedErrorMessage) {
      await this.driver.waitForSelector({
        css: this.revealSrpWrongPasswordMessage,
        text: expectedErrorMessage,
      });
    } else {
      await this.driver.holdMouseDownOnElement(
        this.holdToRevealSRPButton,
        3000,
      );
    }
  }

  async openRevealSrpQuiz(): Promise<void> {
    console.log('Open reveal SRP quiz on privacy settings page');
    await this.driver.clickElement(this.revealSrpButton);
    await this.driver.waitForSelector(this.revealSrpQuizModalTitle);
  }

  async check_displayedSrpCanBeCopied(): Promise<void> {
    console.log('Check displayed SRP on privacy settings page can be copied');
    await this.driver.clickElement(this.copySrpButton);
    await this.driver.waitForSelector(this.copiedSrpExclamation);
  }

  async check_srpQrCodeIsDisplayed(): Promise<void> {
    console.log('Check SRP QR code is displayed on privacy settings page');
    await clickNestedButton(this.driver, 'QR');
    await this.driver.waitForSelector(this.revealSrpQrCodeImage);
  }

  /**
   * Check that the SRP text is displayed.
   *
   * @param expectedSrpText - The expected SRP text.
   */
  async check_srpTextIsDisplayed(expectedSrpText: string): Promise<void> {
    console.log('Check SRP text is displayed on privacy settings page');
    await this.driver.waitForSelector({
      css: this.displayedSrpText,
      text: expectedSrpText,
    });
  }
}

export default PrivacySettings;
