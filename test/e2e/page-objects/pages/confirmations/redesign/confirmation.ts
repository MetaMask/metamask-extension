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

  private nextPageButton: RawLocator;

  private previousPageButton: RawLocator;

  private navigationTitle: RawLocator;

  private rejectAllButton: RawLocator;

  private confirmationHeadingTitle: RawLocator;

  constructor(driver: Driver) {
    this.driver = driver;

    this.scrollToBottomButton = '.confirm-scroll-to-bottom__button';
    this.footerConfirmButton = '[data-testid="confirm-footer-button"]';
    this.headerAccountDetailsButton =
      '[data-testid="header-info__account-details-button"]';
    this.footerCancelButton = '[data-testid="confirm-footer-cancel-button"]';
    this.nextPageButton = '[data-testid="confirm-nav__next-confirmation"]';
    this.previousPageButton =
      '[data-testid="confirm-nav__previous-confirmation"]';
    this.navigationTitle = '[data-testid="confirm-page-nav-position"]';
    this.rejectAllButton = '[data-testid="confirm-nav__reject-all"]';
    this.confirmationHeadingTitle = { text: 'Confirmation Dialog' };
  }

  async check_pageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([
        this.footerCancelButton,
        this.footerConfirmButton,
      ]);
    } catch (e) {
      console.log(
        'Timeout while waiting for confirmation page to be loaded',
        e,
      );
      throw e;
    }
    console.log('Confirmation page is loaded');
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

  async clickFooterCancelButton() {
    await this.driver.clickElement(this.footerCancelButton);
  }

  async clickFooterConfirmButtonAndAndWaitForWindowToClose() {
    await this.driver.clickElementAndWaitForWindowToClose(
      this.footerConfirmButton,
    );
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

  async clickNextPage(): Promise<void> {
    await this.driver.clickElement(this.nextPageButton);
  }

  async clickPreviousPage(): Promise<void> {
    await this.driver.clickElement(this.previousPageButton);
  }

  async check_pageNumbers(
    currentPage: number,
    totalPages: number,
  ): Promise<void> {
    try {
      await this.driver.waitForSelector({
        css: this.navigationTitle,
        text: `${currentPage} of ${totalPages}`,
      });
    } catch (e) {
      console.log('Timeout while waiting for navigation page numbers', e);
      throw e;
    }
  }

  async clickRejectAll(): Promise<void> {
    await this.driver.clickElementAndWaitForWindowToClose(this.rejectAllButton);
  }

  async verifyConfirmationHeadingTitle(): Promise<void> {
    console.log('Verify confirmation heading title is Confirmation Dialog');
    await this.driver.waitForSelector(this.confirmationHeadingTitle);
  }

  async verifyRejectAllButtonNotPresent(): Promise<void> {
    await this.driver.assertElementNotPresent(this.rejectAllButton, {
      timeout: 5000,
    });
  }
}

export default Confirmation;
