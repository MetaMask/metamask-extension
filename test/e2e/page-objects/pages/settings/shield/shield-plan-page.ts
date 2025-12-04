// Enhanced ShieldPlanPage class
import { Driver } from '../../../../webdriver/driver';

export default class ShieldPlanPage {
  private readonly driver: Driver;

  private readonly annualPlanButton =
    '[data-testid="shield-plan-annual-button"]';

  private readonly backButton = '[data-testid="shield-plan-back-button"]';

  private readonly continueButton =
    '[data-testid="shield-plan-continue-button"]';

  private readonly monthlyPlanButton = (paymentMethod: 'card' | 'crypto') =>
    paymentMethod === 'crypto'
      ? '[data-testid="shield-plan-monthly*-button"]'
      : '[data-testid="shield-plan-monthly-button"]';

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

  async selectMonthlyPlan(
    paymentMethod: 'card' | 'crypto' = 'card',
  ): Promise<void> {
    console.log(`Selecting Monthly plan (${paymentMethod})`);
    await this.driver.clickElement(this.monthlyPlanButton(paymentMethod));
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

    await this.clickContinueButton();
  }
}
