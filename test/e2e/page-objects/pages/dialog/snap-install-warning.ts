import { Driver } from '../../../webdriver/driver';

class SnapInstallWarning {
  private readonly buttonConfirm =
    '[data-testid="snap-install-warning-modal-confirm"]';

  // Design-system Checkbox input is opacity-0; click the visible label instead.
  private readonly checkBoxPermission =
    'label:has([data-testid="snap-install-warning-checkbox"])';

  private readonly checkBoxPermissionInput = {
    testId: 'snap-install-warning-checkbox',
  };

  private driver: Driver;

  private readonly permissionConnect = '.permissions-connect';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkPageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([
        this.checkBoxPermissionInput,
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
