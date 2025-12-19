// ShieldDetailPage class for interacting with the Shield Detail page
import { Driver } from '../../../../webdriver/driver';

export default class ShieldDetailPage {
  private readonly driver: Driver;

  private readonly addFundsModal = '[data-testid="add-funds-modal"]';

  private readonly billingAccount =
    '[data-testid="shield-detail-billing-account"]';

  private readonly billingDetailsTitleElement = (text: string) => ({
    css: '[data-testid="shield-detail-billing-details-title"]',
    text,
  });

  private readonly cancelButton =
    '[data-testid="shield-tx-membership-cancel-button"]';

  private readonly cancelMembershipButton =
    'button[data-testid="cancel-membership-modal-submit-button"]';

  private readonly cancelMembershipModal =
    '[data-testid="cancel-membership-modal"]';

  private readonly chargesElement = (text: string) => ({
    css: '[data-testid="shield-detail-charges"]',
    text,
  });

  private readonly customerIdElement = (text: string) => ({
    css: '[data-testid="shield-detail-customer-id"]',
    text,
  });

  private readonly membershipErrorBanner =
    '[data-testid="membership-error-banner"]';

  private readonly membershipStatus =
    '[data-testid="shield-detail-membership-status"]';

  private readonly membershipStatusElement = (text: string) => ({
    css: this.membershipStatus,
    text,
  });

  private readonly nextBillingElement = (text: string) => ({
    css: '[data-testid="shield-detail-next-billing"]',
    text,
  });

  private readonly notificationShieldBanner =
    '.transaction-shield-page__notification-banner';

  private readonly notificationShieldBannerElement = (text: string) => ({
    css: this.notificationShieldBanner,
    text,
  });

  private readonly pageContainer = '[data-testid="transaction-shield-page"]';

  private readonly pageTitle = {
    text: 'Transaction Shield',
    tag: 'h4',
  };

  private readonly paymentMethodElement = (text: string) => ({
    css: '[data-testid="shield-detail-payment-method"]',
    text,
  });

  private readonly paymentMethodButton =
    '[data-testid="shield-detail-payment-method-button"]';

  private readonly paymentMethodTokenButtonByText = (text: string) => ({
    css: '[data-testid="shield-payment-method-token-button"]',
    text,
  });

  private readonly shieldPaymentModal = '[data-testid="shield-payment-modal"]';

  private readonly pausedTag = '[data-testid="shield-detail-paused-tag"]';

  private readonly renewButton =
    '[data-testid="shield-tx-membership-uncancel-button"]';

  private readonly resubscribeButton =
    '[data-testid="shield-detail-resubscribe-button"]';

  private readonly submitCaseButton =
    '[data-testid="shield-detail-submit-case-button"]';

  private readonly trialTag = '[data-testid="shield-detail-trial-tag"]';

  private readonly viewBenefitsButton =
    '[data-testid="shield-detail-view-benefits-button"]';

  private readonly viewBillingHistoryButton =
    '[data-testid="shield-detail-view-billing-history-button"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  /**
   * Check if the Shield Detail page is loaded
   */
  async checkPageIsLoaded(): Promise<void> {
    console.log('Checking Shield Detail page is loaded with selectors:', [
      this.pageContainer,
      this.membershipStatus,
    ]);
    await this.driver.waitForMultipleSelectors([
      this.pageContainer,
      this.membershipStatus,
    ]);
    console.log('Shield Detail page is loaded');
  }

  /**
   * Check if membership status contains expected text
   *
   * @param expectedText - The expected text to verify
   */
  async checkMembershipStatus(expectedText: string): Promise<void> {
    console.log(`Checking membership status contains: ${expectedText}`);
    await this.driver.waitForSelector(
      this.membershipStatusElement(expectedText),
    );
  }

  /**
   * Check if customer ID contains expected text
   *
   * @param expectedText - The expected text to verify
   */
  async checkCustomerId(expectedText: string): Promise<void> {
    console.log(`Checking customer ID contains: ${expectedText}`);
    await this.driver.waitForSelector(this.customerIdElement(expectedText));
  }

