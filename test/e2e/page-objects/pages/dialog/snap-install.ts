import { Driver } from '../../../webdriver/driver';

class SnapInstall {
  private driver: Driver;

  private readonly nextPageButton =
    '[data-testid="page-container-footer-next"]';

  private readonly pageFooter = '.page-container__footer';

  private readonly permissionConnect = '.permissions-connect';

  private readonly scrollSnapInstall = '[data-testid="snap-install-scroll"]';

  private readonly approveButton = '[data-testid="confirmation-submit-button"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async check_pageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([
        this.pageFooter,
        this.permissionConnect,
      ]);
    } catch (e) {
      console.log(
        'Timeout while waiting for Snap install dialog to be loaded',
        e,
      );
      throw e;
    }
    console.log('Snap install dialog is loaded');
  }

  async clickNextButton() {
    console.log('Click Confirm/Ok button');
    await this.driver.clickElement(this.nextPageButton);
  }

  async clickConfirmButton() {
    console.log('Scroll and click confirm button');
    await this.driver.clickElementSafe(this.scrollSnapInstall);
    await this.driver.clickElement(this.nextPageButton);
  }

  async clickApproveButton() {
    console.log('Click approve button');
    await this.driver.clickElement(this.approveButton);
  }
}

export default SnapInstall;
