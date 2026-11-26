import { Driver } from '../../../../webdriver/driver';

/**
 * Transaction Shield manage plan: payment method, billing history, cancel and
 * renew membership.
 *
 * Screen: `#/settings/transaction-shield/manage-plan`, reached from
 * `ShieldDetailPage.clickManagePlanButton`.
 * Owns: payment method row and payment modal, billing history entry, cancel
 * membership modal, renew membership.
 * Boundaries: manage plan only. Membership status and billing details belong
 * to `ShieldDetailPage`; crypto approve confirmation to
 * `ShieldSubscriptionApprovePage`.
 * Related: `ShieldDetailPage`, `ShieldSubscriptionApprovePage`.
 *
 * @see ui/pages/shield/transaction-shield/manage-shield-plan/manage-shield-plan.tsx
 */
export default class ShieldManagePlanPage {
  private readonly cancelButton =
    '[data-testid="shield-tx-membership-cancel-button"]';

  private readonly cancelMembershipButton =
    'button[data-testid="cancel-membership-modal-submit-button"]';

  private readonly driver: Driver;

  private readonly pageContainer = '[data-testid="manage-plan-page"]';

  private readonly paymentMethodButton =
    '[data-testid="shield-detail-payment-method-button"]';

  private readonly paymentMethodElement = (text: string) => ({
    css: '[data-testid="shield-detail-payment-method"]',
    text,
  });

  private readonly paymentMethodTokenButtonByText = (text: string) => ({
    css: '[data-testid="shield-payment-method-token-button"]',
    text,
  });

  private readonly renewButton =
    '[data-testid="shield-tx-membership-uncancel-button"]';

  private readonly shieldPaymentModal = '[data-testid="shield-payment-modal"]';

  private readonly viewBillingHistoryButton =
    '[data-testid="shield-detail-view-billing-history-button"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  /**
   * Cancel the membership and confirm it in the cancel membership modal
   */
  async cancelSubscription(): Promise<void> {
    console.log('Cancelling subscription');
    await this.driver.clickElement(this.cancelButton);
    await this.driver.clickElementAndWaitToDisappear(
      this.cancelMembershipButton,
    );
  }

  async checkPageIsLoaded(): Promise<void> {
    console.log('Checking Shield Manage Plan page is loaded');
    await this.driver.waitForSelector(this.pageContainer);
    console.log('Shield Manage Plan page is loaded');
  }

  /**
   * Check if payment method contains expected text
   *
   * @param expectedText - The expected text to verify
   */
  async checkPaymentMethod(expectedText: string): Promise<void> {
    console.log(`Checking payment method contains: ${expectedText}`);
    await this.driver.waitForSelector(this.paymentMethodElement(expectedText));
  }

  /**
   * Click the Cancel Membership button
   */
  async clickCancelButton(): Promise<void> {
    console.log('Clicking Cancel Membership button');
    await this.driver.clickElement(this.cancelButton);
  }

  /**
   * Click on the payment method button to open the payment modal
   */
  async clickPaymentMethod(): Promise<void> {
    console.log('Clicking on payment method button');
    await this.driver.waitForSelector(this.paymentMethodButton);
    await this.driver.clickElement(this.paymentMethodButton);
    await this.driver.waitForSelector(this.shieldPaymentModal);
  }

  /**
   * Click the Renew Membership button
   */
  async clickRenewButton(): Promise<void> {
    console.log('Clicking Renew Membership button');
    await this.driver.clickElement(this.renewButton);
  }

  /**
   * Click the View Billing History button
   */
  async clickViewBillingHistoryButton(): Promise<void> {
    console.log('Clicking View Billing History button');
    await this.driver.clickElement(this.viewBillingHistoryButton);
  }

  /**
   * Select payment method token in the payment modal
   *
   * @param paymentMethodText - The full payment method text to select (e.g., 'Pay with USDT', 'Pay with USDC')
   */
  async selectPaymentMethodInModal(paymentMethodText: string): Promise<void> {
    console.log(`Selecting payment method: ${paymentMethodText}`);
    await this.driver.clickElement(
      this.paymentMethodTokenButtonByText(paymentMethodText),
    );
  }
}
