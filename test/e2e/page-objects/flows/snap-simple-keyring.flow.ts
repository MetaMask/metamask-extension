import { Driver } from '../../webdriver/driver';
import  SnapSimpleKeyringPage from '../pages/snap-simple-keyring-page';
import { TEST_SNAPS_SIMPLE_KEYRING_WEBSITE_URL } from '../../constants';

export async function installSnapSimpleKeyring(
  driver: Driver,
  isSyncFlow: boolean = true,
) {
  await driver.navigate(TEST_SNAPS_SIMPLE_KEYRING_WEBSITE_URL);

  const snapSimpleKeyringPage = new SnapSimpleKeyringPage(driver);
  await snapSimpleKeyringPage.check_pageIsLoaded();
  await snapSimpleKeyringPage.installSnap();
  if (isSyncFlow) {
    await snapSimpleKeyringPage.toggleUseSyncApproval();
  }
}
