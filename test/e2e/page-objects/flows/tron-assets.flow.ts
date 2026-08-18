import { Driver } from '../../webdriver/driver';
import HomePage from '../pages/home/homepage';
import TokensTab from '../pages/home/tokens-tab';
import { addMultipleAccounts } from './add-account.flow';
import { switchToAccount } from './account-list.flow';
import { login } from './login.flow';
import { switchToNetworkFromNetworkSelect } from './network.flow';
import { waitUntilAccountTreeSyncIdle } from './tron-account-derivation.flow';
import { returnToTronHome } from './tron-home.flow';

const TRON_HOMEPAGE_TOKEN_TIMEOUT_MS = 30_000;

/** Account 1 empty, Account 2 portfolio, Account 3 funded check-balance. */
const EXTRA_HD_ACCOUNT_COUNT = 2;

export { returnToTronHome };

export async function prepareTronAssetsHomepage(driver: Driver): Promise<void> {
  await login(driver, { validateBalance: false });
  const homePage = new HomePage(driver);
  await addMultipleAccounts({
    accountToSelect: 'Account 1',
    driver,
    numberOfAccounts: EXTRA_HD_ACCOUNT_COUNT,
  });
  await homePage.checkPageIsLoaded();
  await homePage.waitForNonEvmAccountsLoaded();
  await waitUntilAccountTreeSyncIdle(driver);
  await switchToNetworkFromNetworkSelect(driver, 'Tron');
  const tokensTab = new TokensTab(driver);
  await tokensTab.checkTokenExistsInList('Tron', '0', {
    timeout: TRON_HOMEPAGE_TOKEN_TIMEOUT_MS,
  });
}

/**
 * Switches to an already-derived account, re-selects Tron, and waits for the
 * native TRX token row instead of reloading the page.
 *
 * @param driver - The webdriver instance.
 * @param options - Account switch options.
 * @param options.accountName - Account label, for example `Account 2`.
 * @param options.expectedTrxAmount - Optional TRX amount shown in the token list.
 */
export async function switchToTronAccount(
  driver: Driver,
  {
    accountName,
    expectedTrxAmount,
  }: {
    accountName: string;
    expectedTrxAmount?: string;
  },
): Promise<void> {
  await returnToTronHome(driver);
  await switchToAccount(driver, accountName);
  await waitUntilAccountTreeSyncIdle(driver);
  await switchToNetworkFromNetworkSelect(driver, 'Tron');
  const tokensTab = new TokensTab(driver);
  await tokensTab.checkTokenExistsInList('Tron', expectedTrxAmount, {
    timeout: TRON_HOMEPAGE_TOKEN_TIMEOUT_MS,
  });
}

export async function switchToPortfolioTronAccount(
  driver: Driver,
): Promise<void> {
  await switchToTronAccount(driver, {
    accountName: 'Account 2',
    expectedTrxAmount: '6.072',
  });
}

export async function switchToFundedTronAccount(
  driver: Driver,
): Promise<void> {
  await switchToTronAccount(driver, {
    accountName: 'Account 3',
    expectedTrxAmount: '106.072',
  });
}
