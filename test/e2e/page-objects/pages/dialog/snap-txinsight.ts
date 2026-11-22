import { Driver } from '../../../webdriver/driver';

/**
 * Snap transaction-insights panel embedded in a confirmation dialog.
 *
 * Screen: insight section under an open transaction/signature confirmation
 * dialog, shown when an insights snap (e.g. Insights Example Snap) returns UI.
 * Owns: insight title, snap UI address, and rendered insight text checks.
 * Boundaries: only the snaps insight section. Confirm/reject of the parent
 * confirmation belongs to confirmation page objects; snap install belongs to
 * `SnapInstall`.
 * Related: confirmation page objects under `pages/confirmations/`,
 * `SnapInstall` for installing the insights snap.
 *
 * @see ui/pages/confirmations/components/confirm/snaps/snaps-section/snap-insight.tsx
 */
class SnapTxInsights {
  private driver: Driver;

  private readonly insightTitle = {
    text: 'Insights Example Snap',
    tag: 'span',
  };

  private readonly transactionAddress = '[data-testid="snap-ui-address"]';

  private readonly transactionType = '.snap-ui-renderer__text';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkPageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([
        this.insightTitle,
        this.transactionAddress,
      ]);
    } catch (e) {
      console.log(
        'Timeout while waiting for Snap txInsight section to be loaded under transaction confirmation dialog',
        e,
      );
      throw e;
    }
    console.log(
      'Snap txInsight section is loaded under transaction confirmation dialog',
    );
  }

  async checkTransactionAddress(address: string) {
    console.log('Checking transaction address');
    await this.driver.waitForSelector({
      css: this.transactionAddress,
      text: address,
    });
  }

  async checkTransactionInsightsTitle() {
    console.log('Checking transaction insights title');
    await this.driver.waitForSelector(this.insightTitle);
  }

  async checkTransactionInsightsType(transactionType: string) {
    console.log('Checking transaction insights type');
    await this.driver.waitForSelector({
      css: this.transactionType,
      text: transactionType,
    });
  }
}

export default SnapTxInsights;
