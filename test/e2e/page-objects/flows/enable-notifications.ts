import { Driver } from '../../webdriver/driver';
import FirstTimeTurnOnNotificationsModal from '../pages/notifications/first-time-turn-on-modal';
import HeaderNavbar from '../pages/header-navbar';

/**
 * This function enables the notifications through the header options menu from the home page
 *
 * Note: this flow focuses on the journey of a user who is enabling this feature for the first time
 *
 * @param driver - The webdriver instance.
 */
export const enableNotificationsFirstTime = async (
  driver: Driver,
): Promise<void> => {
  console.log(`Start enable notifications from home screen`);
  const header = new HeaderNavbar(driver);
  await header.goToNotifiationsList();

  const turnOnNotificationsModal = new FirstTimeTurnOnNotificationsModal(
    driver,
  );
  await turnOnNotificationsModal.check_pageIsLoaded();
  await turnOnNotificationsModal.clickTurnOnNotifications();
};
