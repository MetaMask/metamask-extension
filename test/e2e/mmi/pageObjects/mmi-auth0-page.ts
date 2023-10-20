import { type Page } from '@playwright/test';

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
    if (
      (await this.page
        .getByRole('heading', { name: /welcome back/iu })
        .count()) === 0
    ) {
      await this.page.getByText('Log in').click();
    }
    const user = await this.page.$('[inputmode="email"]');
    await user?.fill(process.env.MMI_E2E_E2E_AUTH0_EMAIL as string);
    await this.page
      .locator('#password')
      .fill(process.env.MMI_E2E_E2E_AUTH0_PASSWORD as string);
    await this.page.getByRole('button', { name: /continue/iu }).click();
    await this.page.waitForLoadState();
    await this.page.close();
  }
}
