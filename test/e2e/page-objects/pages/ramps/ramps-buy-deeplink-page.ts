import { Driver } from '../../../webdriver/driver';

/**
 * Destination page for `/buy` deep links when the unified buy (`rampsEnabled`)
 * feature flag is on.
 *
 * The deep link router lands on the buy deep link entry screen
 * (`/ramps/buy-deeplink-entry`), which hands the link params to the in-app buy
 * flow. The flow then applies its eligibility gating; because the ramps APIs
 * are not mocked in these tests, the flow may either navigate to one of its
 * screens or surface an eligibility modal. Both outcomes prove the link was
 * routed into the in-app flow instead of the external Portfolio redirect.
 */
class RampsBuyDeepLinkPage {
  private driver: Driver;

  // Private selector properties (sorted alphabetically)
  private readonly rampsEligibilityModal = {
    css: '[data-testid^="ramps-"][data-testid$="-modal"]',
  };

  private readonly rampsFlowHashPath = '/ramps/';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  // Public methods (sorted alphabetically)
  async checkPageIsLoaded(): Promise<void> {
    await this.driver.waitUntil(
      async () => {
        const url = await this.driver.getCurrentUrl();
        if (new URL(url).hash.includes(this.rampsFlowHashPath)) {
          return true;
        }
        // An eligibility modal also proves the link was routed into the
        // in-app flow (it may bounce back home after showing the modal).
        const hasEligibilityModal = await this.driver.executeScript(
          `return Boolean(document.querySelector('${this.rampsEligibilityModal.css}'));`,
        );
        return Boolean(hasEligibilityModal);
      },
      { timeout: 15000, interval: 500 },
    );
    console.log('Buy deep link routed into the in-app buy flow');
  }
}

export default RampsBuyDeepLinkPage;
