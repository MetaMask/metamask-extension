import { Driver } from '../../../webdriver/driver';

/**
 * Wallet-ready / completion step at the end of onboarding (and optional
 * download-app continue).
 *
 * Screen: `#/onboarding/completion`; also covers continuing past
 * `#/onboarding/download-app` when that step is shown.
 * Owns: wallet-ready / keep-SRP-safe messaging, Done, manage default
 * settings entry, and download-app continue.
 * Boundaries: completion CTAs only. Default privacy settings are
 * `OnboardingPrivacySettingsPage` after `navigateToDefaultPrivacySettings`.
 * Related: preceded by `OnboardingMetricsPage` (or earlier steps on Firefox);
 * optional detour to `OnboardingPrivacySettingsPage`; then home via Done;
 * `flows/onboarding.flow.ts`.
 *
 * @see ui/pages/onboarding-flow/creation-successful/creation-successful.tsx
 * @see ui/pages/onboarding-flow/download-app/download-app.tsx
 */
class OnboardingCompletePage {
  private readonly downloadAppContinueButton =
    '[data-testid="download-app-continue"]';

  private readonly downloadAppTitle = {
    text: 'Scan QR code and download the app',
    tag: 'h2',
  };

  private driver: Driver;

  private readonly keepSrpSafeMessage = {
    text: 'Keep your Secret Recovery Phrase safe!',
    tag: 'h2',
  };

  private readonly manageDefaultSettingsButton =
    '[data-testid="manage-default-settings"]';

  private readonly onboardingCompleteDoneButton =
    '[data-testid="onboarding-complete-done"]';

  private readonly page = '[data-testid="parent-selector-onboarding-complete"]';

  private readonly remindMeLaterButton = {
    text: 'We’ll remind you later',
    tag: 'h2',
  };

  private readonly walletReadyMessage = {
    text: 'Your wallet is ready!',
  };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkKeepSrpSafeMessageIsDisplayed(): Promise<void> {
    await this.driver.waitForSelector(this.keepSrpSafeMessage);
  }

  async checkPageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([
        this.page,
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
        this.page,
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

  async checkRemindMeLaterButtonIsDisplayed(): Promise<void> {
    await this.driver.waitForSelector(this.remindMeLaterButton);
  }

  async checkWalletReadyMessageIsDisplayed(): Promise<void> {
    await this.driver.waitForSelector(this.walletReadyMessage);
  }

  async clickCreateWalletDoneButton(): Promise<void> {
    // With sidepanel enabled, clicking done opens a new window instead of
    // navigating in the current window, so the button doesn't "disappear"
    // We just click it without waiting for it to disappear
    await this.driver.clickElement(this.onboardingCompleteDoneButton);
  }

  async completeBackup(): Promise<void> {
    console.log('Complete backup');
    await this.clickCreateWalletDoneButton();
  }

  async completeOnboarding(): Promise<void> {
    console.log('Complete onboarding');
    await this.clickCreateWalletDoneButton();
  }

  async displayDownloadAppPageAndContinue(): Promise<void> {
    await this.driver.waitForSelector(this.downloadAppTitle);
    await this.driver.clickElementAndWaitToDisappear(
      this.downloadAppContinueButton,
    );
  }

  async navigateToDefaultPrivacySettings(): Promise<void> {
    await this.driver.clickElementAndWaitToDisappear(
      this.manageDefaultSettingsButton,
    );
  }
}

export default OnboardingCompletePage;
