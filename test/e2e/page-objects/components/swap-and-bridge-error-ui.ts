import { Driver } from '../../webdriver/driver';
import { RawLocator } from '../common';

const SWAP_AND_BRIDGE_ERROR_UI_ABSENT_GUARD_MS = 1000;

const notPresentGuards = {
  waitAtLeastGuard: SWAP_AND_BRIDGE_ERROR_UI_ABSENT_GUARD_MS,
};

/**
 * Shared Swap/Bridge quote-error UI locators. Send and confirmation can both
 * surface these banners when a same-chain native send is mis-routed.
 */
const swapAndBridgeBannerAlerts: RawLocator =
  '[data-testid="bridge-banner-alerts"]';

const swapAndBridgeCtaButton: RawLocator = '[data-testid="bridge-cta-button"]';

const swapAndBridgeFetchingQuotesLabel: RawLocator = {
  tag: 'p',
  text: 'Fetching quotes...',
};

const swapAndBridgeNoQuotes: RawLocator = '[data-testid="bridge-no-quotes"]';

const swapsBannerTitle: RawLocator = '[data-testid="swaps-banner-title"]';

/**
 * Asserts that Swap/Bridge quote-error UI is not shown.
 *
 * @param driver - WebDriver wrapper.
 */
export async function assertSwapAndBridgeErrorUiIsAbsent(
  driver: Driver,
): Promise<void> {
  await driver.assertElementNotPresent(
    swapAndBridgeBannerAlerts,
    notPresentGuards,
  );
  await driver.assertElementNotPresent(swapsBannerTitle, notPresentGuards);
  await driver.assertElementNotPresent(swapAndBridgeNoQuotes, notPresentGuards);
  await driver.assertElementNotPresent(
    swapAndBridgeFetchingQuotesLabel,
    notPresentGuards,
  );
  await driver.assertElementNotPresent(
    swapAndBridgeCtaButton,
    notPresentGuards,
  );
}
