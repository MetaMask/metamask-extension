import { Key } from 'selenium-webdriver';
import { Driver } from '../../../webdriver/driver';
import { RawLocator } from '../../common';

class Confirmation {
  protected driver: Driver;

  private accountAddressDetails: RawLocator = {
    tag: 'p',
    text: 'Account address',
  };

  private confirmationHeadingTitle: RawLocator = {
    text: 'Confirmation Dialog',
  };

  private footerCancelButton = '[data-testid="confirm-footer-cancel-button"]';

  private footerConfirmButton = '[data-testid="confirm-footer-button"]';

  private reconnectHardwareWalletButton =
    '[data-testid="reconnect-hardware-wallet-button"]';

  private formComboFieldInputSelector = '.form-combo-field input';

  private formComboFieldOptionPrimarySelector =
    '.form-combo-field__option-primary';

  private formComboFieldOptionSecondarySelector =
    '.form-combo-field__option-secondary';

  private formComboFieldSelector = '.form-combo-field';

  private headerAccountDetailsButton =
    '[data-testid="header-info__account-details-button"]';

  private inlineAlertButton = '[data-testid="inline-alert"]';

  private addressDisplaySelector =
    '[data-testid="recipient-address"] [data-testid="confirm-info-row-display-name"]';

  private nameSelector = '.name';

  private navigationTitle = '[data-testid="confirm-page-nav-position"]';

  private nextPageButton = '[data-testid="confirm-nav__next-confirmation"]';

  private previousPageButton =
    '[data-testid="confirm-nav__previous-confirmation"]';

  private rejectAllButton = '[data-testid="confirm-nav__reject-all"]';

  private saveButtonSelector = { text: 'Save', tag: 'button' };

  private scrollToBottomButton = '.confirm-scroll-to-bottom__button';

  private securityProviderBannerAlert =
    '[data-testid="security-provider-banner-alert"]';

  private sectionCollapseButton = '[data-testid="sectionCollapseButton"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkPageIsLoaded(): Promise<void> {
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

  async checkSecurityProviderBannerAlertIsNotPresent(): Promise<void> {
    await this.driver.assertElementNotPresent(this.securityProviderBannerAlert);
  }

  async checkSecurityProviderBannerAlertIsPresent(): Promise<void> {
    await this.driver.waitForSelector(this.securityProviderBannerAlert);
  }

  async clickFooterConfirmButton() {
    await this.driver.clickElement(this.footerConfirmButton);
  }

  async clickReconnectHardwareWalletButton() {
    await this.driver.clickElement(this.reconnectHardwareWalletButton);
  }

  async clickFooterConfirmButtonOrReconnect() {
    let lastDiag = '';
    await this.driver.waitUntil(
      async () => {
        const result = await this.driver.executeScript(
          `return JSON.stringify({
            url: window.location.href,
            hasConfirm: !!document.querySelector('[data-testid="confirm-footer-button"]'),
            hasReconnect: !!document.querySelector('[data-testid="reconnect-hardware-wallet-button"]'),
            testids: [...document.querySelectorAll('[data-testid]')].slice(0, 15).map(e => e.getAttribute('data-testid')),
            bodyText: document.body?.innerText?.substring(0, 300)
          })`,
        );
        lastDiag = result as string;
        const parsed = JSON.parse(result as string);
        return parsed.hasConfirm || parsed.hasReconnect;
      },
      { timeout: 30000, interval: 500 },
    ).catch(() => {
      console.log('[Speculos] clickFooterConfirmButtonOrReconnect diagnostic:', lastDiag);
      throw new Error(`Timed out waiting for confirm/reconnect button. Last page state: ${lastDiag}`);
    });

    const diagInfo = await this.driver.executeScript(
      `const btn = document.querySelector('[data-testid="confirm-footer-button"]');
      const reconnect = document.querySelector('[data-testid="reconnect-hardware-wallet-button"]');
      return JSON.stringify({
        hasConfirm: !!btn,
        confirmDisabled: btn?.disabled,
        confirmAriaDisabled: btn?.getAttribute('aria-disabled'),
        confirmClassDisabled: btn?.className?.includes('disabled'),
        hasReconnect: !!reconnect,
        url: window.location.href,
        testids: [...document.querySelectorAll('[data-testid]')].slice(0, 10).map(e => e.getAttribute('data-testid')),
      })`,
    );
    console.log('[Speculos] Page state after waitUntil:', diagInfo);

    let hasReconnect = false;
    try {
      const reconnectElement = await this.driver.findElement(
        this.reconnectHardwareWalletButton,
        5000,
      );
      if (reconnectElement) {
        hasReconnect = true;
        await reconnectElement.click();
        console.log('[Speculos] Clicked reconnect button');
        await this.driver.waitForSelector(this.footerConfirmButton);
        console.log('[Speculos] Confirm button appeared after reconnect');
      }
    } catch {
      console.log('[Speculos] No reconnect button found, proceeding to confirm');
    }

    try {
      await this.driver.waitUntil(
        async () => {
          const isEnabled = await this.driver.executeScript(
            `const btn = document.querySelector('[data-testid="confirm-footer-button"]');
            if (!btn) return 'not found';
            return JSON.stringify({disabled: btn.disabled, classes: btn.className});`,
          );
          const result = isEnabled as string;
          if (result === 'not found') return false;
          const parsed = JSON.parse(result);
          return !parsed.disabled;
        },
      { timeout: 30000, interval: 500 },
      );
      console.log('[Speculos] Confirm button is enabled, clicking...');
      await this.driver.clickElement(this.footerConfirmButton);
    } catch (e) {
      console.log('[Speculos] Confirm button not enabled, force-clicking. Error:', (e as Error).message);
      await this.driver.executeScript(
        `document.querySelector('[data-testid="confirm-footer-button"]')?.click()`,
      );
    }
    console.log('[Speculos] Confirm click completed, hasReconnect:', hasReconnect);
  }

