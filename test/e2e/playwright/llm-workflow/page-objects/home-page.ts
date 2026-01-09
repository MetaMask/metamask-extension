import type { Page, Locator } from '@playwright/test';

export class HomePage {
  readonly page: Page;

  private readonly accountMenuIcon: Locator;
  private readonly accountOptionsButton: Locator;
  private readonly activityTab: Locator;
  private readonly bridgeButton: Locator;
  private readonly buyButton: Locator;
  private readonly receiveButton: Locator;
  private readonly sendButton: Locator;
  private readonly settingsButton: Locator;
  private readonly swapButton: Locator;
  private readonly tokensTab: Locator;

  private readonly networkPicker: Locator;
  private readonly networkPickerLabel: Locator;
  private readonly networkSubtitle: Locator;
  private readonly networkDisplay: Locator;

  private readonly addressCopyButton: Locator;
  private readonly selectedAccountAddress: Locator;

  private readonly ethPrimaryCurrency: Locator;
  private readonly ethSecondaryCurrency: Locator;
  private readonly coinPrimaryCurrency: Locator;
  private readonly coinSecondaryCurrency: Locator;

  constructor(page: Page) {
    this.page = page;

    this.accountMenuIcon = page.locator('[data-testid="account-menu-icon"]');
    this.accountOptionsButton = page.locator(
      '[data-testid="account-options-menu-button"]',
    );
    this.activityTab = page.locator(
      '[data-testid="account-overview__activity-tab"]',
    );
    this.bridgeButton = page.locator('[data-testid="coin-overview-bridge"]');
    this.buyButton = page.locator('[data-testid="coin-overview-buy"]');
    this.receiveButton = page.locator('[data-testid="coin-overview-receive"]');
    this.sendButton = page.locator('[data-testid="coin-overview-send"]');
    this.settingsButton = page.locator('[data-testid="global-menu-settings"]');
    this.swapButton = page.locator('[data-testid="coin-overview-swap"]');
    this.tokensTab = page.locator(
      '[data-testid="account-overview__asset-tab"]',
    );

    this.networkPicker = page.locator('.mm-picker-network');
    this.networkPickerLabel = page.locator(
      '[data-testid="picker-network-label"]',
    );
    this.networkSubtitle = page.locator(
      '[data-testid="networks-subtitle-test-id"]',
    );
    this.networkDisplay = page.locator('[data-testid="network-display"]');

    this.addressCopyButton = page.locator(
      '[data-testid="address-copy-button-text"]',
    );
    this.selectedAccountAddress = page.locator(
      '[data-testid="selected-account-address"]',
    );

    this.ethPrimaryCurrency = page.locator(
      '[data-testid="eth-overview__primary-currency"]',
    );
    this.ethSecondaryCurrency = page.locator(
      '[data-testid="eth-overview__secondary-currency"]',
    );
    this.coinPrimaryCurrency = page.locator(
      '[data-testid="coin-overview__primary-currency"]',
    );
    this.coinSecondaryCurrency = page.locator(
      '[data-testid="coin-overview__secondary-currency"]',
    );
  }

  async isLoaded(): Promise<boolean> {
    try {
      await this.accountMenuIcon.waitFor({ state: 'visible', timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Returns balance preferring ETH-containing values over fiat.
   * Falls back through: ethPrimary → ethSecondary → coinPrimary → coinSecondary
   */
  async getBalance(): Promise<string> {
    try {
      const ethPrimary = await this.ethPrimaryCurrency
        .textContent({ timeout: 2000 })
        .catch(() => null);
      if (ethPrimary?.includes('ETH')) return ethPrimary.trim();

      const ethSecondary = await this.ethSecondaryCurrency
        .textContent({ timeout: 1500 })
        .catch(() => null);
      if (ethSecondary?.includes('ETH')) return ethSecondary.trim();

      const coinPrimary = await this.coinPrimaryCurrency
        .textContent({ timeout: 1500 })
        .catch(() => null);
      if (coinPrimary?.includes('ETH')) return coinPrimary.trim();

      const coinSecondary = await this.coinSecondaryCurrency
        .textContent({ timeout: 1500 })
        .catch(() => null);
      if (coinSecondary?.includes('ETH')) return coinSecondary.trim();

      if (ethPrimary) return ethPrimary.trim();
      if (coinPrimary) return coinPrimary.trim();

      return '';
    } catch {
      return '';
    }
  }

  /**
   * Returns network name using fallback chain:
   * networkPickerLabel → networkSubtitle → networkDisplay → networkPicker aria-label
   */
  async getNetworkName(): Promise<string> {
    try {
      if (
        await this.networkPickerLabel
          .isVisible({ timeout: 1500 })
          .catch(() => false)
      ) {
        const text = await this.networkPickerLabel.textContent();
        if (text?.trim()) return text.trim();
      }

      if (
        await this.networkSubtitle
          .isVisible({ timeout: 1500 })
          .catch(() => false)
      ) {
        const text = await this.networkSubtitle.textContent();
        if (text?.trim()) return text.trim();
      }

      if (
        await this.networkDisplay
          .isVisible({ timeout: 1500 })
          .catch(() => false)
      ) {
        const text = await this.networkDisplay.textContent();
        if (text?.trim()) return text.trim();
      }

      if (
        await this.networkPicker.isVisible({ timeout: 1500 }).catch(() => false)
      ) {
        const ariaLabel = await this.networkPicker.getAttribute('aria-label');
        if (ariaLabel?.trim()) return ariaLabel.trim();

        const innerText = await this.networkPicker.innerText();
        if (innerText?.trim()) return innerText.trim();
      }

      return '';
    } catch {
      return '';
    }
  }

  /**
   * Returns account address. May return shortened address depending on UI state.
   * Falls back: addressCopyButton (title/data-address/text) → selectedAccountAddress
   */
  async getAccountAddress(): Promise<string> {
    try {
      if (
        await this.addressCopyButton
          .isVisible({ timeout: 2000 })
          .catch(() => false)
      ) {
        const title = await this.addressCopyButton.getAttribute('title');
        if (title?.startsWith('0x')) return title;

        const dataAddress =
          await this.addressCopyButton.getAttribute('data-address');
        if (dataAddress?.startsWith('0x')) return dataAddress;

        const text = await this.addressCopyButton.textContent();
        if (text?.trim()) return text.trim();
      }

      if (
        await this.selectedAccountAddress
          .isVisible({ timeout: 2000 })
          .catch(() => false)
      ) {
        const text = await this.selectedAccountAddress.textContent();
        if (text?.trim()) return text.trim();
      }

      return '';
    } catch {
      return '';
    }
  }

  async openAccountMenu(): Promise<void> {
    await this.accountMenuIcon.click();
  }

  async openAccountOptions(): Promise<void> {
    await this.accountOptionsButton.click();
  }

  async clickSend(): Promise<void> {
    await this.sendButton.click();
  }

  async clickReceive(): Promise<void> {
    await this.receiveButton.click();
  }

  async clickSwap(): Promise<void> {
    await this.swapButton.click();
  }

  async clickBuy(): Promise<void> {
    await this.buyButton.click();
  }

  async clickBridge(): Promise<void> {
    await this.bridgeButton.click();
  }

  async switchToActivityTab(): Promise<void> {
    await this.activityTab.click();
  }

  async switchToTokensTab(): Promise<void> {
    await this.tokensTab.click();
  }

  async openSettings(): Promise<void> {
    await this.accountOptionsButton.click();
    await this.settingsButton.click();
  }

  async clickNetworkSelector(): Promise<void> {
    await this.networkPicker.click();
  }
}
