import { Driver } from '../../../webdriver/driver';

/**
 * Multichain wallet details: accounts under a named wallet.
 *
 * Screen: `#/multichain-wallet-details-page`.
 * Owns: loaded check for the `{walletName} / Accounts` header.
 * Boundaries: wallet-level shell only. Per-account details belong to
 * `MultichainAccountDetailsPage`.
 * Related: `MultichainAccountDetailsPage`.
 *
 * @see ui/pages/multichain-accounts/wallet-details-page/wallet-details-page.tsx
 */
class MultichainWalletDetailsPage {
  private readonly driver: Driver;

  private readonly parentSelector =
    '[data-testid="parent-selector-multichain-wallet-details-page"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkPageIsLoaded(walletName: string): Promise<void> {
    await this.driver.waitForSelector(this.parentSelector);
    await this.driver.waitForSelector({
      css: 'h4',
      text: `${walletName} / Accounts`,
    });
  }
}

export default MultichainWalletDetailsPage;
