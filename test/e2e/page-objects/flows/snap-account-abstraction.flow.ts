import { ERC_4337_ACCOUNT_SNAP_URL } from '../../constants';
import { Driver } from '../../webdriver/driver';
import SnapInstall from '../pages/dialog/snap-install';
import SnapAccountAbstractionKeyringPage from '../pages/snap-account-abstraction-keyring-page';

/**
 * Go to the Account Abstraction Snap page and install the snap.
 *
 * @param driver - The WebDriver instance used to interact with the browser.
 * @param snapUrl - The URL of the Account Abstraction Snap to install. Defaults to ERC_4337_ACCOUNT_SNAP_URL.
 */
export async function installAccountAbstractionSnap(
  driver: Driver,
  snapUrl: string = ERC_4337_ACCOUNT_SNAP_URL,
) {
  console.log('Install Account Abstraction Snap');
  const snapAccountAbstractionKeyringPage =
    new SnapAccountAbstractionKeyringPage(driver);
  await snapAccountAbstractionKeyringPage.startInstall(snapUrl);

  const snapInstall = new SnapInstall(driver);
  await snapInstall.clickConnectButton();
  await snapInstall.clickConfirmButton();
  await snapInstall.clickOkButton();
}
