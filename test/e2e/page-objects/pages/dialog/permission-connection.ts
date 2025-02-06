import { Driver } from '../../../webdriver/driver';

class PermissionConnection {
  private driver: Driver;

  private readonly nextPageButton =
    '[data-testid="page-container-footer-next"]';

  private readonly pageFooter = '.page-container__footer';

  private readonly permissionConnect = '.permissions-connect';

  private readonly scrollSnapInstall = '[data-testid="snap-install-scroll"]';

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
        'Timeout while waiting for permission dialog to be loaded',
        e,
      );
      throw e;
    }
    console.log('Permission dialog is loaded');
  }

  async clickNextButton() {
    console.log('Wait and click Confirm/Ok button');
    await this.driver.waitForSelector(this.nextPageButton);
    await this.driver.clickElement(this.nextPageButton);
  }

  async clickConfirmButton() {
    console.log('Wait,scroll and click confirm button');
    await this.driver.waitForSelector(this.nextPageButton);
    await this.driver.clickElementSafe(this.scrollSnapInstall);
    await this.driver.clickElement(this.nextPageButton);
  }
}

export default PermissionConnection;
