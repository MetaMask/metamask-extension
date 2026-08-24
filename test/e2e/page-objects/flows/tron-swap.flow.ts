import { Driver } from '../../webdriver/driver';
import HomePage from '../pages/home/homepage';
import SwapPage, { SwapOptions } from '../pages/swap/swap-page';
import { login } from './login.flow';
import { returnToTronHome } from './tron-home.flow';
import { selectTronNetwork } from './tron-network.flow';

export { returnToTronHome };

export async function landOnTronHome(driver: Driver): Promise<void> {
  await login(driver);
  await selectTronNetwork(driver);
  const homePage = new HomePage(driver);
  await homePage.checkPageIsLoaded();
  await homePage.checkExpectedBalanceIsDisplayed('106.07');
}

// One retry is enough: the race below is a one-shot event right after
// `returnToTronHome`'s reload, so by the time the first attempt's own
// ~10s click-visibility wait times out, the churn is long finished and a
// second attempt (a fresh element lookup) lands on settled DOM.
const CREATE_SWAP_MAX_ATTEMPTS = 2;

/**
 * Runs {@link SwapPage.createSwap}, retrying once on failure.
 *
 * `returnToTronHome`'s full page reload tears down and re-establishes the
 * account-activity websocket subscription; a few hundred ms later the mock
 * (and, in production, the real service) pushes a "chains up" system
 * notification. If that notification's resulting re-render lands mid-click
 * on the swap asset picker's network row, the row Selenium already located
 * detaches from the DOM before its visibility check resolves, so the click
 * itself never fires and the wait times out — even though the same row is
 * back, visible, and clickable moments later.
 *
 * The timed-out click leaves two nested sub-views open on top of the base
 * swap page: the network-select overlay, and beneath it the asset-list
 * route (`.../assets?field=...`), where `createSwap`'s own starting point
 * (the base page's source-token button) is not present. Mirrors the
 * recovery used by `selectNetworkFromFilter` for the analogous
 * home-network-filter race: rather than trying to interact further with
 * sub-views that just proved unreliable, back out of both (best-effort —
 * either may already be closed) before retrying `createSwap` from scratch.
 * {@link SwapPage.dismissStuckAssetPicker} clicks the picker's Close and
 * Back controls via `clickElementSafe` with short timeouts, so a control
 * that is absent (its sub-view already closed) is simply skipped instead
 * of failing the recovery.
 *
 * @param driver - WebDriver instance.
 * @param swapPage - Page object for the swap/bridge prepare screen.
 * @param options - Same options accepted by {@link SwapPage.createSwap}.
 */
export async function createTronSwap(
  driver: Driver,
  swapPage: SwapPage,
  options: SwapOptions,
): Promise<void> {
  for (let attempt = 1; attempt <= CREATE_SWAP_MAX_ATTEMPTS; attempt++) {
    try {
      await swapPage.createSwap(options);
      return;
    } catch (error) {
      if (attempt === CREATE_SWAP_MAX_ATTEMPTS) {
        throw error;
      }
      console.log(
        `createSwap failed on attempt ${attempt}/${CREATE_SWAP_MAX_ATTEMPTS}, backing out of any stuck asset picker and retrying:`,
        error,
      );
      await swapPage.dismissStuckAssetPicker();
    }
  }
}
