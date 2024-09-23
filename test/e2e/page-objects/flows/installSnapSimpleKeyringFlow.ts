import { Driver } from '../../webdriver/driver';
import { SnapInstallationPage } from '../SnapInstallationPage';
import { WINDOW_TITLES } from '../../helpers';

export async function installSnapSimpleKeyringFlow(
  driver: Driver,
  isAsyncFlow: boolean,
) {
  // Assuming unlockWallet is handled elsewhere or not needed in this flow
  const snapInstallationPage = new SnapInstallationPage(driver);

  await snapInstallationPage.navigateToTestSnapsPage();
  await snapInstallationPage.clickConnectButton();
  await snapInstallationPage.switchToDialogWindow();
  await snapInstallationPage.confirmConnection();
  await snapInstallationPage.addToMetaMask();
  await snapInstallationPage.confirmInstallation();
  await snapInstallationPage.waitForPopupClose();
  await snapInstallationPage.switchToSnapSimpleKeyringDapp();
  await snapInstallationPage.waitForConnection();

  if (isAsyncFlow) {
    await toggleAsyncFlow(driver);
  }
}

async function toggleAsyncFlow(driver: Driver) {
  await driver.switchToWindowWithTitle(WINDOW_TITLES.SnapSimpleKeyringDapp);
  await driver.clickElement('[data-testid="use-sync-flow-toggle"]');
}
