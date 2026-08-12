import { Driver } from '../../webdriver/driver';
import HeaderNavbar from '../pages/header-navbar';
import NotificationsListPage from '../pages/notifications-list-page';
import NotificationsSettingsPage from '../pages/settings/notifications-settings-page';
import SettingsPage from '../pages/settings/settings-page';
import NotificationDetailsPage from '../pages/notification-details-page';

/**
 * Enables general notifications from the notifications settings page and waits for
 * the preference sections to load. Assumes the notifications settings page is open.
 *
 * @param driver - The webdriver instance used to interact with the browser.
 */
const enableGeneralNotifications = async (driver: Driver): Promise<void> => {
  const notificationsSettingsPage = new NotificationsSettingsPage(driver);
  await notificationsSettingsPage.checkPageIsLoaded();
  await notificationsSettingsPage.clickNotificationToggle({
    toggleType: 'general',
  });
  await notificationsSettingsPage.waitForNotificationPreferenceSections();
};

/**
 * Enables notifications through the notifications page (global menu > notifications
 * bell > settings gear). Assumes notifications are currently disabled and leaves the
 * notifications settings page open.
 *
 * @param driver - The webdriver instance used to interact with the browser.
 */
export const enableNotifications = async (driver: Driver): Promise<void> => {
  console.log('Enabling notifications from the notifications page');
  const headerNavbar = new HeaderNavbar(driver);
  const notificationsListPage = new NotificationsListPage(driver);

  await headerNavbar.navigateToNotificationsPage();
  await notificationsListPage.goToNotificationsSettings();
  await enableGeneralNotifications(driver);
};

/**
 * Enables notifications through the global menu.
 *
 * @param driver - The webdriver instance used to interact with the browser.
 * @param goToNotificationsList - When true, navigates to the notifications list after enabling. Defaults to staying on notifications settings.
 * @returns A promise that resolves when the operation is complete.
 */
export const enableNotificationsThroughGlobalMenu = async (
  driver: Driver,
  goToNotificationsList: boolean = false,
): Promise<void> => {
  console.log('Enabling notifications through global menu');
  const headerNavbar = new HeaderNavbar(driver);
  const notificationsListPage = new NotificationsListPage(driver);
  const notificationsSettingsPage = new NotificationsSettingsPage(driver);

  await headerNavbar.checkPageIsLoaded();
  await enableNotifications(driver);

  if (goToNotificationsList) {
    await headerNavbar.goToNotifications();
    await notificationsListPage.checkPageIsLoaded();
    return;
  }

  await notificationsSettingsPage.checkPageIsLoaded();
};

/**
 * Navigates to the notification settings page and disables notifications.
 *
 * @param driver - The WebDriver instance used to interact with the browser.
 * @returns A promise that resolves when the notifications are successfully disabled.
 */
export const navigateToNotificationSettingsAndClickDisable = async (
  driver: Driver,
): Promise<void> => {
  const notificationsListPage = new NotificationsListPage(driver);
  await notificationsListPage.checkPageIsLoaded();
  await notificationsListPage.goToNotificationsSettings();
  await new NotificationsSettingsPage(driver).disableNotifications();
};
/**
 * Navigates to the notifications settings page via the global menu (Settings >
 * Notifications). Use when notifications are already enabled.
 *
 * @param driver - The webdriver instance used to interact with the browser.
 */
export const goToNotificationsSettingsPage = async (
  driver: Driver,
): Promise<void> => {
  const headerNavbar = new HeaderNavbar(driver);
  await headerNavbar.checkPageIsLoaded();
  await headerNavbar.openSettingsPage();

  const settingsPage = new SettingsPage(driver);
  await settingsPage.checkPageIsLoaded();
  await settingsPage.goToNotificationsSettings();

  await new NotificationsSettingsPage(driver).checkPageIsLoaded();
};

/**
 * Navigates to the notifications list via the global menu. Use when
 * notifications are already enabled.
 *
 * @param driver - The webdriver instance used to interact with the browser.
 */
export const goToNotificationsList = async (driver: Driver): Promise<void> => {
  const headerNavbar = new HeaderNavbar(driver);
  await headerNavbar.checkPageIsLoaded();
  await headerNavbar.goToNotifications();
  await new NotificationsListPage(driver).checkPageIsLoaded();
};

/**
 * Navigate to notifications settings through global menu > settings >
 * notifications settings, then enable notifications.
 *
 * @param driver
 */
export const enableNotificationsThroughSettingsPage = async (
  driver: Driver,
) => {
  console.log('Enabling notifications through Settings Page');
  await goToNotificationsSettingsPage(driver);
  await enableGeneralNotifications(driver);
};

/**
 * Click each notification item by the dynamicGeneratedTestId and validate the details page appears
 *
 * @param driver
 * @param dynamicGeneratedTestId
 */
export async function clickNotificationItemAndDetailsPage(
  driver: Driver,
  dynamicGeneratedTestId: string,
) {
  const notificationsListPage = new NotificationsListPage(driver);
  const notificationDetailsPage = new NotificationDetailsPage(driver);

  await notificationsListPage.checkPageIsLoaded();
  await notificationsListPage.checkNotificationItemByTestId(
    dynamicGeneratedTestId,
  );
  await notificationsListPage.clickNotificationItemByTestId(
    dynamicGeneratedTestId,
  );

  // inspect and click notification details
  await notificationDetailsPage.checkPageIsLoaded();
  await notificationDetailsPage.clickBackButton();
}
