import { Driver } from '../../webdriver/driver';
import HeaderNavbar from '../pages/header-navbar';
import NotificationsListPage from '../pages/notifications-list-page';
import NotificationsSettingsPage from '../pages/settings/notifications-settings-page';
import SettingsPage from '../pages/settings/settings-page';
import NotificationDetailsPage from '../pages/notification-details-page';

/**
 * Enables notifications through the global menu and optionally navigates to the notifications settings.
 *
 * @param driver - The webdriver instance used to interact with the browser.
 * @param goToNotificationsSettings - Determines whether to navigate to the notifications settings page after enabling notifications.
 * @returns A promise that resolves when the operation is complete.
 */
export const enableNotificationsThroughGlobalMenu = async (
  driver: Driver,
  goToNotificationsSettings: boolean = true,
): Promise<void> => {
  console.log('Enabling notifications through global menu');
  const headerNavbar = new HeaderNavbar(driver);
  await headerNavbar.check_pageIsLoaded();
  await headerNavbar.enableNotifications();

  if (goToNotificationsSettings === true) {
    // Click to notifications gear icon
    const notificationsListPage = new NotificationsListPage(driver);
    await notificationsListPage.check_pageIsLoaded();
    await notificationsListPage.goToNotificationsSettings();
  }
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
  await notificationsListPage.check_pageIsLoaded();
  await notificationsListPage.goToNotificationsSettings();
  await new NotificationsSettingsPage(driver).disableNotifications();
};
/**
 * Navigate to notifications settings through global menu > settings > notifications settings
 *
 * @param driver
 */
export const enableNotificationsThroughSettingsPage = async (
  driver: Driver,
) => {
  console.log('Enabling notifications through Settings Page');
  const headerNavbar = new HeaderNavbar(driver);
  await headerNavbar.check_pageIsLoaded();
  await headerNavbar.openSettingsPage();

  const settingsPage = new SettingsPage(driver);
  await settingsPage.check_pageIsLoaded();
  await settingsPage.goToNotificationsSettings();

  const notificationsSettingsPage = new NotificationsSettingsPage(driver);
  await notificationsSettingsPage.check_pageIsLoaded();

  const isEnabled = await notificationsSettingsPage
    .check_notificationState({
      toggleType: 'general',
      expectedState: 'enabled',
    })
    .then(() => true)
    .catch(() => false);

  if (isEnabled) {
    console.log('Notifications are already enabled.');
  } else {
    console.log('Notifications are not enabled. Enabling now.');
    await notificationsSettingsPage.clickNotificationToggle({
      toggleType: 'general',
    });
  }
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

  await notificationsListPage.check_pageIsLoaded();
  await notificationsListPage.check_notificationItemByTestId(
    dynamicGeneratedTestId,
  );
  await notificationsListPage.clickNotificationItemByTestId(
    dynamicGeneratedTestId,
  );

  // inspect and click notification details
  await notificationDetailsPage.check_pageIsLoaded();
  await notificationDetailsPage.clickBackButton();
}
