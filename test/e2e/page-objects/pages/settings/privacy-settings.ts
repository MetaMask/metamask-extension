import { Driver } from '../../../webdriver/driver';
import { clickNestedButton } from '../../../helpers';
import { tEn } from '../../../../lib/i18n-helpers';

class PrivacySettings {
  private readonly driver: Driver;

  private readonly autodetectNftToggleButton =
    '[data-testid="useNftDetection"] .toggle-button > div';

  private readonly autoDetectToken =
    '[data-testid="autoDetectTokens"] .toggle-button';

  private readonly closeRevealSrpDialogButton = {
    text: tEn('close'),
    tag: 'button',
  };

  private readonly confirmDeleteMetaMetricsDataButton =
    '[data-testid="clear-metametrics-data"]';

  private readonly copiedSrpExclamation = {
    text: tEn('copiedExclamation'),
    tag: 'button',
  };

  private readonly copySrpButton = {
    text: tEn('copyToClipboard'),
    tag: 'button',
  };

  private readonly dataCollectionForMarketingToggle =
    '[data-testid="data-collection-for-marketing-toggle"] .toggle-button';

  private readonly dataCollectionWarningAckButton = {
    text: 'Okay',
    tag: 'button',
  };

  private readonly dataCollectionWarningMessage = {
    text: 'You turned off data collection for our marketing purposes. This only applies to this device. ',
    tag: 'p',
  };

  private readonly deleteMetaMetricsDataButton =
    '[data-testid="delete-metametrics-data-button"]';

  private readonly deleteMetaMetricsModalTitle = {
    text: 'Delete MetaMetrics data?',
    tag: 'h4',
  };

  private readonly ensDomainResolutionToggle =
    '[data-testid="ipfs-gateway-resolution-container"] .toggle-button';

  private readonly ipfsGatewayToggle =
    '[data-testid="ipfsToggle"] .toggle-button';

  private readonly privacySettingsPageTitle = {
    text: 'Security & privacy',
    tag: 'h4',
  };

  // reveal SRP related locators
  private readonly displayedSrpText = '[data-testid="srp_text"]';

  private readonly holdToRevealSRPButton = {
    text: tEn('holdToRevealSRP'),
    tag: 'span',
  };

  private readonly networkDetailsCheckToggle =
    '[data-testid="useSafeChainsListValidation"] .toggle-button';

  private readonly revealSrpButton = '[data-testid="reveal-seed-words"]';

  private readonly changePasswordButton =
    '[data-testid="change-password-button"]';

  private readonly passwordChangeSuccessToast =
    '[data-testid="password-change-toast-success"]';

  private readonly passwordChangeErrorToast =
    '[data-testid="password-change-toast-error"]';

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

  private readonly participateInMetaMetricsToggle =
    '[data-testid="participate-in-meta-metrics-toggle"] .toggle-button';

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

  async check_srpListIsLoaded(): Promise<void> {
    console.log('Check SRP list is loaded on privacy settings page');
    const srpSelector = {
      text: `Secret Recovery Phrase 1`,
      tag: 'p',
    };
    await this.driver.waitForSelector(srpSelector);
  }

  async deleteMetaMetrics(): Promise<void> {
    console.log('Click to delete MetaMetrics data on privacy settings page');
    await this.driver.clickElement(this.deleteMetaMetricsDataButton);
    await this.driver.waitForSelector(this.deleteMetaMetricsModalTitle);
    // there is a race condition, where we need to wait before clicking clear button otherwise an error is thrown in the background
    // we cannot wait for a UI conditon, so we a delay to mitigate this until another solution is found
    await this.driver.delay(3000);
    await this.driver.clickElementAndWaitToDisappear(
      this.confirmDeleteMetaMetricsDataButton,
    );
  }

  async closeRevealSrpDialog(): Promise<void> {
    console.log('Close reveal SRP dialog on privacy settings page');
    await this.driver.clickElement(this.closeRevealSrpDialogButton);
  }

