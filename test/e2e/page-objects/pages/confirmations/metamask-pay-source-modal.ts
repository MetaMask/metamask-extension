import { tEn } from '../../../../lib/i18n-helpers';
import { Driver } from '../../../webdriver/driver';

/**
 * The MetaMask Pay "Pay with" token picker opened from the pay-with pill on
 * quote-backed confirmations (Money Account deposit, Perps, mUSD conversion).
 *
 * Screen: modal over the confirmation.
 * Owns: the modal-loaded check, the optional "Other assets" section row
 * (rendered when Money Account pay is enabled for the transaction type) and
 * picking a wallet token from the asset list.
 * Boundaries: the pill that opens the modal belongs to the confirmation page
 * object (e.g. `MoneyAccountDepositConfirmation`).
 *
 * @see ui/pages/confirmations/components/modals/pay-with-modal/pay-with-modal.tsx
 */
export class PayWithModal {
  private readonly driver: Driver;

  private readonly otherAssetsRow = {
    testId: 'pay-with-crypto-section-other-assets-row',
  };

  private readonly searchInput = { testId: 'asset-filter-search-input' };

  private readonly sections = { testId: 'pay-with-sections' };

  private readonly title = {
    css: 'header',
    text: tEn('payWithModalTitle'),
  };

  private readonly tokenAsset = (chainId: string, symbol: string) => ({
    testId: `token-asset-${chainId}-${symbol}`,
  });

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkPageIsLoaded(): Promise<void> {
    console.log('Wait for Pay with modal to load');
    await this.driver.waitForSelector(this.title);
  }

  /**
   * Open the full wallet asset list. When Money Account pay is enabled for the
   * transaction type the modal first shows payment-method sections and the
   * asset list sits behind "Other assets"; otherwise the asset list is shown
   * directly and there is nothing to click.
   */
  async openOtherAssets(): Promise<void> {
    if (await this.driver.isElementPresent(this.sections)) {
      console.log('Click Pay with "Other assets"');
      await this.driver.clickElement(this.otherAssetsRow);
    }
    await this.driver.waitForSelector(this.searchInput);
  }

  async selectToken(chainId: string, symbol: string): Promise<void> {
    console.log(`Select pay token ${symbol} on ${chainId}`);
    await this.driver.clickElement(this.tokenAsset(chainId, symbol));
    await this.driver.assertElementNotPresent(this.title);
  }
}

export default PayWithModal;
