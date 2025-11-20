// Enhanced ShieldPlanPage class
import { Driver } from '../../../../webdriver/driver';

export default class ShieldPlanPage {
  private readonly driver: Driver;

  private readonly annualPlanButton =
    '[data-testid="shield-plan-annual-button"]';

  private readonly backButton = '[data-testid="shield-plan-back-button"]';

  private readonly cardPaymentOption =
    '[data-testid="shield-payment-method-card-button"]';

  private readonly continueButton =
    '[data-testid="shield-plan-continue-button"]';

  private readonly cryptoPaymentOption =
    '[data-testid="shield-payment-method-token-button"]';

  private readonly monthlyPlanButton =
    '[data-testid="shield-plan-monthly-button"]';

  private readonly monthlyCryptoPlanButton =
    '[data-testid="shield-plan-monthly*-button"]';

  private readonly paymentMethodButton =
    '[data-testid="shield-plan-payment-method-button"]';

  private readonly paymentModal = '[data-testid="shield-payment-modal"]';

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

  async selectAnnualPlan(): Promise<void> {
    console.log('Selecting Annual plan');
    await this.driver.clickElement(this.annualPlanButton);
  }

  async selectMonthlyPlan(): Promise<void> {
    console.log('Selecting Monthly plan');
    await this.driver.clickElement(this.monthlyPlanButton);
  }

  async selectMonthlyCryptoPlan(): Promise<void> {
    console.log('Selecting Monthly crypto plan');
    await this.driver.clickElement(this.monthlyCryptoPlanButton);
  }

  async clickContinueButton(): Promise<void> {
    console.log('Clicking Continue button to start Stripe checkout');
    await this.driver.clickElement(this.continueButton);
  }

  async selectCryptoPaymentMethod(): Promise<void> {
    console.log('Selecting crypto payment method');
    await this.driver.clickElement(this.paymentMethodButton);
    await this.driver.waitForSelector(this.paymentModal);
    await this.driver.clickElement(this.cryptoPaymentOption);
    await this.driver.assertElementNotPresent(this.paymentModal);
  }

  async selectCardPaymentMethod(): Promise<void> {
    console.log('Selecting card payment method');
    await this.driver.clickElement(this.paymentMethodButton);
    await this.driver.waitForSelector(this.paymentModal);
    await this.driver.clickElement(this.cardPaymentOption);
    await this.driver.assertElementNotPresent(this.paymentModal);
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
    } else if (paymentMethod === 'crypto') {
      await this.selectMonthlyCryptoPlan();
    } else {
      await this.selectMonthlyPlan();
    }

    await this.clickContinueButton();
  }
}
