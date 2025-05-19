import { Driver } from '../../webdriver/driver';
import HeaderNavbar from '../pages/header-navbar';
import NotificationsListPage from '../pages/notifications-list-page';
import NotificationsSettingsPage from '../pages/settings/notifications-settings-page';
import SettingsPage from '../pages/settings/settings-page';
import NotificationDetailsPage from '../pages/notification-details-page';

/**
 * Enables notifications through the Call-To-Action (CTA) button.
 *
 * @param driver - The webdriver instance.
 * @param setting - Should the notification setting turned on by default
 */
export const enableNotificationsThroughCTA = async (
  driver: Driver,
  setting: boolean = true,
) => {
  console.log('Enabling notifications through CTA');
  const headerNavbar = new HeaderNavbar(driver);
  await headerNavbar.check_pageIsLoaded();
  await headerNavbar.enableNotifications();

  if (setting === true) {
    // Navigate to notifications settings through global menu > notifications > settings button
    const notificationsListPage = new NotificationsListPage(driver);
    await notificationsListPage.check_pageIsLoaded();
    await notificationsListPage.goToNotificationsSettings();
  }
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
  await notificationsSettingsPage.clickNotificationToggle({
    toggleType: 'general',
  });
};

/**
 * Asserts the main notification settings toggles are enabled.
 *
 * @param driver
 */
export const assertMainNotificationSettingsToggles = async (driver: Driver) => {
  console.log('Asserting main notification settings toggles');
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
};

/**
 * Click each notification item by the testId and validate the details page appears
 *
 * @param driver
 * @param testId
 */
export async function clickNotificationItemAndDetailsPage(
  driver: Driver,
  testId: string,
) {
  const notificationsListPage = new NotificationsListPage(driver);
  const notificationDetailsPage = new NotificationDetailsPage(driver);

  await notificationsListPage.check_pageIsLoaded();
  await notificationsListPage.check_notificationItemByTestId(testId);
  await notificationsListPage.clickNotificationItemByTestId(testId);

  // inspect and click notification details
  await notificationDetailsPage.check_pageIsLoaded();
  await notificationDetailsPage.clickBackButton();
}
