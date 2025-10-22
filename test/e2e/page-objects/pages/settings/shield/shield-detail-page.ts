// ShieldDetailPage class for interacting with the Shield Detail page
import { Driver } from '../../../../webdriver/driver';

export default class ShieldDetailPage {
  private readonly driver: Driver;

  // Page identification
  private readonly pageTitle = {
    text: 'Transaction Shield',
    tag: 'h4',
  };

  // Main page container
  private readonly pageContainer = '[data-testid="transaction-shield-page"]';

  // Membership status elements
  private readonly membershipStatus =
    '[data-testid="shield-detail-membership-status"]';

  private readonly customerId = '[data-testid="shield-detail-customer-id"]';

  private readonly trialTag = '[data-testid="shield-detail-trial-tag"]';

  private readonly pausedTag = '[data-testid="shield-detail-paused-tag"]';

  // Action buttons
  private readonly viewBenefitsButton =
    '[data-testid="shield-detail-view-benefits-button"]';

  private readonly submitCaseButton =
    '[data-testid="shield-detail-submit-case-button"]';

  private readonly resubscribeButton =
    '[data-testid="shield-detail-resubscribe-button"]';

  private readonly cancelButton =
    '[data-testid="shield-tx-membership-cancel-button"]';

  private readonly renewButton =
    '[data-testid="shield-detail-resubscribe-button"]';

  private readonly viewBillingHistoryButton =
    '[data-testid="shield-detail-view-billing-history-button"]';

  // Billing details section
  private readonly billingDetailsTitle =
    '[data-testid="shield-detail-billing-details-title"]';

  private readonly nextBilling = '[data-testid="shield-detail-next-billing"]';

  private readonly charges = '[data-testid="shield-detail-charges"]';

  private readonly billingAccount =
    '[data-testid="shield-detail-billing-account"]';

  private readonly paymentMethod =
    '[data-testid="shield-detail-payment-method"]';

  // Notification banners
  private readonly notificationShieldBanner =
    '.transaction-shield-page__notification-banner';

  private readonly membershipErrorBanner =
    '[data-testid="membership-error-banner"]';

  // Modal elements
  private readonly cancelMembershipModal =
    '[data-testid="cancel-membership-modal"]';

  private readonly cancelMembershipButton =
    'button[data-testid="cancel-membership-modal-submit-button"]';

  private readonly addFundsModal = '[data-testid="add-funds-modal"]';

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
   * Get the membership status text
   */
  async getMembershipStatus(): Promise<string> {
    console.log('Getting membership status');
    const element = await this.driver.findElement(this.membershipStatus);
    const membershipStatusText = await element.getText();
    console.log('Membership status text:', membershipStatusText);
    return membershipStatusText;
  }

  /**
   * Get the customer ID text
   */
  async getCustomerId(): Promise<string> {
    console.log('Getting customer ID');
    const element = await this.driver.findElement(this.customerId);
    const customerIdText = await element.getText();
    console.log('Customer ID text:', customerIdText);
    return customerIdText;
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
    await this.driver.clickElement(this.cancelMembershipButton);
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
   * Get the billing details title text
   */
  async getBillingDetailsTitle(): Promise<string> {
    console.log('Getting billing details title');

    const element = await this.driver.findElement(this.billingDetailsTitle);
    const billingDetailsTitleText = await element.getText();
    console.log('Billing details title text:', billingDetailsTitleText);
    return billingDetailsTitleText;
  }

  /**
   * Get the next billing date text
   */
  async getNextBillingDate(): Promise<string> {
    console.log('Getting next billing date');

    const element = await this.driver.findElement(this.nextBilling);
    const nextBillingDateText = await element.getText();
    console.log('Next billing date text:', nextBillingDateText);
    return nextBillingDateText;
  }

  /**
   * Get the charges text
   */
  async getCharges(): Promise<string> {
    console.log('Getting charges');

    const element = await this.driver.findElement(this.charges);
    const chargesText = await element.getText();
    console.log('Charges text:', chargesText);
    return chargesText;
  }

  /**
   * Get the payment method text
   */
  async getPaymentMethod(): Promise<string> {
    console.log('Getting payment method');

    const element = await this.driver.findElement(this.paymentMethod);
    const paymentMethodText = await element.getText();
    console.log('Payment method text:', paymentMethodText);
    return paymentMethodText;
  }

  /**
   * Wait for the page to be fully loaded with all elements
   */
  async waitForPageToLoad(): Promise<void> {
    await this.driver.waitForMultipleSelectors([
      this.pageContainer,
      this.membershipStatus,
      this.billingDetailsTitle,
    ]);
    console.log('Shield Detail page fully loaded');
  }

  /**
   * Get the notification shield banner text
   */
  async getNotificationShieldBanner(): Promise<string> {
    console.log('Getting notification shield banner');

    const element = await this.driver.findElement(
      this.notificationShieldBanner,
    );
    const notificationShieldBannerText = await element.getText();
    console.log(
      'Notification shield banner text:',
      notificationShieldBannerText,
    );
    return notificationShieldBannerText;
  }

  /**
   * Check the membership notification banner is removed
   */
  async checkNotificationShieldBannerRemoved(): Promise<void> {
    console.log('Checking notification shield banner is removed');
    await this.driver.assertElementNotPresent(this.notificationShieldBanner);
  }
}
