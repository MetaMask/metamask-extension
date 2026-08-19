import { Driver } from '../../webdriver/driver';
import ActivityTab from '../pages/home/activity-tab';
import NonEvmHomepage from '../pages/home/non-evm-homepage';
import TransactionDetailsPage from '../pages/transaction-details-page';
import { login } from './login.flow';
import { selectTronNetwork } from './tron-network.flow';

export async function landOnTronHome(driver: Driver): Promise<NonEvmHomepage> {
  // Activity assertions use mocked transaction history, not live balances.
  // Skipping balance and non-EVM account waits keeps each case under CI shard
  // time limits (see tron-send.flow.ts for the same pattern).
  await login(driver, {
    validateBalance: false,
    waitForNonEvmAccounts: false,
  });
  await selectTronNetwork(driver);

  const homePage = new NonEvmHomepage(driver);
  await homePage.checkPageIsLoaded();
  return homePage;
}

export async function landOnTronActivity(driver: Driver): Promise<ActivityTab> {
  const homePage = await landOnTronHome(driver);
  await homePage.goToActivityList();

  return new ActivityTab(driver);
}

export async function openTronTransactionDetails({
  driver,
  activityTab,
  transactionIndex,
}: {
  driver: Driver;
  activityTab: ActivityTab;
  transactionIndex: number;
}): Promise<TransactionDetailsPage> {
  await activityTab.clickOnActivity(transactionIndex);

  const transactionDetailsPage = new TransactionDetailsPage(driver);
  await transactionDetailsPage.checkPageIsLoaded();
  return transactionDetailsPage;
}
