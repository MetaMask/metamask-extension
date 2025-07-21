import { toChecksumHexAddress } from '@metamask/controller-utils';
import { Driver } from '../../../webdriver/driver';
import { shortenAddress } from '../../../../../ui/helpers/utils/util';

class NotificationsSettingsPage {
  private driver: Driver;

  private readonly notificationsSettingsPageTitle = {
    text: 'Notifications',
    tag: 'p',
  };

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

  private readonly allowProductAnnouncementToggle =
    '[data-testid="product-announcements-toggle-box"]';

  private readonly allowProductAnnouncementInput =
    '[data-testid="product-announcements-toggle-input"]';

  private readonly notificationsPerAccountSection =
    '[data-testid="notifications-settings-per-account"]';

  private readonly notificationsPerTypesSection =
    '[data-testid="notifications-settings-per-types"]';

  private readonly notificationToggleOff =
    '.toggle-button--off.notifications-settings-box__toggle';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  async check_pageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([
        this.notificationsSettingsPageTitle,
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

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  async check_notificationSectionIsHidden(): Promise<void> {
    console.log('Checking if notifications section is hidden');
    const selectors = [
      this.allowProductAnnouncementToggle,
      this.notificationsPerAccountSection,
      this.notificationsPerTypesSection,
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

  /**
   * Validates the state of any notification toggle.
   *
   * @param options - Configuration object
   * @param options.toggleType - The type of toggle to check ('general' | 'product' | 'address')
   * @param options.address - The ethereum address (required only when toggleType is 'address')
   * @param options.expectedState - The expected state of the toggle ('enabled' or 'disabled')
   * @throws {Error} If toggle state doesn't match expected state or if the toggle element cannot be found
   */
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  async check_notificationState({
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
        selector = this.allowNotificationsInput;
        break;
      case 'product':
        selector = this.allowProductAnnouncementInput;
        break;
      case 'address':
        if (!address) {
          throw new Error(
            'Address is required when checking address notifications',
          );
        }
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
        selector = this.allowNotificationsToggle;
        console.log('Clicking general notifications toggle');
        break;
      case 'product':
        selector = this.allowProductAnnouncementToggle;
        console.log('Clicking product announcement toggle');
        break;
      case 'address':
        if (!address) {
          throw new Error(
            'Address is required when toggling address notifications',
          );
        }
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

  async assertMainNotificationSettingsTogglesEnabled(driver: Driver) {
    const notificationsSettingsPage = new NotificationsSettingsPage(driver);
    await notificationsSettingsPage.check_pageIsLoaded();
    await notificationsSettingsPage.check_notificationState({
      toggleType: 'general',
      expectedState: 'enabled',
    });
    await notificationsSettingsPage.check_notificationState({
      toggleType: 'product',
      expectedState: 'enabled',
    });
    return notificationsSettingsPage;
  }
}

export default NotificationsSettingsPage;
