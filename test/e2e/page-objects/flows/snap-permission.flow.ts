import { Driver } from '../../webdriver/driver';
import SnapInstall from '../pages/dialog/snap-install';
import SnapInstallWarning from '../pages/dialog/snap-install-warning';
import { WINDOW_TITLES } from '../../helpers';

/**
 * Grant permission to the snap installed with the optional warning dialog.
 * Finally switches back to the TestSnaps window.
 *
 * @param driver - WebDriver instance used to interact with the browser.
 * @param withWarning - Whether the installation will have a warning dialog, default is false.
 */
export async function confirmPermissionSwitchToTestSnap(
  driver: Driver,
  withWarning = false,
) {
  const snapInstall = new SnapInstall(driver);
  const snapInstallWarning = new SnapInstallWarning(driver);
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
  await snapInstall.check_pageIsLoaded();
  await snapInstall.clickConnectButton();
  await snapInstall.clickConfirmButton();
  if (withWarning) {
    await snapInstallWarning.check_pageIsLoaded();
    await snapInstallWarning.clickCheckboxPermission();
    await snapInstallWarning.clickConfirmButton();
  }
  await snapInstall.clickOkButton();
  await driver.switchToWindowWithTitle(WINDOW_TITLES.TestSnaps);
}

/**
 * Switches to the dialog window and clicks the approve button.
 * Finally switches back to the TestSnaps window.
 *
 * @param driver - WebDriver instance used to interact with the browser.
 */
export async function switchAndApproveDialogSwitchToTestSnap(driver: Driver) {
  const snapInstall = new SnapInstall(driver);
  console.log('Switching to dialog and clicking approve button');
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
  await snapInstall.clickApproveButton();
  await driver.switchToWindowWithTitle(WINDOW_TITLES.TestSnaps);
}

/**
 * Complete snap install confirmation and switch back to the TestSnaps window.
 *
 * @param driver - WebDriver instance used to interact with the browser.
 */
export async function completeSnapInstallSwitchToTestSnap(driver: Driver) {
  const snapInstall = new SnapInstall(driver);
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
  await snapInstall.clickConnectButton();
  await snapInstall.clickConfirmButton();
  await snapInstall.clickOkButton();
  await driver.switchToWindowWithTitle(WINDOW_TITLES.TestSnaps);
}

/**
 * Approve the account in the dialog window and switch back to the `test-snaps`
 * window.
 *
 * @param driver - WebDriver instance used to interact with the browser.
 */
export async function approveAccount(driver: Driver) {
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

  await driver.waitForSelector({
    text: 'Connect with MetaMask',
    tag: 'h3',
  });

  await driver.clickElement({ text: 'Next' });

  await driver.waitForSelector({
    text: 'Review permissions',
    tag: 'h3',
  });

  await driver.clickElementAndWaitForWindowToClose({ text: 'Confirm' });
  await driver.switchToWindowWithTitle(WINDOW_TITLES.TestSnaps);
}

export async function approvePersonalSignMessage(driver: Driver) {
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
  await driver.waitForSelector({
    text: 'Signature request',
    tag: 'h2',
  });

  await driver.clickElementAndWaitForWindowToClose({ text: 'Confirm' });
  await driver.switchToWindowWithTitle(WINDOW_TITLES.TestSnaps);
}
