import { Driver } from '../../../webdriver/driver';

class SnapInstallWarning {
  private driver: Driver;

  private readonly checkBoxPermission = '.mm-checkbox__input';

  private readonly buttonConfirm =
    '[data-testid="snap-install-warning-modal-confirm"]';

  private readonly permissionConnect = '.permissions-connect';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  async check_pageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([
        this.checkBoxPermission,
        this.permissionConnect,
      ]);
    } catch (e) {
      console.log(
        'Timeout while waiting for snap install warning dialog to be loaded',
        e,
      );
      throw e;
    }
    console.log('Snap install warning dialog is loaded');
  }

  async clickCheckboxPermission() {
    console.log('Click checkbox permission');
    await this.driver.clickElement(this.checkBoxPermission);
  }

  async clickConfirmButton() {
    console.log('Click confirm button');
    await this.driver.clickElementAndWaitToDisappear(this.buttonConfirm);
  }
}

export default SnapInstallWarning;
