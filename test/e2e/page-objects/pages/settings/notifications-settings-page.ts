import { toChecksumHexAddress } from '@metamask/controller-utils';
import { Driver } from '../../../webdriver/driver';
import { shortenAddress } from '../../../../../ui/helpers/utils/util';

class NotificationsSettingsPage {
  private driver: Driver;

  private readonly allowNotificationsToggle =
    '[data-testid="notifications-settings-allow-toggle-box"]';

  private readonly allowNotificationsInput =
    '[data-testid="notifications-settings-allow-toggle-input"]';

  private readonly allowNotificationsAddressToggle = (
    address: string,
    elementType: 'input' | 'box',
  ) => {
    const checksumAddress = toChecksumHexAddress(address.toLowerCase());
    return `[data-testid="${shortenAddress(
      checksumAddress,
    )}-notifications-settings-toggle-${elementType}"]`;
  };

  private readonly walletActivitySectionButton =
    '[data-testid="notifications-settings-section-walletActivity"]';

  private readonly marketingSectionButton =
    '[data-testid="notifications-settings-section-marketing"]';

  private readonly headerBackButton =
    '[data-testid="settings-header-back-button"]';

  private readonly walletActivitySectionContent =
    '[data-testid="notifications-settings-section-content-walletActivity"]';

  private readonly marketingSectionContent =
    '[data-testid="notifications-settings-section-content-marketing"]';

  private readonly marketingInAppNotificationsToggle =
    '[data-testid="marketing-in-app-notifications-toggle-box"]';

  private readonly marketingInAppNotificationsInput =
    '[data-testid="marketing-in-app-notifications-toggle-input"]';

  private readonly notificationsPerAccountSection =
    '[data-testid="notifications-settings-per-account"]';

  private readonly notificationsPerTypesSection =
    '[data-testid="notifications-settings-per-types"]';

