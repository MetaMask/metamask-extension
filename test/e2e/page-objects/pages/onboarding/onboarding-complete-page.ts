import { Driver } from '../../../webdriver/driver';

class OnboardingCompletePage {
  private driver: Driver;

  private readonly congratulationsMessage = {
    text: 'Congratulations!',
    tag: 'h2',
  };

  private readonly defaultPrivacySettingsButton = {
    text: 'Manage default privacy settings',
    tag: 'button',
  };

  private readonly installCompleteMessage = {
    text: 'Your MetaMask install is complete!',
    tag: 'h2',
  };

  private readonly onboardingCompleteDoneButton =
    '[data-testid="onboarding-complete-done"]';

  private readonly pinExtensionDoneButton =
    '[data-testid="pin-extension-done"]';

  private readonly pinExtensionMessage = {
    text: 'Click browser extension icon to access it instantly',
    tag: 'p',
  };

  private readonly pinExtensionNextButton =
    '[data-testid="pin-extension-next"]';

  private readonly walletReadyMessage = {
    text: 'Your wallet is ready',
    tag: 'h2',
  };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async check_pageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([
        this.defaultPrivacySettingsButton,
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

  async clickCreateWalletDoneButton(): Promise<void> {
    await this.driver.clickElementAndWaitToDisappear(
      this.onboardingCompleteDoneButton,
    );
  }

  async completeOnboarding(): Promise<void> {
    console.log('Complete onboarding');
    await this.clickCreateWalletDoneButton();
    await this.driver.waitForSelector(this.installCompleteMessage);
    await this.driver.clickElement(this.pinExtensionNextButton);

    // Wait until the onboarding carousel has stopped moving otherwise the click has no effect.
    await this.driver.waitForSelector(this.pinExtensionMessage);
    await this.driver.waitForElementToStopMoving(this.pinExtensionDoneButton);
    await this.driver.clickElementAndWaitToDisappear(
      this.pinExtensionDoneButton,
    );
  }

  async navigateToDefaultPrivacySettings(): Promise<void> {
    await this.driver.clickElementAndWaitToDisappear(
      this.defaultPrivacySettingsButton,
    );
  }

  async check_congratulationsMessageIsDisplayed(): Promise<void> {
    await this.driver.waitForSelector(this.congratulationsMessage);
  }

  async check_walletReadyMessageIsDisplayed(): Promise<void> {
    await this.driver.waitForSelector(this.walletReadyMessage);
  }
}

export default OnboardingCompletePage;
