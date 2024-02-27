import { type Locator, type Page, test, expect } from '@playwright/test';
import { getCustodianInfoByName } from '../helpers/custodian-helper';
import { MMISaturnUIPage } from './mmi-saturn-ui-page';

export class MMIAccountMenuPage {
  readonly page: Page;

  readonly connectCustodianBtn: Locator;

  readonly tokenTxt: Locator;

  readonly connectCustodianConfirmBtn: Locator;

  readonly connectAccountBtn: Locator;

  readonly closeAddAccountBtn: Locator;

  readonly accountsMenuBtn: Locator;

  protected dialog: Locator;

  constructor(page: Page) {
    this.page = page;
    this.connectCustodianBtn = page.getByRole('button', {
      name: 'Connect Custodial Account',
    });
    this.tokenTxt = page.locator('textarea#jwt-box');
    this.connectCustodianConfirmBtn = page.getByRole('button', {
      name: 'Connect',
    });
    this.connectAccountBtn = page.locator('button:has-text("Connect")');
    this.closeAddAccountBtn = page.locator('button:has-text("Close")');
    this.accountsMenuBtn = page.getByTestId('account-menu-icon');
    this.dialog = this.page
      .getByRole('dialog')
      .filter({ hasText: 'Select an account' });
  }

  async accountsMenu() {
    await this.accountsMenuBtn.click();
  }

  async setDialog() {
    this.dialog = this.page
      .getByRole('dialog')
      .filter({ hasText: 'Select an account' });
  }

  async connectCustodian(name: string, visual?: boolean) {
    await this.page
      .getByRole('button', { name: /Add account or hardware wallet/iu })
      .click();
    await this.connectCustodianBtn.click();

    if (visual) {
      // wait until all custodian icons are loaded
      await this.page.waitForLoadState();
      await test.expect
        .soft(this.page)
        .toHaveScreenshot('custodian_list.png', { fullPage: true });
    }

    const custodian = await getCustodianInfoByName(name);
    await this.page
      .getByRole('list')
      .locator('div')
      .filter({ hasText: `${custodian[0].name}` })
      .first()
      .getByTestId('custody-connect-button')
      .click();

    await expect(
      this.page.getByText(/connect saturn custody accounts/iu),
    ).toBeVisible();
    if (visual) {
      await test.expect
        .soft(this.page)
        .toHaveScreenshot('custodian_connection_info.png', { fullPage: true });
    }

    const pagePromise = this.page.context().waitForEvent('page');
    await this.page.getByRole('button', { name: /continue/iu }).click();
    const saturnUI = await pagePromise;
    await saturnUI.waitForLoadState();

    const saturnUIPage = new MMISaturnUIPage(saturnUI);
    await saturnUIPage.connectMMI();
    await this.page.getByRole('button', { name: /cancel/iu }).click();
    await this.page.getByRole('button', { name: /back/iu }).click();
  }

  async selectCustodyAccount(account: string) {
    await this.accountsMenu();
    await this.dialog.getByText(`${account}`).first().click();
  }

  async accountMenuScreenshot(screenshotName: string) {
    const dialog = this.page
      .getByRole('dialog')
      .filter({ hasText: 'Select an account' });

    const networkBanner = this.page.locator('.network-list-menu__banner');

    const accountsFunds = dialog.locator(
      '.multichain-account-list-item__content',
    );

    await test.expect
      .soft(dialog)
      .toHaveScreenshot(screenshotName, {
        mask: [accountsFunds, networkBanner],
      });
  }

  async removeTokenScreenshot(accountToRemoveName: string) {
    await this.page
      .getByRole('button', { name: `${accountToRemoveName} Options` })
      .click();
    await this.page.getByText('Remove custodian token').click();
    // Scrollbar issues with different environments
    // const dialog = this.page
    //   .getByRole('dialog')
    //   .filter({ hasText: 'Remove custodian token' });

    // await test.expect.soft(dialog).toHaveScreenshot();
    await this.page.getByRole('button', { name: /close/iu }).first().click();
  }

  async removeCustodianToken(accountToRemoveName: string) {
    await this.page
      .getByRole('button', { name: `${accountToRemoveName} Options` })
      .click();
    await this.page.getByTestId('account-options-menu__remove-jwt').click();
    await expect(this.page.getByText('Remove custodian token')).toBeVisible();
    await this.page.getByRole('button', { name: /remove/iu }).click();
  }

  async getAccountNames() {
    await this.accountsMenu();
    const accountNames: string[] = [];
    const accounts = this.page.locator(
      '.multichain-account-list-item__content',
    );

    const accountsCount = await accounts.count();
    for (let i = 0; i < accountsCount; i += 1) {
      const accountName = await accounts.nth(i).getByRole('button').innerText();
      accountNames.push(accountName);
    }

    await this.page.getByRole('button', { name: /close/iu }).first().click();
    return accountNames;
  }

  async closeBanner() {
    await this.page
      .getByRole('dialog')
      .filter({ hasText: 'Select an account' })
      .locator('.mm-banner-base__close-button')
      .click();
  }
}