  async clickHeaderAccountDetailsButton() {
    const accountDetailsButton = await this.driver.findElement(
      this.headerAccountDetailsButton,
    );
    await accountDetailsButton.sendKeys(Key.RETURN);
    await this.driver.waitForSelector(this.accountAddressDetails);
  }

  async clickFooterCancelButton() {
    await this.driver.clickElement(this.footerCancelButton);
  }

  async clickFooterConfirmButtonAndAndWaitForWindowToClose() {
    try {
      const reconnectElement = await this.driver.findElement(
        this.reconnectHardwareWalletButton,
        5000,
      );
      if (reconnectElement) {
        await reconnectElement.click();
        await this.driver.waitForSelector(this.footerConfirmButton);
      }
    } catch {
      // No reconnect button, proceed to confirm
    }
    await this.driver.clickElementAndWaitForWindowToClose(
      this.footerConfirmButton,
    );
  }

  async clickFooterConfirmButtonAndWaitToDisappear() {
    await this.driver.clickElementAndWaitToDisappear(this.footerConfirmButton);
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

  async checkNavigationIsNotPresent(): Promise<void> {
    await this.driver.assertElementNotPresent(this.navigationTitle, {
      waitAtLeastGuard: 1000,
    });
  }

  async clickNextPage(): Promise<void> {
    await this.driver.clickElement(this.nextPageButton);
  }

  async clickPreviousPage(): Promise<void> {
    await this.driver.clickElement(this.previousPageButton);
  }

  async checkPageNumbers(
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

  async clickRejectAllButtonWithoutWaiting(): Promise<void> {
    console.log(
      'Clicking reject all button without waiting for window to close',
    );
    await this.driver.clickElement(this.rejectAllButton);
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

  async checkNameIsDisplayed(
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

  async checkAddressIsDisplayed(address: string): Promise<void> {
    await this.driver.findElement({
      css: '[data-testid="confirm-info-row-display-name"]',
      text: address,
    });
  }

  async clickName(value: string): Promise<void> {
    console.log(`Clicking on name: ${value}`);
    await this.driver.clickElement({
      css: this.nameSelector,
      text: value,
    });
  }

  async saveName({
    value,
    name,
    proposedName,
  }: {
    value?: string;
    name?: string;
    proposedName?: string;
  }): Promise<void> {
    if (value) {
      await this.driver.clickElement({
        text: value,
      });
    } else {
      await this.driver.clickElement(this.addressDisplaySelector);
    }
    console.log(`Saving name: ${name}, proposedName: ${proposedName}`);
    await this.driver.clickElement(this.formComboFieldSelector);
    if (proposedName) {
      await this.driver.clickElement({
        css: this.formComboFieldOptionPrimarySelector,
        text: proposedName,
      });
    }

    if (name) {
      await this.driver.fill(this.formComboFieldInputSelector, name);
      // Pressing enter before saving is needed for firefox to get the dropdown to go away.
      await this.driver.press(
        this.formComboFieldInputSelector,
        this.driver.Key.ENTER,
      );
    }

    await this.driver.clickElement(this.saveButtonSelector);
  }

  async checkProposedNames(
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
}
export default Confirmation;
