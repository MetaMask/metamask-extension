import { Driver } from '../../webdriver/driver';
import HomePage from '../pages/home/homepage';
import { switchToNetworkFromNetworkSelect } from './network.flow';
import { login } from './login.flow';

/**
 * Selects the Tron network from the home network filter.
 *
 * The shared network-switching flow (`switchToNetworkFromNetworkSelect`) waits
 * for the Tron snap and account to be ready first, and relies on the modal's
 * own condition waits instead of fixed delays.
 *
 * @param driver - WebDriver instance
 */
export async function selectTronNetwork(driver: Driver): Promise<void> {
  await switchToNetworkFromNetworkSelect(driver, 'Tron');
}

/**
 * Expected homepage native balance for `TRON_CHECK_BALANCE_ACCOUNT`
 * (106072392 SUN ≈ 106.072 TRX).
 */
const TRON_CHECK_BALANCE_HOMEPAGE_BALANCE = '106.072';

/**
 * Logs in, selects the Tron network via the readiness-wait flow, and gates on
 * the loaded homepage showing the seeded native TRX balance.
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
