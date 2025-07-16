import { expect, type Page } from '@playwright/test';

const portfolio = `${process.env.MMI_E2E_MMI_DASHBOARD_URL}/portfolio`;

export class Auth0Page {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto(process.env.MMI_E2E_AUTH0_SIGNIN_URL as string);
  }

  async signIn() {
    console.log('🔐 Login in portfolio');
    await this.goto();

    let attempts = 3;
    let isHeadingVisible = await this.page
      .getByRole('heading', { name: /create your account/iu })
      .isVisible();

    while (isHeadingVisible && attempts > 0) {
      await this.page.getByText('Log in').click();

      isHeadingVisible = await this.page
        .getByRole('heading', { name: /create your account/iu })
        .isVisible();

      attempts -= 1;
      if (isHeadingVisible) {
        console.log('🤬 Retrying clicking Log in. Attemps left', attempts);
      }
    }

    if (isHeadingVisible) {
      throw new Error('Unable to log in after multiple attempts');
    }

    const user = await this.page.$('[inputmode="email"]');
    await user?.fill(process.env.MMI_E2E_E2E_AUTH0_EMAIL as string);
    await this.page
      .locator('#password')
      .fill(process.env.MMI_E2E_E2E_AUTH0_PASSWORD as string);
    await this.page.getByRole('button', { name: /continue/iu }).click();
    await this.page.getByRole('button', { name: /E2E Organization/iu }).click();
    await expect(this.page).toHaveURL(portfolio);
  }
}
