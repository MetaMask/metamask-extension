import { type Locator, type Page, expect } from '@playwright/test';
import { MMIMainPage } from './mmi-main-page';

export class MMIMainMenuPage {
  readonly page: Page;

  readonly extensionId: string;

  readonly mainMenuBtn: Locator;

  readonly connectCustodianBtn: Locator;

  readonly tokenTxt: Locator;

  readonly connectCustodianConfirmBtn: Locator;

  readonly connectAccountBtn: Locator;

  readonly closeAddAccountBtn: Locator;

  readonly activityTab: Locator;

  readonly NFTsTab: Locator;

  readonly closeSettingsBtn: Locator;

  readonly passwordTxt: Locator;

  readonly accountsMenuBtn: Locator;

  constructor(page: Page, extensionId: string) {
    this.extensionId = extensionId;
    this.page = page;
    this.mainMenuBtn = page.getByTestId('account-options-menu-button');
    this.connectCustodianBtn = page.getByRole('button', {
      name: 'Connect Custodial Account',
    });
    this.tokenTxt = page.locator('textarea#jwt-box');
    this.connectCustodianConfirmBtn = page.getByRole('button', {
      name: 'Connect',
    });
    this.connectAccountBtn = page.locator('button:has-text("Connect")');
    this.closeAddAccountBtn = page.locator('button:has-text("Close")');
    this.activityTab = page.locator('button:has-text("Activity")');
    this.NFTsTab = page.locator('button:has-text("NFTs")');
    this.closeSettingsBtn = page.locator(
      '.settings-page__header__title-container__close-button',
    );
    this.passwordTxt = page.locator('input#password');

    this.accountsMenuBtn = page.getByTestId('account-menu-icon');
  }

  async goto() {
    await this.page.goto(`chrome-extension://${this.extensionId}/home.html`);
  }

  async openMenu() {
    await this.mainMenuBtn.click();
  }

  async accountsMenu() {
    await this.accountsMenuBtn.click();
  }

  async lockExtension() {
    await this.openMenu();
    await this.page.locator('button >> text=Lock').click();
  }

  async unlockExtension() {
    await this.passwordTxt.fill(process.env.MMI_E2E_MMI_PASSWORD as string);
    await this.page.locator('button >> text=Unlock').click();
  }

  async selectMenuOption(option: string) {
    await this.openMenu();
    await this.page.locator(`data-testid=global-menu-${option}`).click();
  }

  async selectSettings(option: string) {
    const regex = new RegExp(option, 'iu');
    await this.page
      .locator('.tab-bar')
      .getByRole('button', {
        name: regex,
      })
      .click();
  }

  async switchTestNetwork() {
    await this.page
      .locator(
        'text=Show test networksSelect this to show test networks in network listOffOn >> label',
      )
      .click();
  }

  async showIncomingTransactionsOff() {
    await this.page.getByText(/Security & Privacy/iu).click();
    await this.page
      .locator(
        '.settings-page__content-row >> :scope:has-text("Show Incoming Transactions") >> .toggle-button--on',
      )
      .click();
  }

  async isInteractiveReplacementTokenNotificationVisible(account: string) {
    await expect(
      this.page.locator('.interactive-replacement-token-notification'),
    ).toHaveCount(1);
    const mainPage = new MMIMainPage(this.page);
    await mainPage.mainPageScreenshot(
      'token-replacement-notification.png',
      account,
    );
  }

  async closeDeprecatedNetworksBanner() {
    await this.page.locator('.mm-banner-base__close-button').click();
  }

  async closeSettings() {
    await this.closeSettingsBtn.click();
  }
}
