import { Locator, Page, expect } from '@playwright/test';

export class TermsPage {
  private readonly page: Page;
  private readonly dialog: Locator;
  private readonly termsCheckbox: Locator;
  private readonly termsLabel: Locator;
  private readonly scrollControl: Locator;
  private readonly agreeButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.dialog = page.getByRole('dialog');
    this.termsCheckbox = page.locator('[data-testid="onboarding-terms-checkbox"], #terms-of-use__checkbox, input[type="checkbox"]');
    this.termsLabel = page.locator('label[for="terms-of-use__checkbox"], [data-testid="onboarding-terms-checkbox"] + label');
    this.scrollControl = page.locator('[data-testid="terms-of-use-scroll"], [data-testid="terms-of-use-scroll-button"]');
    this.agreeButton = page.locator('[data-testid="terms-of-use-agree-button"], button:has-text("Agree"), button:has-text("I agree")');
  }

  async accept(): Promise<void> {
    // Ensure the terms dialog is present
    try {
      await this.page.getByText(/Review our Terms of Use/i).waitFor({ state: 'visible', timeout: 15000 });
    } catch {}
    await this.dialog.first().waitFor({ state: 'visible', timeout: 15000 });

    // Check the checkbox (use check(), fall back to label click)
    const cb = this.dialog.getByRole('checkbox').first();
    try {
      await cb.waitFor({ state: 'visible', timeout: 8000 });
      await cb.check({ force: true });
    } catch {
      // Fallbacks
      try {
        await this.termsCheckbox.first().check({ force: true, timeout: 8000 });
      } catch {
        try {
          await this.termsLabel.first().click({ force: true, timeout: 8000 });
        } catch {
          await this.termsCheckbox.first().click({ force: true, timeout: 8000 });
        }
      }
    }

    // Scroll to enable Agree
    await this.scrollControl.first().click({ timeout: 5000 }).catch(async () => {
      try {
        await this.dialog.first().hover({ timeout: 500 });
      } catch {}
      await this.page.mouse.wheel(0, 3500);
    });

    // Click Agree when enabled
    const agree = this.agreeButton.first();
    await agree.waitFor({ state: 'visible', timeout: 15000 });
    await expect(agree).toBeEnabled({ timeout: 15000 });
    await agree.click();
  }
}

