import { Driver } from '../../webdriver/driver';
import { RawLocator } from '../common';

const SWAP_AND_BRIDGE_ERROR_UI_ABSENT_GUARD_MS = 1000;

const notPresentGuards = {
  waitAtLeastGuard: SWAP_AND_BRIDGE_ERROR_UI_ABSENT_GUARD_MS,
};

/**
 * Shared Swap/Bridge quote-error UI. Send and confirmation can both surface
 * these banners when a same-chain native send is mis-routed.
 */
export class SwapAndBridgeErrorUi {
  private readonly driver: Driver;

  private readonly swapAndBridgeBannerAlerts: RawLocator =
    '[data-testid="bridge-banner-alerts"]';

  private readonly swapAndBridgeCtaButton: RawLocator =
    '[data-testid="bridge-cta-button"]';

  private readonly swapAndBridgeFetchingQuotesLabel: RawLocator = {
    tag: 'p',
    text: 'Fetching quotes...',
  };

  private readonly swapAndBridgeNoQuotes: RawLocator =
    '[data-testid="bridge-no-quotes"]';

  private readonly swapsBannerTitle: RawLocator =
    '[data-testid="swaps-banner-title"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  /**
   * Asserts that Swap/Bridge quote-error UI is not shown.
   */
  async checkErrorUiIsAbsent(): Promise<void> {
    console.log('Checking swap/bridge error UI is absent');
    await this.driver.assertElementNotPresent(
      this.swapAndBridgeBannerAlerts,
      notPresentGuards,
    );
    await this.driver.assertElementNotPresent(
      this.swapsBannerTitle,
      notPresentGuards,
    );
    await this.driver.assertElementNotPresent(
      this.swapAndBridgeNoQuotes,
      notPresentGuards,
    );
    await this.driver.assertElementNotPresent(
      this.swapAndBridgeFetchingQuotesLabel,
      notPresentGuards,
    );
    await this.driver.assertElementNotPresent(
      this.swapAndBridgeCtaButton,
      notPresentGuards,
    );
  }
}
