import { Driver } from '../../webdriver/driver';
import HomePage from '../pages/home/homepage';
import AccountListPage from '../pages/accounts/list-page';
import TokensTab from '../pages/home/tokens-tab';
import { login } from './login.flow';
import { selectTronNetwork } from './tron-network.flow';
import {
  addAccounts as addMultichainAccounts,
  waitUntilAccountTreeSyncIdle,
} from './add-account.flow';

/**
 * Explicit timeout for the TRX token row to appear on the homepage after the
 * Tron network is selected (Snap balances are fetched asynchronously).
 */
export const TRON_HOMEPAGE_TOKEN_TIMEOUT_MS = 30_000;

type SetupTronAssetsHomeOptions = {
  /**
   * Number of additional multichain accounts to create after login
   * (e.g. `2` creates Account 2 and Account 3). Account 1 stays selected.
   */
  addAccounts?: number;
  /**
   * Expected TRX amount on the homepage token row. Defaults to `'0'` for a
   * freshly-created account.
   */
  expectedTrxAmount?: string;
};

/**
 * Logs in, optionally creates additional accounts, waits for the account tree
 * to sync, selects the Tron network, and waits for the TRX token row with an
 * explicit timeout.
 *
 * The explicit readiness waits (sync idle + token row) replace the previous
 * `driver.refresh()` hack for re-hydrating asynchronously-fetched Snap
 * balances.
 *
 * @param driver - The WebDriver instance.
 * @param options - Setup options.
 */
export async function setupTronAssetsHome(
  driver: Driver,
  options: SetupTronAssetsHomeOptions = {},
): Promise<void> {
  const { addAccounts, expectedTrxAmount = '0' } = options;

  await login(driver, { validateBalance: false });
  if (addAccounts && addAccounts > 0) {
    await addMultichainAccounts({
      driver,
      count: addAccounts,
      onBeforeAdd: () => waitUntilAccountTreeSyncIdle(driver),
      onAfterAdd: ({ label }) =>
        new AccountListPage(driver).checkMultichainAccountNameDisplayed(label),
      onDone: async ({ accountList }) => {
        await accountList.selectAccount('Account 1');
      },
    });
  }

  const homePage = new HomePage(driver);
  await homePage.waitForNonEvmAccountsLoaded();
  await waitUntilAccountTreeSyncIdle(driver);
  await selectTronNetwork(driver);

  const tokensTab = new TokensTab(driver);
  await tokensTab.checkTokenNameVisible('Tron', {
    timeout: TRON_HOMEPAGE_TOKEN_TIMEOUT_MS,
  });
  await tokensTab.checkTokenAmountIsDisplayed(expectedTrxAmount);
}
