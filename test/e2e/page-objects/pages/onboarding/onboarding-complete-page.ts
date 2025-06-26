import { Driver } from '../../../webdriver/driver';

class OnboardingCompletePage {
  private driver: Driver;

  private readonly installCompleteMessage = {
    text: 'Installation is complete!',
    tag: 'h2',
  };

  private readonly onboardingCompleteDoneButton =
    '[data-testid="onboarding-complete-done"]';

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

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async check_pageIsLoaded(): Promise<void> {
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

  async check_pageIsLoaded_backup(): Promise<void> {
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

  async completeOnboarding(): Promise<void> {
    console.log('Complete onboarding');
    await this.clickCreateWalletDoneButton();
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

  async check_walletReadyMessageIsDisplayed(): Promise<void> {
    await this.driver.waitForSelector(this.walletReadyMessage);
  }

  async check_keepSrpSafeMessageIsDisplayed(): Promise<void> {
    await this.driver.waitForSelector(this.keepSrpSafeMessage);
  }

  async check_remindMeLaterButtonIsDisplayed(): Promise<void> {
    await this.driver.waitForSelector(this.remindMeLaterButton);
  }
}

export default OnboardingCompletePage;
