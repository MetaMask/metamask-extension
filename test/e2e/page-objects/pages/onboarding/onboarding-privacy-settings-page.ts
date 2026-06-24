import { Driver } from '../../../webdriver/driver';

class OnboardingPrivacySettingsPage {
  private driver: Driver;

  private readonly privacySettingsLanding =
    '[data-testid="privacy-settings-landing"]';

  private readonly privacySettingsItem =
    '[data-testid="onboarding-privacy-settings-item-privacy"]';

  private readonly backupAndSyncSettingsItem =
    '[data-testid="onboarding-privacy-settings-item-backup-and-sync"]';

  private readonly networkRpcSettingsItem =
    '[data-testid="onboarding-privacy-settings-item-network-rpc"]';

  private readonly privacySettingsBackButton =
    '[data-testid="privacy-settings-back-button"]';

  private readonly subPageBackButton =
    '[data-testid="privacy-settings-sub-page-back-button"]';

  private readonly privacySettingsDetail =
    '[data-testid="privacy-settings-settings"]';

  private readonly privacySettingsNetworkRpc =
    '[data-testid="privacy-settings-network-rpc"]';

  // Privacy subpage
  private readonly basicFunctionalityCheckbox =
    '[data-testid="basic-configuration-checkbox"]';

  private readonly basicFunctionalityToggle =
    '[data-testid="basic-functionality-toggle-container"] .toggle-button';

  private readonly basicFunctionalityToggleOffState =
    '[data-testid="basic-functionality-toggle-container"] .toggle-button.toggle-button--off';

  private readonly basicFunctionalityTurnOffButton =
    '[data-testid="basic-configuration-modal-toggle-button"]';

  private readonly basicFunctionalityTurnOffMessage = {
    text: 'Turn off basic functionality',
    tag: 'h4',
  };

  // Network RPC subpage
  private readonly addCustomNetworkButton =
    '[data-testid="onboarding-network-rpc-add-custom-network-button"]';

