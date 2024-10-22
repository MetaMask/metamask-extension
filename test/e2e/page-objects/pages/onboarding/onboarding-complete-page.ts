import { Driver } from '../../../webdriver/driver';

class OnboardingCompletePage {
  private driver: Driver;

  private readonly walletReadyMessage = {
    tag: 'h2',
    text: "Your wallet is ready",
  };

  private readonly onboardingCompleteDoneButton = '[data-testid="onboarding-complete-done"]';
  private readonly pinExtensionNextButton = '[data-testid="pin-extension-next"]';
  private readonly pinExtensionDoneButton = '[data-testid="pin-extension-done"]';

  private readonly pinExtensionMessage = {
    text: 'Click browser extension icon to access it instantly',
    tag: 'p',
  }

  private readonly defaultPrivacySettingsButton = {
    text: 'Manage default privacy settings',
    tag: 'button',
  }

  private readonly installCompleteMessage = {
    text: 'Your MetaMask install is complete!',
    tag: 'h2',
  }

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async check_pageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([
        this.walletReadyMessage,
        this.onboardingCompleteDoneButton,
      ]);
    } catch (e) {
      console.log('Timeout while waiting for onboarding wallet creation complete page to be loaded', e);
      throw e;
    }
    console.log('Onboarding wallet creation complete page is loaded');
  }

  async clickCreateWalletDoneButton(): Promise<void> {
    await this.driver.clickElementAndWaitToDisappear(this.onboardingCompleteDoneButton);
  }

  async navigateToDefaultPrivacySettings(): Promise<void> {
    await this.driver.clickElementAndWaitToDisappear(this.defaultPrivacySettingsButton);
  }

  async completeOnboarding(): Promise<void> {
    await this.clickCreateWalletDoneButton();
    await this.driver.waitForSelector(this.installCompleteMessage);
    await this.driver.clickElement(this.pinExtensionNextButton);

    // Wait until the onboarding carousel has stopped moving otherwise the click has no effect.
    await this.driver.waitForSelector(this.pinExtensionMessage);
    await this.driver.waitForElementToStopMoving(this.pinExtensionDoneButton);
    await this.driver.clickElementAndWaitToDisappear(this.pinExtensionDoneButton);
  }
}

export default OnboardingCompletePage;
