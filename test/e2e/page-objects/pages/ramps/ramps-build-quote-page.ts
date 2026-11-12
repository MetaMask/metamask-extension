import { Driver } from '../../../webdriver/driver';

/**
 * The ramps build-quote screen: fiat amount, payment method, provider, quote,
 * and the Continue action that opens the provider checkout tab. Deep links
 * with a token intent also land here when the ramps catalog is populated: the
 * entry page pre-selects the link's token, so reaching build-quote with the
 * right token proves the full routing chain — intent parsed from the link,
 * token found in the catalog, and accepted by the RampsController — not merely
 * that the router landed in the app.
 */
class RampsBuildQuotePage {
  private driver: Driver;

  // Private selector properties (sorted alphabetically)
  private readonly rampsBuildQuoteAmountInput =
    '[data-testid="ramps-build-quote-amount-input"]';

  private readonly rampsBuildQuoteContinueButton =
    '[data-testid="ramps-build-quote-continue"]';

  private readonly rampsBuildQuoteHashPath = '#/ramps/build-quote';

  private readonly rampsBuildQuoteProviderLabel =
    '[data-testid="ramps-build-quote-provider-label"]';

  private readonly rampsBuildQuoteScreen =
    '[data-testid="ramps-build-quote-screen"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  // Public methods (sorted alphabetically)
  async checkPageIsLoaded(): Promise<void> {
    await this.driver.waitForUrlContaining({
      url: this.rampsBuildQuoteHashPath,
    });
    await this.driver.waitForSelector(this.rampsBuildQuoteScreen);
  }

  /**
   * Checks the provider label rendered under the quote.
   *
   * @param providerName - Expected provider display name.
   */
  async checkProviderLabel(providerName: string): Promise<void> {
    await this.driver.waitForSelector({
      css: this.rampsBuildQuoteProviderLabel,
      text: providerName,
    });
  }

  /**
   * Checks the screen title ("Buy <symbol>"), which shows the token the flow
   * pre-selected.
   *
   * @param symbol - The expected token symbol.
   */
  async checkSelectedToken(symbol: string): Promise<void> {
    await this.driver.waitForSelector({
      css: this.rampsBuildQuoteScreen,
      text: `Buy ${symbol}`,
    });
  }

  async clickContinue(): Promise<void> {
    await this.driver.clickElement(this.rampsBuildQuoteContinueButton);
  }

  /**
   * Sets the fiat amount.
   *
   * @param amount - Fiat amount as a string, e.g. "100".
   */
  async enterAmount(amount: string): Promise<void> {
    await this.driver.fill(this.rampsBuildQuoteAmountInput, amount);
  }

  /**
   * Waits for the quote request to settle and Continue to become enabled.
   */
  async waitForQuote(): Promise<void> {
    await this.driver.wait(async () => {
      const buttons = await this.driver.findElements(
        this.rampsBuildQuoteContinueButton,
      );
      return buttons.length > 0 && (await buttons[0].isEnabled());
    }, 30000);
  }
}

export default RampsBuildQuotePage;