  private readonly addRpcUrlButton = {
    text: 'Add RPC URL',
    tag: 'button',
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

  // Matches ONBOARDING_PRIVACY_ITEMS in onboarding-privacy-sub-page.tsx (basic excluded).
  private readonly advancedPrivacyToggleContainerTestIds = [
    'batch-account-balance-requests-toggle-container',
    'useSafeChainsListValidation',
    'ipfs-gateway-resolution-container',
    'make-smart-contracts-easier-toggle-container',
    'ipfsToggle',
    'display-nft-media-toggle-container',
    'use-nft-detection',
    'proposed-nicknames-toggle-container',
  ] as const;

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkPageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([
        this.privacySettingsLanding,
        this.privacySettingsItem,
        this.backupAndSyncSettingsItem,
        this.networkRpcSettingsItem,
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
    await this.navigateToNetworkRpcSettings();
    console.log('Adding custom network');
    await this.driver.clickElement(this.addCustomNetworkButton);
    await this.driver.waitForMultipleSelectors([
      this.networkNameInput,
      this.chainIdInput,
      this.addRpcUrlDropDown,
    ]);
    await this.driver.fill(this.networkNameInput, networkName);
    await this.driver.fill(this.chainIdInput, chainId.toString());
    await this.driver.fill(this.currencySymbolInput, currencySymbol);
    // Add rpc url
    await this.driver.clickElement(this.addRpcUrlDropDown);
    await this.driver.clickElement(this.addRpcUrlButton);
    await this.driver.waitForSelector(this.rpcUrlInput);
    await this.driver.fill(this.rpcUrlInput, networkUrl);
    await this.driver.clickElement(this.confirmAddRpcUrlButton);
    await this.driver.clickElementAndWaitToDisappear(
      this.confirmAddCustomNetworkButton,
    );
    // Navigate back to the onboarding privacy landing page
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
    await this.driver.waitForElementToStopMoving(this.subPageBackButton);
    await this.driver.clickElement(this.subPageBackButton);
    await this.checkPageIsLoaded();
  }

  async navigateToPrivacySettings(): Promise<void> {
    console.log('Navigate to privacy settings');
    await this.checkPageIsLoaded();
    await this.driver.clickElement(this.privacySettingsItem);
    await this.driver.waitForMultipleSelectors([
      this.privacySettingsDetail,
      this.subPageBackButton,
    ]);
  }

  async navigateToNetworkRpcSettings(): Promise<void> {
    console.log('Navigate to network RPC settings');
    await this.checkPageIsLoaded();
    await this.driver.clickElement(this.networkRpcSettingsItem);
    await this.driver.waitForMultipleSelectors([
      this.privacySettingsDetail,
      this.privacySettingsNetworkRpc,
      this.subPageBackButton,
    ]);
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
   * Go to the privacy subpage, turn off the advanced privacy toggles, then navigate back.
   */
  async toggleAdvancedPrivacySettings(): Promise<void> {
    console.log('Toggle advanced privacy settings');
    await this.navigateToPrivacySettings();

    for (const containerTestId of this.advancedPrivacyToggleContainerTestIds) {
      await this.turnOffPrivacyToggleIfOn(containerTestId);
    }

    await this.assertAdvancedPrivacyTogglesAreOff();

    await this.navigateBackToSettingsPage();
  }

  private async assertAdvancedPrivacyTogglesAreOff(): Promise<void> {
    console.log('Verify all advanced privacy toggles are off');
    for (const containerTestId of this.advancedPrivacyToggleContainerTestIds) {
      const toggleButton = this.getPrivacyToggleButtonSelector(containerTestId);
      await this.driver.waitForSelector(
        this.getPrivacyToggleOffSelector(toggleButton),
      );
    }
  }

  private async isPrivacyToggleOn(containerTestId: string): Promise<boolean> {
    const toggleButton = this.getPrivacyToggleButtonSelector(containerTestId);
    return this.driver.isElementPresentAndVisible(
      this.getPrivacyToggleOnSelector(toggleButton),
      500,
    );
  }

  private async turnOffPrivacyToggleIfOn(
    containerTestId: string,
  ): Promise<void> {
    const toggleButton = this.getPrivacyToggleButtonSelector(containerTestId);
    if (!(await this.isPrivacyToggleOn(containerTestId))) {
      return;
    }

    await this.driver.findScrollToAndClickElement(toggleButton);
    await this.driver.waitForSelector(
      this.getPrivacyToggleOffSelector(toggleButton),
    );
  }

  /**
   * Go to the privacy subpage, turn off basic functionality, then navigate back.
   */
  async toggleBasicFunctionality(): Promise<void> {
    console.log('Toggle basic functionality');
    await this.navigateToPrivacySettings();
    await this.driver.waitForSelector(this.basicFunctionalityToggle);
    await this.driver.clickElement(this.basicFunctionalityToggle);
    await this.driver.waitForSelector(this.basicFunctionalityTurnOffMessage);
    await this.driver.clickElement(this.basicFunctionalityCheckbox);
    await this.driver.clickElement(this.basicFunctionalityTurnOffButton);

    console.log('Verify basic functionality toggle is off');
    await this.driver.waitForSelector(this.basicFunctionalityToggleOffState);

    await this.navigateBackToSettingsPage();
  }

  private getPrivacyToggleButtonSelector(containerTestId: string): string {
    return `${this.privacySettingsDetail} [data-testid="${containerTestId}"] .toggle-button`;
  }

  private getPrivacyToggleOnSelector(toggleButton: string): string {
    return `${toggleButton}.toggle-button--on:not(.toggle-button--disabled)`;
  }

  private getPrivacyToggleOffSelector(toggleButton: string): string {
    return `${toggleButton}.toggle-button--off`;
  }
}

export default OnboardingPrivacySettingsPage;
