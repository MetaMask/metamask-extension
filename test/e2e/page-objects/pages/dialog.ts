import { Driver } from '../../webdriver/driver';
import { RawLocator } from '../common';

class Dialog {
  private driver: Driver;

  private setApprovalForAllTitleElement: RawLocator;

  private setApprovalForAllSubHeadingElement: RawLocator;

  private scrollToBottomButton: RawLocator;

  private footerConfirmButton: RawLocator;

  constructor(driver: Driver) {
    this.driver = driver;

    this.setApprovalForAllTitleElement = {
      css: 'h2',
      text: 'Withdrawal request',
    };
    this.setApprovalForAllSubHeadingElement = {
      css: 'p',
      text: 'This site wants permission to withdraw your NFTs',
    };
    this.scrollToBottomButton = '.confirm-scroll-to-bottom__button';
    this.footerConfirmButton = '[data-testid="confirm-footer-button"]';
  }

  public async check_setApprovalForAllTitle() {
    await this.driver.waitForSelector(this.setApprovalForAllTitleElement);
  }

  public async check_setApprovalForAllSubHeading() {
    await this.driver.waitForSelector(this.setApprovalForAllSubHeadingElement);
  }

  public async clickScrollToBottomButton() {
    await this.driver.clickElementSafe(this.scrollToBottomButton);
  }

  public async clickFooterConfirmButton() {
    await this.driver.clickElement(this.footerConfirmButton);
  }
}

export default Dialog;
