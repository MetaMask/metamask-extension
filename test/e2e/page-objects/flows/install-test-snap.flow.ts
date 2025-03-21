import { Driver } from '../../webdriver/driver';
import SnapInstall from '../pages/dialog/snap-install';
import SnapInstallWarning from '../pages/dialog/snap-install-warning';
import { TestSnaps, buttonLocator } from '../pages/test-snaps';
import { WINDOW_TITLES } from '../../helpers';

/**
 * Open test snaps page in a new window tab, click on the button.
 * Grant permission to the snap installed with the optional warning dialog.
 * Finally switches back to the TestSnaps window.
 *
 * @param driver - WebDriver instance used to interact with the browser.
 * @param buttonName - The name of the button to click.
 * @param withWarning - Whether the installation will have a warning dialog, default is false.
 */
export async function openTestSnapClickButtonAndInstall(
  driver: Driver,
  buttonName: keyof typeof buttonLocator,
  withWarning = false,
) {
  const snapInstall = new SnapInstall(driver);
  const snapInstallWarning = new SnapInstallWarning(driver);
  const testSnaps = new TestSnaps(driver);
  await testSnaps.openPage();
  await testSnaps.scrollAndClickButton(buttonName);
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
  await snapInstall.check_pageIsLoaded();
  await snapInstall.clickNextButton();
  await snapInstall.clickConfirmButton();
  if (withWarning) {
    await snapInstallWarning.check_pageIsLoaded();
    await snapInstallWarning.clickCheckboxPermission();
    await snapInstallWarning.clickConfirmButton();
  }
  await snapInstall.clickNextButton();
  await driver.switchToWindowWithTitle(WINDOW_TITLES.TestSnaps);
}
