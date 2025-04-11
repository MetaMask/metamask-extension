import { Driver } from '../../../webdriver/driver';

class SecureWalletPage {
  private driver: Driver;

  private readonly confirmPasswordButton = {
    text: 'Confirm',
    tag: 'button',
  };

  private readonly confirmRecoveryPhraseButton =
    '[data-testid="recovery-phrase-confirm"]';

  private readonly confirmSecretRecoveryPhraseMessage = {
    text: 'Confirm Secret Recovery Phrase',
    tag: 'h2',
  };

  private readonly passwordInput = '#account-details-authenticate';

  private readonly recoveryPhraseChips =
    '[data-testid="recovery-phrase-chips"]';

  private readonly recoveryPhraseInputIndex2 =
    '[data-testid="recovery-phrase-input-2"]';

  private readonly recoveryPhraseInputIndex3 =
    '[data-testid="recovery-phrase-input-3"]';

  private readonly recoveryPhraseInputIndex7 =
    '[data-testid="recovery-phrase-input-7"]';

  private readonly recoveryPhraseNextButton =
    '[data-testid="recovery-phrase-next"]';

  private readonly revealSecretRecoveryPhraseButton =
    '[data-testid="recovery-phrase-reveal"]';

  private readonly secureWalletButton =
    '[data-testid="secure-wallet-recommended"]';

  private readonly secureWalletLaterButton =
    '[data-testid="secure-wallet-later"]';

  private readonly secureWalletMessage = {
    text: 'Secure your wallet',
    tag: 'h2',
  };

  private readonly skipAccountSecurityMessage = {
    text: 'Skip account security?',
    tag: 'h3',
  };

  private readonly skipSRPBackupCheckbox =
    '[data-testid="skip-srp-backup-popover-checkbox"]';

  private readonly skipSRPBackupConfirmButton =
    '[data-testid="skip-srp-backup"]';

  private readonly writeDownSecretRecoveryPhraseMessage = {
    text: 'Write down your Secret Recovery Phrase',
    tag: 'h2',
  };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async check_pageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([
        this.secureWalletMessage,
        this.secureWalletButton,
        this.secureWalletLaterButton,
      ]);
    } catch (e) {
      console.log(
        'Timeout while waiting for secure wallet page to be loaded',
        e,
      );
      throw e;
    }
    console.log('Secure wallet page is loaded');
  }

  /**
   * Reveal and confirm SRP on secure wallet page during onboarding
   * @param needEnterPassword - Whether to enter the password
   */
  async revealAndConfirmSRP(
    needEnterPassword: string = '',
  ): Promise<void> {
    console.log(
      'Reveal and confirm SRP on secure wallet page during onboarding',
    );
    // click secure my wallet button to reveal SRP
    await this.driver.clickElement(this.secureWalletButton);
    if (needEnterPassword) {
      await this.driver.fill(this.passwordInput, needEnterPassword);
      await this.driver.clickElement(this.confirmPasswordButton);
    }
    await this.driver.waitForMultipleSelectors([
      this.writeDownSecretRecoveryPhraseMessage,
      this.revealSecretRecoveryPhraseButton,
    ]);

    // click reveal button to reveal SRP
    await this.driver.clickElement(this.revealSecretRecoveryPhraseButton);
    await this.driver.waitForSelector(this.recoveryPhraseChips);

    let finalWords: string[] = [];
    await this.driver.wait(async () => {
      const recoveryPhraseChips = await this.driver.findElement(
        this.recoveryPhraseChips,
      );
      const recoveryPhrase = await recoveryPhraseChips.getText();
      const words = recoveryPhrase.split(/\s*(?:[0-9)]+|\n|\.|^$|$)\s*/u);
      finalWords = words.filter((str) => str !== '');
      return finalWords.length === 12;
    }, this.driver.timeout);
    await this.driver.clickElement(this.recoveryPhraseNextButton);

    // confirm SRP
    await this.driver.waitForSelector(this.confirmSecretRecoveryPhraseMessage);
    await this.driver.fill(this.recoveryPhraseInputIndex2, finalWords[2]);
    await this.driver.fill(this.recoveryPhraseInputIndex3, finalWords[3]);
    await this.driver.fill(this.recoveryPhraseInputIndex7, finalWords[7]);
    await this.driver.clickElementAndWaitToDisappear(
      this.confirmRecoveryPhraseButton,
    );
  }

  async revealAndDoNotConfirmSRP(): Promise<void> {
    console.log('Do not confirm SRP on secure wallet page during onboarding');
    // click secure my wallet button to reveal SRP
    await this.driver.clickElement(this.secureWalletButton);
    await this.driver.waitForMultipleSelectors([
      this.writeDownSecretRecoveryPhraseMessage,
      this.revealSecretRecoveryPhraseButton,
    ]);

    // click reveal button to reveal SRP
    await this.driver.clickElement(this.revealSecretRecoveryPhraseButton);
    await this.driver.waitForSelector(this.recoveryPhraseChips);

    let finalWords: string[] = [];
    await this.driver.wait(async () => {
      const recoveryPhraseChips = await this.driver.findElement(
        this.recoveryPhraseChips,
      );
      const recoveryPhrase = await recoveryPhraseChips.getText();
      const words = recoveryPhrase.split(/\s*(?:[0-9)]+|\n|\.|^$|$)\s*/u);
      finalWords = words.filter((str) => str !== '');
      return finalWords.length === 12;
    }, this.driver.timeout);
    await this.driver.clickElement(this.recoveryPhraseNextButton);
  }

  async skipSRPBackup(): Promise<void> {
    console.log('Skip SRP backup on secure wallet page during onboarding');
    await this.driver.clickElement(this.secureWalletLaterButton);
    await this.driver.waitForSelector(this.skipAccountSecurityMessage);
    await this.driver.clickElement(this.skipSRPBackupCheckbox);
    await this.driver.clickElementAndWaitToDisappear(
      this.skipSRPBackupConfirmButton,
    );
  }
}

export default SecureWalletPage;
