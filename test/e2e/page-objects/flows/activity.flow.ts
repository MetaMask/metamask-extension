import { Driver } from '../../webdriver/driver';
import ActivityTab from '../pages/home/activity-tab';
import TransactionDetailsPage from '../pages/transaction-details-page';

/**
 * Opens the transaction details for the activity row matching the given text.
 *
 * @param options - Options.
 * @param options.driver - The WebDriver instance.
 * @param options.activityTab - The loaded activity tab.
 * @param options.activityText - The text shown on the activity row to open.
 * @returns The loaded transaction details page.
 */
export async function openActivityTransactionDetails({
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
