import { Locator, Page, expect } from '@playwright/test';

export class HomePage {
  private readonly page: Page;
  private readonly primaryCurrency: Locator;
  private readonly assetsTab: Locator;
  private readonly activityTab: Locator;
  private readonly solanaDialogClose: Locator;
  private readonly notNowButton: Locator;
  private readonly metametricsContinue: Locator;
  private readonly metametricsOptOut: Locator;
  private readonly completionDone: Locator;
  private readonly qrContinue: Locator;
  private readonly sendButton: Locator;
  private readonly receiveButton: Locator;
  private readonly swapButton: Locator;
  private readonly bridgeButton: Locator;
  private readonly accountMenu: Locator;
  private readonly networkSelector: Locator;

  constructor(page: Page) {
    this.page = page;
    this.primaryCurrency = page.locator('[data-testid="eth-overview__primary-currency"]');
    this.assetsTab = page.locator('[data-testid="account-overview__asset-tab"]');
    this.activityTab = page.locator('[data-testid="account-overview__activity-tab"]');
    this.solanaDialogClose = page.locator('role=dialog >> button[aria-label="Close"]');
    this.notNowButton = page.getByRole('button', { name: /Not now/i });
    this.metametricsContinue = page.getByRole('button', { name: /Continue|I agree/i });
    this.metametricsOptOut = page.getByRole('checkbox');
    this.completionDone = page.locator('[data-testid="onboarding-complete-done"], [data-testid="onboarding-completion-done"], button:has-text("Done")');
    this.qrContinue = page.locator('[data-testid="onboarding-download-app-continue"], [data-testid="onboarding-qr-continue"], button:has-text("Continue")');
    this.sendButton = page.locator('[data-testid="eth-overview-send"]');
    this.receiveButton = page.locator('[data-testid="eth-overview-receive"]');
    this.swapButton = page.locator('[data-testid="token-overview-button-swap"]');
    this.bridgeButton = page.locator('[data-testid="eth-overview-bridge"]');
    this.accountMenu = page.locator('[data-testid="account-menu-icon"]');
    this.networkSelector = page.locator('[data-testid="network-display"]');
  }

  async closeSolanaDialogIfPresent(): Promise<void> {
    try {
      if (await this.solanaDialogClose.first().isVisible({ timeout: 1500 }).catch(() => false)) {
        await this.solanaDialogClose.first().click({ timeout: 1500 });
      } else if (await this.notNowButton.isVisible({ timeout: 1500 }).catch(() => false)) {
        await this.notNowButton.click({ timeout: 1500 });
      }
    } catch {}
  }

  async waitForLoaded(): Promise<void> {
    const deadline = Date.now() + 45000;
    // Poll: keep closing overlays and check for either primary currency or assets tab
    while (Date.now() < deadline) {
      await this.closeSolanaDialogIfPresent();
      // Handle QR download page → Continue
      try {
        if (await this.qrContinue.first().isVisible({ timeout: 500 }).catch(() => false)) {
          await this.qrContinue.first().scrollIntoViewIfNeeded().catch(() => {});
          await this.qrContinue.first().click({ timeout: 2000 }).catch(() => {});
        }
      } catch {}
      // Handle completion screen (Your wallet is ready!)
      try {
        if (await this.completionDone.first().isVisible({ timeout: 500 }).catch(() => false)) {
          await this.completionDone.first().scrollIntoViewIfNeeded().catch(() => {});
          await this.completionDone.first().click({ timeout: 2000 }).catch(() => {});
        }
      } catch {}
      // Handle MetaMetrics screen if present: uncheck/leave unchecked and continue
      try {
        const helpUsImprove = await this.page.getByText(/Help us improve MetaMask/i).isVisible({ timeout: 500 }).catch(() => false);
        if (helpUsImprove) {
          try { await this.metametricsOptOut.first().uncheck({ force: true }); } catch {}
          if (await this.metametricsContinue.first().isVisible().catch(() => false)) {
            await this.metametricsContinue.first().click().catch(() => {});
          }
        }
      } catch {}
      const primaryVisible = await this.primaryCurrency.first().isVisible().catch(() => false);
      const assetsVisible = await this.assetsTab.first().isVisible().catch(() => false);
      if (primaryVisible || assetsVisible) {
        return;
      }
      try {
        await this.page.keyboard.press('Escape');
      } catch {}
      await this.page.waitForTimeout(300);
    }
    // Final attempt with explicit waits to surface a clear error
    try {
      await this.primaryCurrency.first().waitFor({ state: 'visible', timeout: 5000 });
    } catch {
      await this.assetsTab.first().waitFor({ state: 'visible', timeout: 5000 });
    }
  }

  // Helpers ported from home-page.ts
  async getBalance(): Promise<string> {
    await this.primaryCurrency.first().waitFor({ state: 'visible' });
    return (await this.primaryCurrency.first().textContent()) ?? '0';
  }

  async assertBalanceDisplayed(): Promise<void> {
    await expect(this.primaryCurrency.first()).toBeVisible();
  }

  async clickSend(): Promise<void> { await this.sendButton.click(); }
  async clickReceive(): Promise<void> { await this.receiveButton.click(); }
  async clickSwap(): Promise<void> { await this.swapButton.click(); }
  async clickBridge(): Promise<void> { await this.bridgeButton.click(); }
  async switchToActivityTab(): Promise<void> { await this.activityTab.click(); }
  async switchToAssetTab(): Promise<void> { await this.assetsTab.click(); }
  async openAccountMenu(): Promise<void> { await this.accountMenu.click(); }
  async getNetworkName(): Promise<string> { return (await this.networkSelector.textContent()) ?? ''; }
}

