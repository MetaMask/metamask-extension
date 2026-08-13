import { Driver } from '../../../webdriver/driver';

/**
 * Snap install warning modal for sensitive permission acknowledgements.
 *
 * Screen: modal layered over the snap install / permissions-connect flow when
 * install warnings require an explicit checkbox + confirm.
 * Owns: permission warning checkbox, permissions-connect surface wait, and the
 * warning-modal confirm control.
 * Boundaries: stops at the warning modal. The surrounding install steps belong
 * to `SnapInstall`.
 * Related: `SnapInstall`, `flows/install-test-snap.flow.ts`.
 *
 * @see ui/components/app/snaps/snap-install-warning/snap-install-warning.js
 */
class SnapInstallWarning {
  private readonly buttonConfirm =
    '[data-testid="snap-install-warning-modal-confirm"]';

  private readonly checkBoxPermission = '.mm-checkbox__input';

  private driver: Driver;

  private readonly permissionConnect = '.permissions-connect';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkPageIsLoaded(): Promise<void> {
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
