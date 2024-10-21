import { Driver } from '../../../webdriver/driver';

class Notification {
  private driver: Driver;

  private submitButton: string;

  constructor(driver: Driver) {
    this.driver = driver;
    this.submitButton = '[data-testid="confirmation-submit-button"]';
  }

  async clickApproveButton(): Promise<void> {
    console.log('Click Approve Button');
    await this.driver.clickElement(this.submitButton);
  }
}

export default Notification;
