import { Page } from '@playwright/test';

export class PasswordPage {
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async create(password: string): Promise<void> {
    // Try new labeled UI
    try {
      await this.page.getByLabel(/Create new password/i).fill(password);
      await this.page.getByLabel(/Confirm password/i).fill(password);
      await this.page.getByRole('checkbox').check({ force: true });
      await this.page.getByRole('button', { name: /Create password/i }).click();
      return;
    } catch {}

    // Legacy fallback
    await this.page.fill('[data-testid="create-password-new"]', password);
    await this.page.fill('[data-testid="create-password-confirm"]', password);
    await this.page.click('[data-testid="create-password-terms"]');
    await this.page.click('button:has-text("Create password")');
  }
}

