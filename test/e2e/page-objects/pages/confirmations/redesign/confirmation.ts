import { Key } from 'selenium-webdriver';
import { Driver } from '../../../../webdriver/driver';
import { RawLocator } from '../../../common';

class Confirmation {
  protected driver: Driver;

  private scrollToBottomButton: RawLocator;

  private footerConfirmButton: RawLocator;

  private headerAccountDetailsButton: RawLocator;

  constructor(driver: Driver) {
    this.driver = driver;

    this.scrollToBottomButton = '.confirm-scroll-to-bottom__button';
    this.footerConfirmButton = '[data-testid="confirm-footer-button"]';
    this.headerAccountDetailsButton =
      '[data-testid="header-info__account-details-button"]';
  }

  async clickScrollToBottomButton() {
    await this.driver.clickElementSafe(this.scrollToBottomButton);
  }

  async clickFooterConfirmButton() {
    await this.driver.clickElement(this.footerConfirmButton);
  }

  async clickHeaderAccountDetailsButton() {
    const accountDetailsButton = await this.driver.findElement(
      this.headerAccountDetailsButton,
    );
    await accountDetailsButton.sendKeys(Key.RETURN);
  }
}

export default Confirmation;
