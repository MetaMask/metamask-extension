import { Driver } from '../../webdriver/driver';
import HomePage from '../pages/home/homepage';
import { addMultipleAccounts } from './add-account.flow';
import { switchToAccount } from './account-list.flow';
import { login } from './login.flow';
import { switchToNetworkFromNetworkSelect } from './network.flow';
import { waitUntilAccountTreeSyncIdle } from './tron-account-derivation.flow';

const PORTFOLIO_ACCOUNT_INDEX = 1;

export async function prepareTronAssetsHomepage(driver: Driver): Promise<void> {
  await login(driver, { validateBalance: false });
  const homePage = new HomePage(driver);
  await addMultipleAccounts({
    accountToSelect: 'Account 1',
    driver,
    numberOfAccounts: PORTFOLIO_ACCOUNT_INDEX,
  });
  await homePage.checkPageIsLoaded();
  await homePage.waitForNonEvmAccountsLoaded();
  await waitUntilAccountTreeSyncIdle(driver);
  await switchToNetworkFromNetworkSelect(driver, 'Tron');
  await homePage.reloadHome();
}

export async function returnToTronHome(driver: Driver): Promise<void> {
  const homePage = new HomePage(driver);
  await homePage.navigateToHome();
}

export async function switchToPortfolioTronAccount(
  driver: Driver,
): Promise<void> {
  await returnToTronHome(driver);
  await switchToAccount(driver, 'Account 2');
  await waitUntilAccountTreeSyncIdle(driver);
  await switchToNetworkFromNetworkSelect(driver, 'Tron');
  // Account-group switch leaves isEvmSelected true; re-select Tron then
  // reload so native-as-main applies.
  const homePage = new HomePage(driver);
  await homePage.reloadHome();
}
