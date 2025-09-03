import { Driver } from '../../../webdriver/driver';

class OnboardingCompletePage {
  private driver: Driver;

  private readonly installCompleteMessage = {
    text: 'Installation is complete!',
    tag: 'h2',
  };

  private readonly onboardingCompleteDoneButton =
    '[data-testid="onboarding-complete-done"]';

  private readonly downloadAppContinueButton =
    '[data-testid="download-app-continue"]';

  private readonly pinExtensionDoneButton =
    '[data-testid="pin-extension-done"]';

  private readonly pinExtensionMessage = {
    text: 'Pin MetaMask on your browser so it’s accessible and easy to view transaction confirmations.',
    tag: 'p',
  };

  private readonly walletReadyMessage = {
    text: 'Your wallet is ready!',
    tag: 'h2',
  };

  private readonly keepSrpSafeMessage = {
    text: 'Keep your Secret Recovery Phrase safe!',
    tag: 'h2',
  };

  private readonly remindMeLaterButton = {
    text: 'We’ll remind you later',
    tag: 'h2',
  };

  private readonly manageDefaultSettingsButton =
    '[data-testid="manage-default-settings"]';

  private readonly downloadAppTitle = {
    text: 'Scan QR code and download the app',
    tag: 'h2',
  };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkPageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([
        this.manageDefaultSettingsButton,
        this.onboardingCompleteDoneButton,
      ]);
    } catch (e) {
      console.log(
        'Timeout while waiting for onboarding wallet creation complete page to be loaded',
        e,
      );
      throw e;
    }
    console.log('Onboarding wallet creation complete page is loaded');
  }

  async checkPageIsLoadedBackup(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([
        this.keepSrpSafeMessage,
        this.onboardingCompleteDoneButton,
      ]);
    } catch (e) {
      console.error(
        'Timeout while waiting for srp backup complete page to be loaded',
        e,
      );
      throw e;
    }
    console.log('SRP backup complete page is loaded');
  }

  async clickCreateWalletDoneButton(): Promise<void> {
    await this.driver.clickElementAndWaitToDisappear(
      this.onboardingCompleteDoneButton,
    );
  }

  async displayDownloadAppPageAndContinue(): Promise<void> {
    await this.driver.waitForSelector(this.downloadAppTitle);
    await this.driver.clickElementAndWaitToDisappear(
      this.downloadAppContinueButton,
    );
  }

  async completeOnboarding(isSocialImportFlow: boolean = false): Promise<void> {
    console.log('Complete onboarding');
    if (!isSocialImportFlow) {
      await this.clickCreateWalletDoneButton();
    }

    await this.displayDownloadAppPageAndContinue();

    await this.driver.waitForSelector(this.installCompleteMessage);
    await this.driver.waitForSelector(this.pinExtensionMessage);
    await this.driver.clickElementAndWaitToDisappear(
      this.pinExtensionDoneButton,
    );
  }

  async completeBackup(): Promise<void> {
    console.log('Complete backup');
    await this.clickCreateWalletDoneButton();
  }

  async navigateToDefaultPrivacySettings(): Promise<void> {
    await this.driver.clickElementAndWaitToDisappear(
      this.manageDefaultSettingsButton,
    );
  }

  async checkWalletReadyMessageIsDisplayed(): Promise<void> {
    await this.driver.waitForSelector(this.walletReadyMessage);
  }

  async checkKeepSrpSafeMessageIsDisplayed(): Promise<void> {
    await this.driver.waitForSelector(this.keepSrpSafeMessage);
  }

  async checkRemindMeLaterButtonIsDisplayed(): Promise<void> {
    await this.driver.waitForSelector(this.remindMeLaterButton);
  }
}

export default OnboardingCompletePage;
