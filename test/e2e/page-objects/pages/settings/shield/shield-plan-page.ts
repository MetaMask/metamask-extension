import { Driver } from '../../../../webdriver/driver';

/**
 * Shield plan picker: annual/monthly and continue into checkout.
 *
 * Screen: `#/shield-plan`, reached from the Shield entry modal or from
 * manage-plan flows off `ShieldDetailPage`.
 * Owns: plan page load, annual/monthly selection (card vs crypto monthly),
 * continue, back, and the combined subscribe helper.
 * Boundaries: plan choice only. After continue, Stripe/checkout or
 * `ShieldSubscriptionApprovePage` takes over; membership detail is
 * `ShieldDetailPage`.
 * Related: `ShieldDetailPage`, `ShieldSubscriptionApprovePage`.
 *
 * @see ui/pages/shield/plan/shield-plan.tsx
 */
export default class ShieldPlanPage {
  private readonly annualPlanButton =
    '[data-testid="shield-plan-annual-button"]';

  private readonly assetListItemBySymbol = (symbol: string) => ({
    css: '[data-testid="asset-list-item"]',
    text: symbol,
  });

  private readonly backButton = '[data-testid="shield-plan-back-button"]';

  private readonly continueButton =
    '[data-testid="shield-plan-continue-button"]';

  private readonly driver: Driver;

  private readonly monthlyPlanButton = (paymentMethod: 'card' | 'crypto') =>
    paymentMethod === 'crypto'
      ? '[data-testid="shield-plan-monthly*-button"]'
      : '[data-testid="shield-plan-monthly-button"]';

  private readonly page = {
    testId: 'parent-selector-shield-plan-page',
  };

  private readonly paymentModalCryptoTokenButton =
    '[data-testid="shield-payment-method-token-button"]';

  // "Pay with" row has no data-testid; using label selector.
  private readonly payWithButton = {
    xpath: '//button[.//*[contains(text(),"Pay with")]]',
  };

  private readonly shieldPaymentModal = '[data-testid="shield-payment-modal"]';

  private readonly shieldPlanPageAnnualPlan = {
    text: 'Annual',
    tag: 'p',
  };

  private readonly shieldPlanPageMonthlyPlan = {
    text: 'Monthly',
    tag: 'p',
  };

  private readonly shieldPlanPageTitle = {
    text: 'Choose your plan',
    tag: 'h4',
  };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkPageIsLoaded(): Promise<void> {
    console.log('Checking Shield plan page is loaded with selectors:', [
      this.shieldPlanPageTitle,
      this.shieldPlanPageAnnualPlan,
      this.shieldPlanPageMonthlyPlan,
    ]);
    await this.driver.waitForMultipleSelectors([
      this.page,
      this.shieldPlanPageTitle,
      this.shieldPlanPageAnnualPlan,
      this.shieldPlanPageMonthlyPlan,
    ]);
    console.log('Shield plan page is loaded');
  }

  async clickBackButton(): Promise<void> {
    console.log('Clicking back button on Shield plan page');
    await this.driver.clickElement(this.backButton);
  }

  async clickContinueButton(): Promise<void> {
    console.log('Clicking Continue button to start Stripe checkout');
    await this.driver.clickElement(this.continueButton);
  }

  async completeShieldPlanSubscriptionFlow(
    plan: 'annual' | 'monthly',
    paymentMethod: 'card' | 'crypto',
  ): Promise<void> {
    console.log(
      `Completing shield plan subscription flow with ${paymentMethod} payment for ${plan} plan`,
    );
    await this.checkPageIsLoaded();

    if (plan === 'annual') {
      await this.selectAnnualPlan();
    } else {
      await this.selectMonthlyPlan(paymentMethod);
    }

    // The assets-controller pre-seeds mUSD (Money/Earn implementation), which is also the default Shield payment token.
    // This ensures we select USDC to keep test consistent.
    if (paymentMethod === 'crypto') {
      await this.selectCryptoPaymentToken('USDC');
    }

    await this.clickContinueButton();
  }

  async selectAnnualPlan(): Promise<void> {
    console.log('Selecting Annual plan');
    await this.driver.clickElement(this.annualPlanButton);
  }

  async selectCryptoPaymentToken(tokenSymbol: string): Promise<void> {
    console.log(`Selecting crypto payment token: ${tokenSymbol}`);
    await this.driver.clickElement(this.payWithButton);
    await this.driver.waitForSelector(this.shieldPaymentModal);
    // The crypto row is disabled until a stablecoin balance loads; wait for it.
    await this.driver.findClickableElement(this.paymentModalCryptoTokenButton);
    await this.driver.clickElement(this.paymentModalCryptoTokenButton);
    await this.driver.clickElement(this.assetListItemBySymbol(tokenSymbol));
  }

  async selectMonthlyPlan(
    paymentMethod: 'card' | 'crypto' = 'card',
  ): Promise<void> {
    console.log(`Selecting Monthly plan (${paymentMethod})`);
    await this.driver.clickElement(this.monthlyPlanButton(paymentMethod));
  }
}
