import { Key } from 'selenium-webdriver';
import { Driver } from '../../../../webdriver/driver';
import { RawLocator } from '../../../common';
import HomePage from '../../home/homepage';
import SendTokenPage from '../../send/send-token-page';

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

  private nameSelector = '.name';

  private formComboFieldSelector = '.form-combo-field';

  private formComboFieldInputSelector = '.form-combo-field input';

  private formComboFieldOptionPrimarySelector =
    '.form-combo-field__option-primary';

  private formComboFieldOptionSecondarySelector =
    '.form-combo-field__option-secondary';

  private saveButtonSelector = { text: 'Save', tag: 'button' };

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

  async clickFooterCancelButtonAndWaitToDisappear() {
    await this.driver.clickElementAndWaitToDisappear(this.footerCancelButton);
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

  async check_nameIsDisplayed(
    expectedValue: string,
    isSaved: boolean,
  ): Promise<void> {
    const containerClass = isSaved ? 'name__saved' : 'name__missing';
    const valueClass = isSaved ? 'name__name' : 'name__value';

    await this.driver.findElement({
      css: `.${containerClass} .${valueClass}`,
      text: expectedValue,
    });
  }

  async clickName(value: string): Promise<void> {
    console.log(`Clicking on name: ${value}`);
    await this.driver.clickElement({
      css: this.nameSelector,
      text: value,
    });
  }

  async saveName(
    value: string,
    name?: string,
    proposedName?: string,
  ): Promise<void> {
    await this.clickName(value);
    console.log(
      `Saving name for value: ${value}, name: ${name}, proposedName: ${proposedName}`,
    );
    await this.driver.clickElement(this.formComboFieldSelector);

    if (proposedName) {
      await this.driver.clickElement({
        css: this.formComboFieldOptionPrimarySelector,
        text: proposedName,
      });
    }

    if (name) {
      const input = await this.driver.findElement(
        this.formComboFieldInputSelector,
      );
      await input.sendKeys(name);
      await input.sendKeys(this.driver.Key.ENTER); // Press Enter to close dropdown
    }

    await this.driver.clickElement(this.saveButtonSelector);
  }

  async check_proposedNames(
    value: string,
    options: [string, string][],
  ): Promise<void> {
    await this.clickName(value);
    await this.driver.clickElement(this.formComboFieldSelector);

    for (const option of options) {
      await this.driver.findElement({
        css: this.formComboFieldOptionPrimarySelector,
        text: option[0],
      });

      await this.driver.findElement({
        css: this.formComboFieldOptionSecondarySelector,
        text: option[1],
      });
    }
  }

  async createWalletSendTransaction(recipientAddress: string): Promise<void> {
    const homePage = new HomePage(this.driver);
    await homePage.startSendFlow();
    const sendToPage = new SendTokenPage(this.driver);
    await sendToPage.check_pageIsLoaded();
    await sendToPage.fillRecipient(recipientAddress);
    await sendToPage.goToNextScreen();
  }
}
export default Confirmation;
