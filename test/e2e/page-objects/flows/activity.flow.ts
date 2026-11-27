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

/**
 * Leaves transaction details and returns to the activity list.
 *
 * Prefer {@link TransactionDetailsPage.clickBackButton} when the `/tx/` route
 * clears reliably. For chains where that wait is flaky, click back
 * without the route wait and re-open Activity via bottom nav.
 *
 * @param options - Options.
 * @param options.driver - The WebDriver instance.
 * @param options.activityTab - Activity tab page object (also owns bottom nav).
 */
export async function closeActivityTransactionDetails({
  driver,
  activityTab,
}: {
  driver: Driver;
  activityTab: ActivityTab;
}): Promise<void> {
  const transactionDetailsPage = new TransactionDetailsPage(driver);
  await transactionDetailsPage.clickBackButtonIfPresentWithoutRouteWait();
  await activityTab.goToActivityList();
}
