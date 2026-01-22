import { Driver } from '../../webdriver/driver';
import SnapInstall from '../pages/dialog/snap-install';
import SnapInstallWarning from '../pages/dialog/snap-install-warning';
import { TestSnaps } from '../pages/test-snaps';
import { WINDOW_TITLES } from '../../constants';

/**
 * Type for the connect button method names on the TestSnaps page object.
 */
export type TestSnapConnectButton =
  | 'clickConnectBip32Button'
  | 'clickConnectBip44Button'
  | 'clickConnectClientStatusButton'
  | 'clickConnectCronJobsButton'
  | 'clickConnectCronjobDurationButton'
  | 'clickConnectDialogsButton'
  | 'clickConnectErrorsButton'
  | 'clickConnectGetEntropyButton'
  | 'clickConnectGetFileButton'
  | 'clickConnectHomePageButton'
  | 'clickConnectJsxButton'
  | 'clickConnectJsonRpcButton'
  | 'clickConnectInteractiveButton'
  | 'clickConnectImagesButton'
  | 'clickConnectLifeCycleButton'
  | 'clickConnectNameLookUpButton'
  | 'clickConnectManageStateButton'
  | 'clickConnectStateButton'
  | 'clickConnectPreinstalledButton'
  | 'clickConnectProtocolButton'
  | 'clickConnectTransactionInsightButton'
  | 'clickConnectUpdateButton'
  | 'clickConnectUpdateNewButton'
  | 'clickConnectWasmButton'
  | 'clickConnectNotificationButton'
  | 'clickConnectEthereumProviderButton'
  | 'clickConnectNetworkAccessButton'
  | 'clickConnectBackgroundEventsButton'
  | 'clickConnectPreferencesButton';

/**
 * Open test snaps page in a new window tab, click on the connect button.
 * Grant permission to the snap installed with the optional warning dialog.
 * Finally switches back to the TestSnaps window.
 *
 * @param driver - WebDriver instance used to interact with the browser.
 * @param connectButtonMethod - The name of the connect button method to call on TestSnaps.
 * @param options - Optional parameters.
 * @param options.withWarning - Whether the installation will have a warning dialog, default is false.
 * @param options.withExtraScreen - Whether there is an extra screen after the Ok, defaults to false.
 * @param options.url - The URL with the test snaps we target, (localhost or real URL with proxy).
 */
export async function openTestSnapClickButtonAndInstall(
  driver: Driver,
  connectButtonMethod: TestSnapConnectButton,
  options: {
    withWarning?: boolean;
    withExtraScreen?: boolean;
    url?: string;
  } = {},
): Promise<void> {
  const { withWarning = false, withExtraScreen = false, url } = options;
  const snapInstall = new SnapInstall(driver);
  const snapInstallWarning = new SnapInstallWarning(driver);
  const testSnaps = new TestSnaps(driver);
  await testSnaps.openPage(url);
  await testSnaps[connectButtonMethod]();
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
}
