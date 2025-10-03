import { Driver } from '../../webdriver/driver';
import SnapSimpleKeyringPage from '../pages/snap-simple-keyring-page';

/**
 * Go to the Snap Simple Keyring page and install the snap.
 *
 * @param driver - The WebDriver instance used to interact with the browser.
 * @param isSyncFlow - Indicates whether to toggle on the use synchronous approval option on the snap. Defaults to true.
 * @param port - The port number where the snap simple keyring site is running. Defaults to 8080.
 */
export async function installSnapSimpleKeyring(
  driver: Driver,
  isSyncFlow: boolean = true,
  port: number = 8080,
) {
  await driver.openNewPage(`http://127.0.0.1:${port}`);

  const snapSimpleKeyringPage = new SnapSimpleKeyringPage(driver);
  await snapSimpleKeyringPage.checkPageIsLoaded();
  await snapSimpleKeyringPage.installSnap();
  if (!isSyncFlow) {
    await snapSimpleKeyringPage.toggleUseSyncApproval();
  }
}
