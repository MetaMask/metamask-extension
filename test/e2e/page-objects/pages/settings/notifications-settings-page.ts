import { toChecksumHexAddress } from '@metamask/controller-utils';
import { Driver } from '../../../webdriver/driver';
import { shortenAddress } from '../../../../../ui/helpers/utils/util';

export type NotificationPreferenceSection =
  | 'walletActivity'
  | 'tradingActivity'
  | 'tradingSignals'
  | 'updatesAndRewards'
  | 'agenticCli';

const NOTIFICATION_PREFERENCE_SECTIONS: NotificationPreferenceSection[] = [
  'walletActivity',
  'tradingActivity',
  'tradingSignals',
  'updatesAndRewards',
  'agenticCli',
];

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

  private readonly sectionButton = (section: NotificationPreferenceSection) =>
    `[data-testid="notifications-settings-section-${section}"]`;

  private readonly sectionContent = (section: NotificationPreferenceSection) =>
    `[data-testid="notifications-settings-section-content-${section}"]`;

  private readonly sectionInAppNotificationsToggle = (
    section: Exclude<NotificationPreferenceSection, 'walletActivity'>,
  ) => `[data-testid="${section}-in-app-notifications-toggle-box"]`;

  private readonly sectionInAppNotificationsInput = (
    section: Exclude<NotificationPreferenceSection, 'walletActivity'>,
  ) => `[data-testid="${section}-in-app-notifications-toggle-input"]`;

  private readonly headerBackButton =
    '[data-testid="settings-header-back-button"]';

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
      ...NOTIFICATION_PREFERENCE_SECTIONS.map((section) =>
        this.sectionButton(section),
      ),
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

  private readonly shortPresenceTimeoutMs = 1000;

  /**
   * Waits for the notification preference section list to render. The section
   * rows appear as soon as notifications are enabled; note that selecting a row
   * only opens the section once the authenticated user storage preferences have
   * finished loading (otherwise the app redirects back to the list), which is
   * handled by `goToNotificationSection`.
   */
  async waitForNotificationPreferenceSections(): Promise<void> {
    console.log('Waiting for notification preference section list to render');
    await this.driver.waitForSelector(this.notificationsPerTypesSection, {
      timeout: 30000,
    });

    for (const section of NOTIFICATION_PREFERENCE_SECTIONS) {
      await this.driver.waitForSelector(this.sectionButton(section));
    }
    console.log('Notification preference section list is rendered');
  }

  private async goToMainSettings(): Promise<void> {
    for (const section of NOTIFICATION_PREFERENCE_SECTIONS) {
      if (
        await this.driver.isElementPresentAndVisible(
          this.sectionContent(section),
          this.shortPresenceTimeoutMs,
        )
      ) {
        await this.driver.clickElement(this.headerBackButton);
        await this.driver.waitForSelector(this.notificationsPerTypesSection);
        return;
      }
    }
  }

  private async goToNotificationSection(
    section: NotificationPreferenceSection,
  ): Promise<void> {
    if (
      await this.driver.isElementPresentAndVisible(
        this.sectionContent(section),
        this.shortPresenceTimeoutMs,
      )
    ) {
      return;
    }

    await this.goToMainSettings();
    await this.waitForNotificationPreferenceSections();

    // Section rows render as soon as notifications are enabled, but selecting
    // one only opens the section once the authenticated user storage
    // preferences have finished loading; until then the app redirects back to
    // the list. Retry the selection until the section content is shown.
    await this.driver.waitUntil(
      async () => {
        if (
          await this.driver.isElementPresentAndVisible(
            this.sectionContent(section),
            this.shortPresenceTimeoutMs,
          )
        ) {
          return true;
        }

        if (
          await this.driver.isElementPresentAndVisible(
            this.sectionButton(section),
            this.shortPresenceTimeoutMs,
          )
        ) {
          await this.driver.clickElement(this.sectionButton(section));
        }

        return this.driver.isElementPresentAndVisible(
          this.sectionContent(section),
          this.shortPresenceTimeoutMs,
        );
      },
      { interval: 500, timeout: this.driver.timeout },
    );
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
        await this.goToNotificationSection('updatesAndRewards');
        selector = this.sectionInAppNotificationsInput('updatesAndRewards');
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

    await this.assertToggleInputState({
      selector,
      description: `${toggleType} notifications ${description}`,
      expectedState,
    });
  }

  async getSectionInAppNotificationState(
    section: Exclude<NotificationPreferenceSection, 'walletActivity'>,
  ): Promise<'enabled' | 'disabled'> {
    await this.goToNotificationSection(section);
    const selector = this.sectionInAppNotificationsInput(section);
    await this.driver.waitForElementToStopMoving(selector);
    const toggle = await this.driver.findElement(selector);
    return (await toggle.getAttribute('value')) === 'true'
      ? 'enabled'
      : 'disabled';
  }

  async checkSectionInAppNotificationState({
    section,
    expectedState,
  }: {
    section: Exclude<NotificationPreferenceSection, 'walletActivity'>;
    expectedState: 'enabled' | 'disabled';
  }): Promise<void> {
    await this.goToNotificationSection(section);
    await this.assertToggleInputState({
      selector: this.sectionInAppNotificationsInput(section),
      description: `${section} in-app notifications`,
      expectedState,
    });
  }

  private async assertToggleInputState({
    selector,
    description,
    expectedState,
  }: {
    selector: string;
    description: string;
    expectedState: 'enabled' | 'disabled';
  }): Promise<void> {
    console.log(`Checking if ${description} are ${expectedState}`);
    const expectedValue = expectedState === 'enabled' ? 'true' : 'false';

    try {
      await this.driver.waitForElementToStopMoving(selector);
      await this.driver.waitUntil(
        async () => {
          const toggle = await this.driver.findElement(selector);
          return (await toggle.getAttribute('value')) === expectedValue;
        },
        { interval: 500, timeout: this.driver.timeout },
      );
      console.log(
        `Successfully verified ${description} to be ${expectedState}`,
      );
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(
          `Failed to verify ${description} state: ${error.message}`,
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
        await this.goToNotificationSection('updatesAndRewards');
        selector = this.sectionInAppNotificationsToggle('updatesAndRewards');
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

    await this.clickToggle(selector, `${toggleType} notifications toggle`);
  }

  async clickSectionInAppNotificationToggle(
    section: Exclude<NotificationPreferenceSection, 'walletActivity'>,
  ): Promise<void> {
    await this.goToNotificationSection(section);
    await this.clickToggle(
      this.sectionInAppNotificationsToggle(section),
      `${section} in-app notifications toggle`,
    );
  }

  private async clickToggle(selector: string, description: string) {
    try {
      await this.driver.waitForElementToStopMoving(selector);
      await this.driver.clickElement(selector);
      await this.driver.waitForElementToStopMoving(selector);
      console.log(`Successfully clicked ${description}`);
    } catch (error) {
      console.error(`Error clicking ${description}`, error);
      throw error;
    }
  }

  async assertMainNotificationSettingsTogglesState(
    driver: Driver,
    {
      generalExpectedState = 'enabled',
      marketingInAppExpectedState = 'enabled',
    }: {
      generalExpectedState?: 'enabled' | 'disabled';
      marketingInAppExpectedState?: 'enabled' | 'disabled';
    } = {},
  ) {
    const notificationsSettingsPage = new NotificationsSettingsPage(driver);
    await notificationsSettingsPage.checkPageIsLoaded();
    await notificationsSettingsPage.waitForNotificationPreferenceSections();
    await notificationsSettingsPage.checkNotificationState({
      toggleType: 'general',
      expectedState: generalExpectedState,
    });
    await notificationsSettingsPage.checkNotificationState({
      toggleType: 'product',
      expectedState: marketingInAppExpectedState,
    });
    return notificationsSettingsPage;
  }
}

export default NotificationsSettingsPage;
