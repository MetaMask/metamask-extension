import { Driver } from '../../webdriver/driver';
import ActivityTab from '../pages/home/activity-tab';
import NonEvmHomepage from '../pages/home/non-evm-homepage';
import TransactionDetailsPage from '../pages/transaction-details-page';
import { login } from './login.flow';
import { selectTronNetwork } from './tron-network.flow';

/**
 * Logs in, selects the Tron network via the readiness-wait flow, and returns
 * the loaded non-EVM homepage.
 *
 * Activity assertions use mocked transaction history, not live balances.
 * Skipping balance and non-EVM account waits keeps each case under CI shard
 * time limits.
 *
 * @param driver - The WebDriver instance.
 * @returns The loaded non-EVM homepage.
 */
async function landOnTronActivityHome(driver: Driver): Promise<NonEvmHomepage> {
  await login(driver, {
    validateBalance: false,
    waitForNonEvmAccounts: false,
  });
  await selectTronNetwork(driver);

  const homePage = new NonEvmHomepage(driver);
  await homePage.checkPageIsLoaded();
  return homePage;
}

/**
 * Lands on the Tron homepage and opens the activity list.
 *
 * @param driver - The WebDriver instance.
 * @returns The loaded activity tab.
 */
export async function landOnTronActivity(driver: Driver): Promise<ActivityTab> {
  const homePage = await landOnTronActivityHome(driver);
  await homePage.goToActivityList();

  const activityTab = new ActivityTab(driver);
  await activityTab.checkPageIsLoaded();
  return activityTab;
}

/**
 * Opens the transaction details for the activity row matching the given text.
 *
 * @param options - Options.
 * @param options.driver - The WebDriver instance.
 * @param options.activityTab - The loaded activity tab.
 * @param options.activityText - The text shown on the activity row to open.
 * @returns The loaded transaction details page.
 */
export async function openTronTransactionDetails({
  driver,
  activityTab,
  activityText,
}: {
  driver: Driver;
  activityTab: ActivityTab;
  activityText: string;
}): Promise<TransactionDetailsPage> {
  await activityTab.clickActivityByText(activityText);

  const transactionDetailsPage = new TransactionDetailsPage(driver);
  await transactionDetailsPage.checkPageIsLoaded();
  return transactionDetailsPage;
}