  /**
   * Complete reveal SRP quiz to open reveal SRP dialog.
   *
   * @param checkErrorAnswer - Whether to check for error answers during answering the quiz. Defaults to false.
   */
  async completeRevealSrpQuiz(
    checkErrorAnswer: boolean = false,
  ): Promise<void> {
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

  async getSrpInRevealSrpDialog(): Promise<string> {
    console.log('Get SRP in reveal SRP dialog on privacy settings page');
    await this.driver.waitForSelector(this.displayedSrpText);
    return (await this.driver.findElement(this.displayedSrpText)).getText();
  }

  async openSrpList(): Promise<void> {
    // THe e2e clicks the reveal SRP too quickly before the component checks if there are multiple SRPs
    await this.driver.delay(1000);
    await this.driver.clickElement(this.revealSrpButton);
  }

  async openChangePassword(): Promise<void> {
    console.log('Open change password on privacy settings page');
    await this.driver.clickElement(this.changePasswordButton);
  }

  async openRevealSrpQuiz(srpIndex: number = 1): Promise<void> {
    await this.openSrpList();
    // We only pass in the srpIndex when there are multiple SRPs
    const srpSelector = {
      text: `Secret Recovery Phrase ${srpIndex.toString()}`,
      tag: 'p',
    };
    await this.driver.clickElement(srpSelector);

    await this.driver.waitForSelector(this.revealSrpQuizModalTitle);
  }

  async optOutDataCollectionForMarketing(): Promise<void> {
    console.log(
      'Opt out data collection for marketing on privacy settings page',
    );
    await this.toggleDataCollectionForMarketing();
    await this.driver.waitForSelector(this.dataCollectionWarningMessage);
    await this.driver.clickElementAndWaitToDisappear(
      this.dataCollectionWarningAckButton,
    );
  }

  async toggleAutodetectNft(): Promise<void> {
    console.log('Toggle autodetect NFT on privacy settings page');
    await this.driver.clickElement(this.autodetectNftToggleButton);
  }

  async toggleEnsDomainResolution(): Promise<void> {
    console.log('Toggle ENS domain resolution on privacy settings page');
    await this.driver.clickElement(this.ensDomainResolutionToggle);
  }

  async toggleIpfsGateway(): Promise<void> {
    console.log('Toggle IPFS gateway on privacy settings page');
    await this.driver.clickElement(this.ipfsGatewayToggle);
  }

  async toggleNetworkDetailsCheck(): Promise<void> {
    console.log('Toggle network details check on privacy settings page');
    await this.driver.clickElement(this.networkDetailsCheckToggle);
  }

  /**
   * Checks if the delete MetaMetrics data button is enabled on privacy settings page.
   *
   */
  async check_deleteMetaMetricsDataButtonEnabled(): Promise<boolean> {
    try {
      await this.driver.findClickableElement(this.deleteMetaMetricsDataButton, {
        waitAtLeastGuard: 2000,
        timeout: 5000,
      });
    } catch (e) {
      console.log('Delete MetaMetrics data button not enabled', e);
      return false;
    }
    console.log('Delete MetaMetrics data button is enabled');
    return true;
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

  async toggleAutoDetectTokens(): Promise<void> {
    console.log(
      'Toggle auto detect tokens in Security and Privacy settings page',
    );
    await this.driver.clickElement(this.autoDetectToken);
  }

  async toggleParticipateInMetaMetrics(): Promise<void> {
    console.log(
      'Toggle participate in meta metrics in Security and Privacy settings page',
    );
    await this.driver.clickElement(this.participateInMetaMetricsToggle);
  }

  async toggleDataCollectionForMarketing(): Promise<void> {
    console.log(
      'Toggle data collection for marketing in Security and Privacy settings page',
    );
    await this.driver.clickElement(this.dataCollectionForMarketingToggle);
  }
}

export default PrivacySettings;
