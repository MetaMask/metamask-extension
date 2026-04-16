import { Driver } from '../../../webdriver/driver';

class AdvancedPermissionsIntroduction {
  driver: Driver;

  private readonly cancelButton = {
    // This button isn't explicitly defined in the snap, so doesn't have a nice selector
    testId: 'undefined-snap-footer-button',
  };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkPageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForSelector(this.cancelButton);
    } catch (e) {
      console.log(
        'Timeout while waiting for Advanced Permissions Introduction page to be loaded',
        e,
      );
      throw e;
    }
    console.log('Advanced Permissions Introduction page is loaded');
  }

  async cancel(): Promise<void> {
    console.log('Cancel on Advanced Permissions Introduction page');
    await this.driver.clickElementAndWaitForWindowToClose(this.cancelButton);
  }
}

export default AdvancedPermissionsIntroduction;
