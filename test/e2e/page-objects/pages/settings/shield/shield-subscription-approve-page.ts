import TransactionConfirmation from '../../confirmations/redesign/transaction-confirmation';
import { RawLocator } from '../../../common';

class ShieldSubscriptionApprovePage extends TransactionConfirmation {
  private readonly accountDetailsSection: RawLocator =
    '[data-testid="shield-subscription-approve__account_details_section"]';

  private readonly estimatedChangesSection: RawLocator =
    '[data-testid="shield-subscription-approve__estimated_changes_section"]';

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

  async clickStartNowButton(): Promise<void> {
    console.log('Clicking Start now button');
    await this.clickFooterConfirmButton();
  }
}

export default ShieldSubscriptionApprovePage;
