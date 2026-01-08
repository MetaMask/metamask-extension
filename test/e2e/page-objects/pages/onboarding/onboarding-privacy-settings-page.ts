import { Driver } from '../../../webdriver/driver';

class OnboardingPrivacySettingsPage {
  private driver: Driver;

  private readonly assetsSettings = '[data-testid="category-item-Assets"]';

  private readonly categoryBackButton = '[data-testid="category-back-button"]';

  private readonly generalSettings = '[data-testid="category-item-General"]';

  private readonly privacySettingsBackButton =
    '[data-testid="privacy-settings-back-button"]';

  private readonly securitySettings = '[data-testid="category-item-Security"]';

  // General settings
  private readonly basicFunctionalityCheckbox =
    '[id="basic-configuration-checkbox"]';

  private readonly basicFunctionalityToggle =
    '[data-testid="basic-functionality-toggle"] .toggle-button';

  private readonly basicFunctionalityTurnOffButton = {
    text: 'Turn off',
    tag: 'button',
  };

  private readonly basicFunctionalityTurnOffMessage = {
    text: 'Turn off basic functionality',
    tag: 'h4',
  };

  private readonly generalSettingsMessage = { text: 'General', tag: 'h2' };

  // General settings - add custom network section
  private readonly addCustomNetworkButton = {
    text: 'Add a network',
    tag: 'p',
  };

  private readonly addCustomNetworkFormMessage = {
    text: 'Add a custom network',
    tag: 'h4',
  };

  private readonly addRpcUrlButton = {
    text: 'Add RPC URL',
    tag: 'button',
  };

  private readonly addRpcUrlDialogMessage = {
    text: 'Add RPC URL',
    tag: 'h4',
  };

  private readonly addRpcUrlDropDown = '[data-testid="test-add-rpc-drop-down"]';

  private readonly chainIdInput = '[data-testid="network-form-chain-id"]';

  private readonly confirmAddCustomNetworkButton = {
    text: 'Save',
    tag: 'button',
  };

  private readonly confirmAddRpcUrlButton = {
    text: 'Add URL',
    tag: 'button',
  };

  private readonly currencySymbolInput =
    '[data-testid="network-form-ticker-input"]';

  private readonly networkNameInput =
    '[data-testid="network-form-network-name"]';

  private readonly rpcUrlInput = '[data-testid="rpc-url-input-test"]';

  // Assets settings
  private readonly assetsPrivacyToggle = '.toggle-button.toggle-button--on';

  private readonly assetsSettingsMessage = { text: 'Assets', tag: 'h2' };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkPageIsLoaded(): Promise<void> {
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
   * Adds a custom network to MetaMask during the onboarding process.
   *
   * @param networkName - The name of the custom network.
   * @param chainId - The chain ID of the custom network.
   * @param currencySymbol - The currency symbol for the custom network.
   * @param networkUrl - The RPC URL for the custom network.
   * @returns A promise that resolves when the custom network has been added.
   */
  async addCustomNetwork(
    networkName: string,
    chainId: number,
    currencySymbol: string,
    networkUrl: string,
  ): Promise<void> {
    await this.navigateToGeneralSettings();
    console.log('Adding custom network');
    await this.driver.clickElement(this.addCustomNetworkButton);
    await this.driver.waitForSelector(this.addCustomNetworkFormMessage);
    await this.driver.fill(this.networkNameInput, networkName);
    await this.driver.fill(this.chainIdInput, chainId.toString());
    await this.driver.fill(this.currencySymbolInput, currencySymbol);
    // Add rpc url
    await this.driver.clickElement(this.addRpcUrlDropDown);
    await this.driver.clickElement(this.addRpcUrlButton);
    await this.driver.waitForSelector(this.addRpcUrlDialogMessage);
    await this.driver.fill(this.rpcUrlInput, networkUrl);
    await this.driver.clickElement(this.confirmAddRpcUrlButton);
    await this.driver.clickElementAndWaitToDisappear(
      this.confirmAddCustomNetworkButton,
    );
    // Navigate back to default privacy settings
    await this.navigateBackToSettingsPage();
  }

  /**
   * Navigate back to the onboarding complete page.
   */
  async navigateBackToOnboardingCompletePage(): Promise<void> {
    console.log('Navigate back to onboarding complete page');
    // Wait until the onboarding carousel has stopped moving otherwise the click has no effect.
    await this.driver.waitForElementToStopMoving(
      this.privacySettingsBackButton,
    );
    await this.driver.clickElementAndWaitToDisappear(
      this.privacySettingsBackButton,
    );
  }

  /**
   * Navigate back to the onboarding privacy settings page.
   */
  async navigateBackToSettingsPage(): Promise<void> {
    console.log('Navigate back to onboarding privacy settings page');
    // Wait until the onboarding carousel has stopped moving otherwise the click has no effect.
    await this.driver.clickElement(this.categoryBackButton);
    await this.driver.waitForElementToStopMoving(this.categoryBackButton);
  }

  async navigateToGeneralSettings(): Promise<void> {
    console.log('Navigate to general settings');
    await this.checkPageIsLoaded();
    await this.driver.clickElement(this.generalSettings);
    await this.driver.waitForSelector(this.generalSettingsMessage);
  }

  /**
   * Open the edit network modal for a given network name.
   *
   * @param networkName - The name of the network to open the edit modal for.
   */
  async openEditNetworkModal(networkName: string): Promise<void> {
    console.log(`Open edit network modal for ${networkName}`);
    await this.driver.clickElement({ text: networkName, tag: 'p' });
    await this.driver.waitForSelector(this.addRpcUrlDropDown);
  }

  /**
   * Go to assets settings and toggle options, then navigate back.
   */
  async toggleAssetsSettings(): Promise<void> {
    console.log('Toggle advanced assets settings in privacy settings');
    await this.checkPageIsLoaded();
    await this.driver.clickElement(this.assetsSettings);
    await this.driver.waitForSelector(this.assetsSettingsMessage);
    await Promise.all(
      (await this.driver.findClickableElements(this.assetsPrivacyToggle)).map(
        (toggle) => toggle.click(),
      ),
    );
    await this.navigateBackToSettingsPage();
  }

  /**
   * Go to general settings and toggle options, then navigate back.
   */
  async toggleBasicFunctionalitySettings(): Promise<void> {
    console.log('Toggle basic functionality settings in privacy settings');
    await this.navigateToGeneralSettings();
    await this.driver.clickElement(this.basicFunctionalityToggle);
    await this.driver.waitForSelector(this.basicFunctionalityTurnOffMessage);
    await this.driver.clickElement(this.basicFunctionalityCheckbox);
    await this.driver.clickElement(this.basicFunctionalityTurnOffButton);
    await this.navigateBackToSettingsPage();
  }
}

export default OnboardingPrivacySettingsPage;