  private readonly notificationToggleOff =
    '.toggle-button--off.notifications-settings-box__toggle';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkPageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([
        this.allowNotificationsToggle,
      ]);
    } catch (e) {
      console.log(
        'Timeout while waiting for notifications settings page to be loaded',
        e,
      );
      throw e;
    }
    console.log('Notifications Settings page is loaded');
  }

  async disableNotifications(): Promise<void> {
    console.log('Clicking on the disable notifications toggle');
    await this.driver.clickElement(this.allowNotificationsToggle);
    await this.driver.waitForSelector(this.notificationToggleOff);
  }

  async checkNotificationSectionIsHidden(): Promise<void> {
    console.log('Checking if notifications section is hidden');
    const selectors = [
      this.notificationsPerAccountSection,
      this.notificationsPerTypesSection,
      this.walletActivitySectionButton,
      this.marketingSectionButton,
    ];
    try {
      for (const selector of selectors) {
        await this.driver.assertElementNotPresent(selector);
      }
      console.log('All notification sections are hidden');
    } catch (error) {
      console.error(
        'An error occurred while checking notification sections:',
        error,
      );
      throw error;
    }
  }

  private async goToMainSettings(): Promise<void> {
    if (await this.driver.isElementPresent(this.walletActivitySectionContent)) {
      await this.driver.clickElement(this.headerBackButton);
      await this.driver.waitForSelector(this.notificationsPerTypesSection);
    }

    if (await this.driver.isElementPresent(this.marketingSectionContent)) {
      await this.driver.clickElement(this.headerBackButton);
      await this.driver.waitForSelector(this.notificationsPerTypesSection);
    }
  }

  private async goToNotificationSection(
    section: 'walletActivity' | 'marketing',
  ): Promise<void> {
    const sectionContent =
      section === 'walletActivity'
        ? this.walletActivitySectionContent
        : this.marketingSectionContent;

    if (await this.driver.isElementPresent(sectionContent)) {
      return;
    }

    await this.goToMainSettings();

    const sectionButton =
      section === 'walletActivity'
        ? this.walletActivitySectionButton
        : this.marketingSectionButton;

    await this.driver.waitForElementToStopMoving(sectionButton);
    await this.driver.clickElement(sectionButton);
    await this.driver.waitForSelector(sectionContent);
  }

  /**
   * Validates the state of any notification toggle.
   *
   * @param options - Configuration object
   * @param options.toggleType - The type of toggle to check ('general' | 'product' | 'address')
   * @param options.address - The ethereum address (required only when toggleType is 'address')
   * @param options.expectedState - The expected state of the toggle ('enabled' or 'disabled')
   * @throws {Error} If toggle state doesn't match expected state or if the toggle element cannot be found
   */
  async checkNotificationState({
    toggleType,
    address,
    expectedState,
  }: {
    toggleType: 'general' | 'product' | 'address';
    address?: string;
    expectedState: 'enabled' | 'disabled';
  }): Promise<void> {
    let selector: string;
    const description =
      toggleType === 'address' ? `for address ${address}` : '';

    switch (toggleType) {
      case 'general':
        await this.goToMainSettings();
        selector = this.allowNotificationsInput;
        break;
      case 'product':
        await this.goToNotificationSection('marketing');
        selector = this.marketingInAppNotificationsInput;
        break;
      case 'address':
        if (!address) {
          throw new Error(
            'Address is required when checking address notifications',
          );
        }
        await this.goToNotificationSection('walletActivity');
        selector = this.allowNotificationsAddressToggle(address, 'input');
        break;
      default:
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31893
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        throw new Error(`Invalid toggle type: ${toggleType}`);
    }

    console.log(
      `Checking if ${toggleType} notifications ${description} are ${expectedState}`,
    );
    const expectedValue = expectedState === 'enabled' ? 'true' : 'false';

    const maxRetries = 5;
    const retryInterval = 1000; // 1 second
    let attempts = 0;

    try {
      await this.driver.waitForElementToStopMoving(selector);
      while (attempts < maxRetries) {
        const toggle = await this.driver.findElement(selector);
        if ((await toggle.getAttribute('value')) === expectedValue) {
          console.log(
            `Successfully verified ${toggleType} notifications ${description} to be ${expectedState}`,
          );
          return;
        }
        attempts += 1;
        await new Promise((resolve) => setTimeout(resolve, retryInterval));
      }
      throw new Error(
        `Expected ${toggleType} notifications ${description} state to be: ${expectedState}`,
      );
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(
          `Failed to verify ${toggleType} notifications ${description} state: ${error.message}`,
        );
      }
      throw error;
    }
  }

  /**
   * Clicks a notification toggle and verifies its new state.
   *
   * @param options - Configuration object
   * @param options.toggleType - The type of toggle to click ('general' | 'product' | 'address')
   * @param options.address - The ethereum address (required only when toggleType is 'address')
   * @throws {Error} If toggle element cannot be found or if address is missing when required
   */
  async clickNotificationToggle({
    toggleType,
    address,
  }: {
    toggleType: 'general' | 'product' | 'address';
    address?: string;
  }): Promise<void> {
    let selector: string;

    switch (toggleType) {
      case 'general':
        await this.goToMainSettings();
        selector = this.allowNotificationsToggle;
        console.log('Clicking general notifications toggle');
        break;
      case 'product':
        await this.goToNotificationSection('marketing');
        selector = this.marketingInAppNotificationsToggle;
        console.log('Clicking marketing in-app notifications toggle');
        break;
      case 'address':
        if (!address) {
          throw new Error(
            'Address is required when toggling address notifications',
          );
        }
        await this.goToNotificationSection('walletActivity');
        selector = this.allowNotificationsAddressToggle(address, 'box');
        console.log(`Clicking notifications toggle for address ${address}`);
        break;
      default:
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31893
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        throw new Error(`Invalid toggle type: ${toggleType}`);
    }

    try {
      await this.driver.waitForElementToStopMoving(selector);
      await this.driver.clickElement(selector);
      await this.driver.waitForElementToStopMoving(selector);
      console.log(`Successfully clicked ${toggleType} notifications toggle`);
    } catch (error) {
      console.error(`Error clicking ${toggleType} notifications toggle`, error);
      throw error;
    }
  }

  async assertMainNotificationSettingsTogglesEnabled(
    driver: Driver,
    {
      productExpectedState = 'enabled',
    }: { productExpectedState?: 'enabled' | 'disabled' } = {},
  ) {
    const notificationsSettingsPage = new NotificationsSettingsPage(driver);
    await notificationsSettingsPage.checkPageIsLoaded();
    await notificationsSettingsPage.checkNotificationState({
      toggleType: 'general',
      expectedState: 'enabled',
    });
    await notificationsSettingsPage.checkNotificationState({
      toggleType: 'product',
      expectedState: productExpectedState,
    });
    return notificationsSettingsPage;
  }
}

export default NotificationsSettingsPage;
