import { Driver } from '../../../webdriver/driver';

/**
 * Stellar asset details: XLM spendable breakdown, classic trustline
 * activate/deactivate CTAs, and SEP-41 balance display.
 *
 * Screen: `#/asset/:chainId/:asset?/:id?` for Stellar assets.
 * Owns: spendable balance section, activate card, deactivate button, title.
 * Boundaries: the asset details surface only.
 * Related: `TronAssetDetailsPage`, `BitcoinAssetDetailsPage`.
 *
 * @see ui/pages/asset/components/spendable-balance-section.tsx
 * @see ui/pages/asset/components/asset-activation-card.tsx
 * @see ui/pages/asset/components/token-buttons.tsx
 */
class StellarAssetDetailsPage {
  private driver: Driver;

  private readonly assetName = '[data-testid="asset-name"]';

  private readonly assetActivateButton =
    '[data-testid="asset-activate-button"]';

  private readonly assetActivateCard = '[data-testid="asset-activate-card"]';

  private readonly backButton = '.asset-page__back-button';

  private readonly deactivateAssetButton =
    '[data-testid="token-overview-deactivate-asset"]';

  private readonly activationErrorToast =
    '[data-testid="asset-activation-error-container"]';

  private readonly spendableBalanceSection =
    '[data-testid="spendable-balance-section"]';

  private readonly spendableBalanceSpendable =
    '[data-testid="spendable-balance-spendable-balance"]';

  private readonly spendableBalanceTotal =
    '[data-testid="spendable-balance-total-balance"]';

  private readonly spendableBalanceReserved =
    '[data-testid="spendable-balance-base-reserved"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkPageIsLoaded(assetTitle?: string): Promise<void> {
    console.log(
      `Check Stellar asset details page is loaded${
        assetTitle ? ` (${assetTitle})` : ''
      }`,
    );
    if (assetTitle) {
      await this.driver.waitForSelector({
        css: this.assetName,
        text: assetTitle,
      });
      return;
    }
    await this.driver.waitForSelector(this.assetName);
  }

  /**
   * Asserts the XLM spendable-balance section values.
   *
   * @param options - Expected amounts in display units (no symbol suffix)
   * @param options.totalBalance - Total native balance
   * @param options.spendableBalance - Spendable after reserve
   * @param options.minimumReserveBalance - Locked base reserve
   * @param options.symbol - Asset symbol (default `XLM`)
   */
  async checkSpendableBalance(options: {
    totalBalance: string;
    spendableBalance: string;
    minimumReserveBalance: string;
    symbol?: string;
  }): Promise<void> {
    const symbol = options.symbol ?? 'XLM';
    console.log(
      `Check spendable balance section: total=${options.totalBalance}, spendable=${options.spendableBalance}, reserved=${options.minimumReserveBalance} ${symbol}`,
    );
    await this.driver.waitForSelector(this.spendableBalanceSection);
    await this.driver.waitForSelector({
      css: this.spendableBalanceTotal,
      text: `${options.totalBalance} ${symbol}`,
    });
    await this.driver.waitForSelector({
      css: this.spendableBalanceSpendable,
      text: `${options.spendableBalance} ${symbol}`,
    });
    await this.driver.waitForSelector({
      css: this.spendableBalanceReserved,
      text: `${options.minimumReserveBalance} ${symbol}`,
    });
  }

  /**
   * Activated classic trustline: deactivate CTA visible, activate card hidden.
   *
   * @param options - Wait options
   * @param options.timeout - Max wait for deactivate CTA (e.g. after trackTransaction sync)
   */
  async checkActivatedTrustlineControls(options?: {
    timeout?: number;
  }): Promise<void> {
    console.log('Check activated trustline shows deactivate CTA');
    await this.driver.waitForSelector(this.deactivateAssetButton, {
      timeout: options?.timeout,
    });
    await this.driver.assertElementNotPresent(this.assetActivateCard);
  }

  /**
   * Imported classic trustline that is not on-chain yet: activate card + button.
   *
   * @param options - Wait options
   * @param options.timeout - Max wait for activate card (e.g. after deactivate sync)
   */
  async checkInactiveImportedTrustlineControls(options?: {
    timeout?: number;
  }): Promise<void> {
    console.log('Check imported inactive trustline shows activate card');
    await this.driver.waitForSelector(this.assetActivateCard, {
      timeout: options?.timeout,
    });
    await this.driver.waitForSelector(this.assetActivateButton, {
      timeout: options?.timeout,
    });
    await this.driver.assertElementNotPresent(this.deactivateAssetButton);
  }

  /**
   * Clicks Activate on the trustline activation card.
   */
  async clickActivate(): Promise<void> {
    console.log('Click activate asset button');
    await this.driver.waitForSelector(this.assetActivateButton);
    await this.driver.clickElement(this.assetActivateButton);
  }

  /**
   * Clicks Deactivate on an activated classic trustline.
   */
  async clickDeactivate(): Promise<void> {
    console.log('Click deactivate asset button');
    await this.driver.waitForSelector(this.deactivateAssetButton);
    await this.driver.clickElement(this.deactivateAssetButton);
  }

  /**
   * Asserts the activation/deactivation error toast is visible.
   * Shown when snap rejects deactivate of a non-zero-balance trustline.
   */
  async checkActivationErrorToastIsDisplayed(): Promise<void> {
    console.log('Check asset activation error toast is displayed');
    await this.driver.waitForSelector(this.activationErrorToast);
  }

  /**
   * SEP-41 (and similar non-trustline) assets: no activate/deactivate CTAs.
   */
  async checkNoTrustlineActivationControls(): Promise<void> {
    console.log('Check SEP-41 / non-trustline has no activate/deactivate CTAs');
    await this.driver.assertElementNotPresent(this.assetActivateCard);
    await this.driver.assertElementNotPresent(this.deactivateAssetButton);
  }

  async clickBack(): Promise<void> {
    console.log('Click back from Stellar asset details');
    await this.driver.clickElement(this.backButton);
  }
}

export default StellarAssetDetailsPage;
