import { Driver } from '../../../webdriver/driver';

/**
 * Destination page for `/buy` deep links when the unified buy (`rampsEnabled`)
 * feature flag is on: the router lands on `/ramps/buy-deeplink-entry`, which
 * hands the link params to the in-app buy flow. With ramps APIs unmocked, the
 * flow either navigates to one of its screens or surfaces an eligibility
 * modal — both prove routing into the in-app flow, not the external redirect.
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
        // An eligibility modal also proves in-app routing (the flow may
        // bounce back home after showing the modal).
        const hasEligibilityModal = await this.driver.executeScript(
          `return Boolean(document.querySelector('${this.rampsEligibilityModal.css}'));`,
        );
        return Boolean(hasEligibilityModal);
      },
      { timeout: 15000, interval: 500 },
    );
  }
}

export default RampsBuyDeepLinkPage;
