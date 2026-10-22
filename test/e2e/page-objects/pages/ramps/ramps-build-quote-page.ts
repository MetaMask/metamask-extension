import { Driver } from '../../../webdriver/driver';

/**
 * Ramps build-quote screen: fiat amount, payment method, provider, quote, and
 * the Continue action that opens the provider checkout tab.
 */
class RampsBuildQuotePage {
  private readonly amountInput =
    '[data-testid="ramps-build-quote-amount-input"]';

  private readonly buildQuoteScreen =
    '[data-testid="ramps-build-quote-screen"]';

  private readonly continueButton =
    '[data-testid="ramps-build-quote-continue"]';

  private driver: Driver;

  private readonly providerLabel =
    '[data-testid="ramps-build-quote-provider-label"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkPageIsLoaded(): Promise<void> {
    await this.driver.waitForSelector(this.buildQuoteScreen);
  }

  /**
   * Checks the provider label rendered under the quote.
   *
   * @param providerName - Expected provider display name.
   */
  async checkProviderLabel(providerName: string): Promise<void> {
    await this.driver.waitForSelector({
      css: this.providerLabel,
      text: providerName,
    });
  }

  async clickContinue(): Promise<void> {
    await this.driver.clickElement(this.continueButton);
  }

  /**
   * Sets the fiat amount.
   *
   * @param amount - Fiat amount as a string, e.g. "100".
   */
  async enterAmount(amount: string): Promise<void> {
    await this.driver.fill(this.amountInput, amount);
  }

  /**
   * Waits for the quote request to settle and Continue to become enabled.
   */
  async waitForQuote(): Promise<void> {
    await this.driver.wait(async () => {
      const buttons = await this.driver.findElements(this.continueButton);
      return buttons.length > 0 && (await buttons[0].isEnabled());
    }, 30000);
  }
}

export default RampsBuildQuotePage;
