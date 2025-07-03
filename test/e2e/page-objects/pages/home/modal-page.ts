import { Driver } from '../../../webdriver/driver';

class ModalPage {

  protected driver: Driver;

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async check_modalTitle(title: string): Promise<void> {
    try {
      await this.driver.waitForSelector({
        tag: 'h4',
        text: title,
      });
    } catch (e) {
      console.log(`Timeout while waiting for modal with title "${title}"`, e);
      throw e;
    }
  }

  async check_modalContent(content: string): Promise<void> {
    try {
      await this.driver.waitForSelector({
        tag: 'p',
        text: content,
      });
    } catch (e) {
      console.log(`Timeout while waiting for modal with content "${content}"`, e);
      throw e;
    }
  }

  async clickOnButton(buttonText: string): Promise<void> {
    await this.driver.clickElement({
      tag: 'button',
      text: buttonText,
    });
  }
}


export default ModalPage;
