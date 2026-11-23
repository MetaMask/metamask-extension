import { Driver } from '../../webdriver/driver';
import SnapInstall from '../pages/dialog/snap-install';
import SnapInstallWarning from '../pages/dialog/snap-install-warning';
import { TestSnaps, buttonLocator } from '../pages/test-snaps';
import { WINDOW_TITLES } from '../../constants';
import { getCleanAppState, regularDelayMs } from '../../helpers';

/**
 * Open test snaps page in a new window tab, click on the button.
 * Grant permission to the snap installed with the optional warning dialog.
 * Finally switches back to the TestSnaps window and, when `expectedMessage`
 * is set, waits until the connect button shows that installation is complete.
 *
 * @param driver - WebDriver instance used to interact with the browser.
 * @param buttonName - The name of the button to click.
 * @param options - Optional parameters.
 * @param options.withWarning - Whether the installation will have a warning dialog, default is false.
 * @param options.withExtraScreen - Whether there is an extra screen after the Ok, defaults to false.
 * @param options.url - The URL with the test snaps we target, (localhost or real URL with proxy).
 * @param options.expectedMessage - Button text expected once installation is complete. When set, waits for that text on `buttonName`.
 * @param options.snapId - npm snap ID (e.g. `'npm:@metamask/home-page-example-snap'`). When set, polls Redux state until the snap is enabled and no longer installing, ensuring the background has committed the install before the caller continues.
 */
export async function openTestSnapClickButtonAndInstall(
  driver: Driver,
  buttonName: keyof typeof buttonLocator,
  options: {
    withWarning?: boolean;
    withExtraScreen?: boolean;
    url?: string;
    expectedMessage?: string;
    snapId?: string;
  } = {},
) {
  const {
    withWarning = false,
    withExtraScreen = false,
    url,
    expectedMessage,
    snapId,
  } = options;
  const snapInstall = new SnapInstall(driver);
  const snapInstallWarning = new SnapInstallWarning(driver);
  const testSnaps = new TestSnaps(driver);
  await testSnaps.openPage(url);
  await testSnaps.checkPageIsLoaded();
  await testSnaps.scrollAndClickButton(buttonName);
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
  await snapInstall.checkPageIsLoaded();
  await snapInstall.clickConnectButton();
  await snapInstall.clickConfirmButton();
  if (withWarning) {
    await snapInstallWarning.checkPageIsLoaded();
    await snapInstallWarning.clickCheckboxPermission();
    await snapInstallWarning.clickConfirmButton();
  }
  if (withExtraScreen) {
    await snapInstall.clickOkButtonAndContinueOnDialog();
  } else {
    await snapInstall.clickOkButton();
  }
  await driver.switchToWindowWithTitle(WINDOW_TITLES.TestSnaps);
  if (expectedMessage) {
    await testSnaps.checkInstallationComplete(buttonName, expectedMessage);
  }
  if (snapId) {
    console.log(`Verifying snap "${snapId}" is committed to MetaMask state`);
    await driver.switchToWindowWithTitle(
      WINDOW_TITLES.ExtensionInFullScreenView,
    );
    await driver.waitUntil(
      async () => {
        const state = await getCleanAppState(driver);
        const snap = state?.metamask?.snaps?.[snapId];
        return Boolean(snap?.enabled && snap.status !== 'installing');
      },
      { interval: regularDelayMs, timeout: 15000 },
    );
    console.log(`Snap "${snapId}" is ready in MetaMask state`);
    await driver.switchToWindowWithTitle(WINDOW_TITLES.TestSnaps);
  }
}
