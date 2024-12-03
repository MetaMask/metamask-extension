import { Key } from 'selenium-webdriver';
import { Driver } from '../../../../webdriver/driver';
import { RawLocator } from '../../../common';

class Confirmation {
  protected driver: Driver;

  private scrollToBottomButton: RawLocator;

  private footerConfirmButton: RawLocator;

  private headerAccountDetailsButton: RawLocator;

  private footerCancelButton: RawLocator;

  private sectionCollapseButton = '[data-testid="sectionCollapseButton"]';

  private inlineAlertButton = {
    css: '[data-testid="inline-alert"]',
    text: 'Alert',
  };

  constructor(driver: Driver) {
    this.driver = driver;

    this.scrollToBottomButton = '.confirm-scroll-to-bottom__button';
    this.footerConfirmButton = '[data-testid="confirm-footer-button"]';
    this.headerAccountDetailsButton =
      '[data-testid="header-info__account-details-button"]';
    this.footerCancelButton = '[data-testid="confirm-footer-cancel-button"]';
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

  async clickFooterCancelButtonAndAndWaitForWindowToClose() {
    await this.driver.clickElementAndWaitForWindowToClose(
      this.footerCancelButton,
    );
  }

  async clickCollapseSectionButton() {
    await this.driver.clickElement(this.sectionCollapseButton);
  }

  async clickInlineAlert() {
    await this.driver.clickElement(this.inlineAlertButton);
  }
}

export default Confirmation;
