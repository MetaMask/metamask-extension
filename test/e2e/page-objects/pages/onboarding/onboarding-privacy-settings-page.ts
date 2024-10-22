import { Driver } from '../../../webdriver/driver';

class OnboardingPrivacySettingsPage {
  private driver: Driver;

  private readonly generalSettings = '[data-testid="category-item-General"]';

  private readonly assetsSettings = '[data-testid="category-item-Assets"]';

  private readonly securitySettings = '[data-testid="category-item-Security"]';

  private readonly privacySettingsBackButton =
    '[data-testid="privacy-settings-back-button"]';

  private readonly categoryBackButton = '[data-testid="category-back-button"]';

  // General settings
  private readonly generalSettingsMessage = { text: 'General', tag: 'h2' };

  private readonly basicFunctionalityToggle =
    '[data-testid="basic-functionality-toggle"] .toggle-button';

  private readonly basicFunctionalityCheckbox =
    '[id="basic-configuration-checkbox"]';

  private readonly basicFunctionalityTurnOffButton = {
    text: 'Turn off',
    tag: 'button',
  };

  private readonly basicFunctionalityTurnOffMessage = {
    text: 'Turn off basic functionality',
    tag: 'h4',
  };

  // Assets settings
  private readonly assetsSettingsMessage = { text: 'Assets', tag: 'h2' };

  private readonly assetsPrivacyToggle = '.toggle-button.toggle-button--on';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async check_pageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([
        this.generalSettings,
        this.assetsSettings,
        this.securitySettings,
      ]);
    } catch (e) {
      console.log(
        'Timeout while waiting for onboarding privacy settings page to be loaded',
        e,
      );
      throw e;
    }
    console.log('Onboarding privacy settings page is loaded');
  }

  /**
   * Go to general settings and toggle options, then navigate back.
   */
  async toggleBasicFunctionalitySettings(): Promise<void> {
    await this.check_pageIsLoaded();
    await this.driver.clickElement(this.generalSettings);
    await this.driver.waitForSelector(this.generalSettingsMessage);
    await this.driver.clickElement(this.basicFunctionalityToggle);
    await this.driver.waitForSelector(this.basicFunctionalityTurnOffMessage);
    await this.driver.clickElement(this.basicFunctionalityCheckbox);
    await this.driver.clickElement(this.basicFunctionalityTurnOffButton);
    await this.driver.clickElement(this.categoryBackButton);
  }

  /**
   * Go to assets settings and toggle options, then navigate back.
   */
  async toggleAssetsSettings(): Promise<void> {
    await this.check_pageIsLoaded();
    await this.driver.clickElement(this.assetsSettings);
    await this.driver.waitForSelector(this.assetsSettingsMessage);
    await Promise.all(
      (
        await this.driver.findClickableElements(this.assetsPrivacyToggle)
      ).map((toggle) => toggle.click()),
    );
    await this.driver.clickElement(this.categoryBackButton);
  }

  /**
   * Navigate back to the onboarding complete page.
   */
  async navigateBackToOnboardingCompletePage(): Promise<void> {
    // Wait until the onboarding carousel has stopped moving otherwise the click has no effect.
    await this.driver.waitForElementToStopMoving(
      this.privacySettingsBackButton,
    );
    await this.driver.clickElementAndWaitToDisappear(
      this.privacySettingsBackButton,
    );
  }
}

export default OnboardingPrivacySettingsPage;
