import { Driver } from '../../webdriver/driver';
import ActivityTab from '../pages/home/activity-tab';
import NonEvmHomepage from '../pages/home/non-evm-homepage';
import TransactionDetailsPage from '../pages/transaction-details-page';
import { login } from './login.flow';
import { selectTronNetwork } from './tron-network.flow';

export async function landOnTronActivity(driver: Driver): Promise<ActivityTab> {
  console.log('Land on the Tron activity list');
  const homePage = await landOnTronHome(driver);
  await homePage.goToActivityList();

  return new ActivityTab(driver);
}

export async function landOnTronHome(driver: Driver): Promise<NonEvmHomepage> {
  console.log('Land on Tron home for mocked activity assertions');
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

export async function openTronTransactionDetails({
  driver,
  activityTab,
  activityText,
}: {
  driver: Driver;
  activityTab: ActivityTab;
  activityText: string;
}): Promise<TransactionDetailsPage> {
  console.log(`Open Tron transaction details for "${activityText}"`);
  await activityTab.clickActivityByText(activityText);

  const transactionDetailsPage = new TransactionDetailsPage(driver);
  await transactionDetailsPage.checkPageIsLoaded();
  return transactionDetailsPage;
}
