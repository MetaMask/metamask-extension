import { Driver } from '../../webdriver/driver';
import HomePage from '../pages/home/homepage';
import TokensTab from '../pages/home/tokens-tab';
import { switchToNetworkFromNetworkSelect } from './network.flow';
import { login } from './login.flow';
import { TRON_HOMEPAGE_TOKEN_TIMEOUT_MS } from './tron-assets.flow';

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

type LandOnTronHomeOptions = {
  /**
   * Expected TRX amount on the homepage token row. Defaults to the seeded
   * balance for node-based specs.
   */
  expectedTrxAmount?: string;
};

/**
 * Logs in, selects the Tron network via the readiness-wait flow, and gates on
 * the loaded homepage showing the TRX token row with the expected amount.
 *
 * @param driver - WebDriver instance.
 * @param options - Setup options.
 */
export async function landOnTronHome(
  driver: Driver,
  options: LandOnTronHomeOptions = {},
): Promise<void> {
  const { expectedTrxAmount = TRON_CHECK_BALANCE_HOMEPAGE_BALANCE } = options;

  await login(driver, { validateBalance: false });

  const homePage = new HomePage(driver);
  await homePage.waitForNonEvmAccountsLoaded();
  await selectTronNetwork(driver);

  const tokensTab = new TokensTab(driver);
  await tokensTab.checkTokenNameVisible('Tron', {
    timeout: TRON_HOMEPAGE_TOKEN_TIMEOUT_MS,
  });
  await tokensTab.checkTokenAmountIsDisplayed(expectedTrxAmount);
}
