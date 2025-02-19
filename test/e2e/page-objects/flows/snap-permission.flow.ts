import { Driver } from '../../webdriver/driver';
import SnapInstall from '../pages/dialog/snap-install';
import SnapInstallWarning from '../pages/dialog/snap-install-warning';
import { WINDOW_TITLES } from '../../helpers';

/**
 * Grant permission to the snap installed
 *
 * @param driver - WebDriver instance used to interact with the browser.
 */
export async function approvePermissionAndConfirm(driver: Driver) {
  const snapInstall = new SnapInstall(driver);
  const snapInstallWarning = new SnapInstallWarning(driver);
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
  await snapInstall.check_pageIsLoaded();
  await snapInstall.clickNextButton();
  await snapInstall.clickConfirmButton();
  await snapInstallWarning.check_pageIsLoaded();
  await snapInstallWarning.clickCheckboxPermission();
  await snapInstallWarning.clickConfirmButton();
  await snapInstall.clickNextButton();
}

/**
 * Switch to dialog and click approve button
 *
 * @param driver - WebDriver instance used to interact with the browser.
 */
export async function switchToDialogAndClickApproveButton(driver: Driver) {
  const snapInstall = new SnapInstall(driver);
  console.log('Switch to dialog and click approve button');
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
  await snapInstall.clickApproveButton();
}
