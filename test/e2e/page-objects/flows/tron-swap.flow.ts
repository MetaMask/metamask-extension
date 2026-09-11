import { Driver } from '../../webdriver/driver';
import HomePage from '../pages/home/homepage';
import SwapPage from '../pages/swap/swap-page';
import type { SwapOptions } from '../pages/swap/swap-page';
import { login } from './login.flow';
import { selectTronNetwork } from './tron-network.flow';

/**
 * Expected homepage native balance for `TRON_CHECK_BALANCE_ACCOUNT`
 * (106072392 SUN ≈ 106.072 TRX).
 */
const TRON_CHECK_BALANCE_HOMEPAGE_BALANCE = '106.072';

/**
 * Logs in, selects the Tron network via the readiness-wait flow, and gates on
 * the loaded homepage showing the seeded native TRX balance before any swap
 * navigation.
 *
 * @param driver - The WebDriver instance.
 */
export async function landOnTronHome(driver: Driver): Promise<void> {
  await login(driver, { validateBalance: false });

  await selectTronNetwork(driver);

  const homePage = new HomePage(driver);
  await homePage.checkPageIsLoaded();
  await homePage.checkExpectedBalanceIsDisplayed(
    TRON_CHECK_BALANCE_HOMEPAGE_BALANCE,
  );
}

/**
 * Builds a swap quote on the loaded Swap page.
 *
 * @param driver - The WebDriver instance.
 * @param swapPage - The loaded Swap page.
 * @param options - Swap construction options (network, tokens, amount).
 */
export async function createTronSwap(
  driver: Driver,
  swapPage: SwapPage,
  options: SwapOptions,
): Promise<void> {
  await swapPage.createSwap(options);
}