  /**
   * Check if trial tag is displayed
   */
  async checkTrialTagDisplayed(): Promise<void> {
    console.log('Checking trial tag is displayed');
    await this.driver.waitForSelector(this.trialTag);
  }

  /**
   * Check if paused tag is displayed
   */
  async checkPausedTagDisplayed(): Promise<void> {
    console.log('Checking paused tag is displayed');
    await this.driver.waitForSelector(this.pausedTag);
  }

  /**
   * Click the View Full Benefits button
   */
  async clickViewBenefitsButton(): Promise<void> {
    console.log('Clicking View Full Benefits button');
    await this.driver.clickElement(this.viewBenefitsButton);
  }

  /**
   * Click the Submit Case button
   */
  async clickSubmitCaseButton(): Promise<void> {
    console.log('Clicking Submit Case button');
    await this.driver.clickElement(this.submitCaseButton);
  }

  /**
   * Click the Resubscribe button
   */
  async clickResubscribeButton(): Promise<void> {
    console.log('Clicking Resubscribe button');
    await this.driver.clickElement(this.resubscribeButton);
  }

  /**
   * Click the Cancel Membership button
   */
  async clickCancelButton(): Promise<void> {
    console.log('Clicking Cancel Membership button');
    await this.driver.clickElement(this.cancelButton);
  }

  /**
   * Click the Cancel Membership button
   */
  async cancelSubscription(): Promise<void> {
    console.log('Cancelling subscription');
    await this.driver.clickElement(this.cancelButton);
    await this.driver.clickElementAndWaitToDisappear(
      this.cancelMembershipButton,
    );
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
   * Check if billing details title contains expected text
   *
   * @param expectedText - The expected text to verify
   */
  async checkBillingDetailsTitle(expectedText: string): Promise<void> {
    console.log(`Checking billing details title contains: ${expectedText}`);
    await this.driver.waitForSelector(
      this.billingDetailsTitleElement(expectedText),
    );
  }

  /**
   * Check if next billing date contains expected text
   *
   * @param expectedText - The expected text to verify
   */
  async checkNextBillingDate(expectedText: string): Promise<void> {
    console.log(`Checking next billing date contains: ${expectedText}`);
    await this.driver.waitForSelector(this.nextBillingElement(expectedText));
  }

  /**
   * Check if charges contain expected text
   *
   * @param expectedText - The expected text to verify
   */
  async checkCharges(expectedText: string): Promise<void> {
    console.log(`Checking charges contain: ${expectedText}`);
    await this.driver.waitForSelector(this.chargesElement(expectedText));
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
   * Check if notification shield banner contains expected text
   *
   * @param expectedText - The expected text to verify
   */
  async checkNotificationShieldBanner(expectedText: string): Promise<void> {
    console.log(
      `Checking notification shield banner contains: ${expectedText}`,
    );
    await this.driver.waitForSelector(
      this.notificationShieldBannerElement(expectedText),
    );
  }

  /**
   * Check the membership notification banner is removed
   */
  async checkNotificationShieldBannerRemoved(): Promise<void> {
    console.log('Checking notification shield banner is removed');
    await this.driver.assertElementNotPresent(this.notificationShieldBanner);
  }

  async validateShieldDetailPage(options?: {
    customerId?: string;
    membershipStatus?: string;
    nextBillingDate?: string;
    charges?: string;
    paymentMethod?: string;
    expectTrialTag?: boolean;
  }): Promise<void> {
    const {
      customerId = 'test_customer_id',
      membershipStatus = 'Active plan',
      nextBillingDate = 'Nov 3',
      charges = '$80',
      paymentMethod = 'Visa',
      expectTrialTag = true,
    } = options || {};

    await this.checkPageIsLoaded();

    await this.checkCustomerId(customerId);

    if (expectTrialTag) {
      await this.checkTrialTagDisplayed();
    }

    await this.checkMembershipStatus(membershipStatus);

    await this.checkNextBillingDate(nextBillingDate);

    await this.checkCharges(charges);

    await this.checkPaymentMethod(paymentMethod);
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
