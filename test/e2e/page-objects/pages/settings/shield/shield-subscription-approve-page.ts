import TransactionConfirmation from '../../confirmations/transaction-confirmation';
import { RawLocator } from '../../../common';

/**
 * Confirmation for Shield crypto subscription approve transactions.
 *
 * Screen: wallet confirmation layered after starting a crypto Shield plan;
 * extends `TransactionConfirmation`.
 * Owns: Shield-specific sections (subscription details, estimated changes,
 * account details), payment-token checks in estimated changes, and Start now
 * via the shared footer confirm.
 * Boundaries: confirmation chrome only. Plan selection belongs to
 * `ShieldPlanPage`; post-approve membership UI to `ShieldDetailPage`.
 * Related: `ShieldPlanPage`, `ShieldDetailPage`, `TransactionConfirmation`.
 *
 * @see ui/pages/confirmations/components/confirm/info/shield-subscription-approve/shield-subscription-approve.tsx
 */
class ShieldSubscriptionApprovePage extends TransactionConfirmation {
  private readonly accountDetailsSection: RawLocator =
    '[data-testid="shield-subscription-approve__account_details_section"]';

  private readonly estimatedChangesSection: RawLocator =
    '[data-testid="shield-subscription-approve__estimated_changes_section"]';

  private readonly estimatedChangesSectionByText = (text: string) => ({
    css: this.estimatedChangesSection,
    text,
  });

  private readonly subscriptionDetailsSection: RawLocator =
    '[data-testid="shield-subscription-approve__subscription_details_section"]';

  async checkPageIsLoaded(): Promise<void> {
    console.log('Checking Shield Subscription Approve page is loaded');
    await this.driver.waitForMultipleSelectors([
      this.subscriptionDetailsSection,
      this.estimatedChangesSection,
      this.accountDetailsSection,
    ]);
  }

  /**
   * Verify that the payment method token is displayed in the estimated changes section
   *
   * @param tokenSymbol - The token symbol to verify (e.g., 'USDT', 'USDC')
   */
  async checkPaymentMethodInEstimatedChanges(
    tokenSymbol: string,
  ): Promise<void> {
    console.log(
      `Checking that ${tokenSymbol} is displayed in estimated changes section`,
    );
    await this.driver.waitForSelector(
      this.estimatedChangesSectionByText(tokenSymbol),
    );
  }

  async clickStartNowButton(): Promise<void> {
    console.log('Clicking Start now button');
    await this.clickFooterConfirmButton();
  }
}

export default ShieldSubscriptionApprovePage;
