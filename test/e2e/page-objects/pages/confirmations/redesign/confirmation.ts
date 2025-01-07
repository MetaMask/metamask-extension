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

  private loadingSpinner: RawLocator;

  private bannerAlert: RawLocator;

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
    this.loadingSpinner = '.loading-indicator';
    this.bannerAlert = '[data-testid="confirm-banner-alert"]';
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
      await this.driver.findElement({
        css: this.navigationTitle,
        text: `${currentPage} of ${totalPages}`,
      });
    } catch (e) {
      console.log('Timeout while waiting for navigation page numbers', e);
      throw e;
    }
  }

  async checkLoadingSpinner(): Promise<void> {
    await this.driver.assertElementNotPresent(this.loadingSpinner);
  }

  async checkBannerAlertIsNotPresent(): Promise<void> {
    await this.driver.assertElementNotPresent(this.bannerAlert);
  }

  async validateBannerAlert({
    expectedTitle,
    expectedDescription,
  }: {
    expectedTitle: string;
    expectedDescription: string;
  }): Promise<void> {
    await this.driver.findElement(this.bannerAlert);

    await this.driver.waitForSelector({
      css: '.mm-text--body-lg-medium',
      text: expectedTitle,
    });

    await this.driver.waitForSelector({
      css: '.mm-text--body-md',
      text: expectedDescription,
    });
  }
}

export default Confirmation;
