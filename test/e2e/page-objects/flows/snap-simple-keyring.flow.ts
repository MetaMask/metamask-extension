import { Driver } from '../../webdriver/driver';
import SnapSimpleKeyringPage from '../pages/snap-simple-keyring-page';
import { TEST_SNAPS_SIMPLE_KEYRING_WEBSITE_URL } from '../../constants';

/**
 * Go to the Snap Simple Keyring page and install the snap.
 *
 * @param driver - The WebDriver instance used to interact with the browser.
 * @param isSyncFlow - Indicates whether to toggle on the use synchronous approval option on the snap. Defaults to true.
 */
export async function installSnapSimpleKeyring(
  driver: Driver,
  isSyncFlow: boolean = true,
) {
  await driver.openNewPage(TEST_SNAPS_SIMPLE_KEYRING_WEBSITE_URL);

  const snapSimpleKeyringPage = new SnapSimpleKeyringPage(driver);
  await snapSimpleKeyringPage.checkPageIsLoaded();
  await snapSimpleKeyringPage.installSnap();
  if (!isSyncFlow) {
    await snapSimpleKeyringPage.toggleUseSyncApproval();
  }
}
