import { WINDOW_TITLES } from '../../constants';
import { Driver } from '../../webdriver/driver';
import { TxToastNotification } from '../components/tx-toast-notification';
import SnapTransactionConfirmation from '../pages/confirmations/snap-transaction-confirmation';
import ActivityTab from '../pages/home/activity-tab';
import HomePage from '../pages/home/homepage';

const SNAP_CONFIRM_TIMEOUT_MS = 30_000;

/**
 * Confirms a snap (non-EVM) send transaction and asserts it lands in the
 * activity list as confirmed, without failed transactions.
 *
 * @param options - Options.
 * @param options.driver - The WebDriver instance.
 * @param options.expectedAmount - Expected transaction amount shown in the activity list.
 * @param options.expectedConfirmedTxCount - Expected number of confirmed transactions.
 */
export async function confirmSnapSendAndAssertActivity({
  driver,
  expectedAmount,
  expectedConfirmedTxCount = 1,
}: {
  driver: Driver;
  expectedAmount?: string;
  expectedConfirmedTxCount?: number;
}): Promise<void> {
  const snapConfirmation = new SnapTransactionConfirmation(driver);
  const extensionHandle = await driver.getCurrentWindowHandle();
  let usingDialog = false;

  try {
    await driver.waitForWindowWithTitleToBePresent(WINDOW_TITLES.Dialog, 5_000);
    await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
    usingDialog = true;
  } catch {
    // Unified send may render confirmation inline in the extension popup.
  }

  await snapConfirmation.checkPageIsLoaded({
    timeout: SNAP_CONFIRM_TIMEOUT_MS,
  });

  if (usingDialog) {
    await snapConfirmation.clickFooterButton({
      button: 'confirm',
      waitUntil: 'windowClose',
    });
    await driver.switchToWindow(extensionHandle);
  } else {
    await snapConfirmation.clickFooterButton({ button: 'confirm' });
  }

  const txToast = new TxToastNotification(driver);
  await txToast.checkTxSubmittedToast();

  const homePage = new HomePage(driver);
  await homePage.goToActivityList();

  const activityList = new ActivityTab(driver);
  await activityList.checkConfirmedTxNumberDisplayedInActivity(
    expectedConfirmedTxCount,
  );
  if (expectedAmount) {
    await activityList.checkTxAmountInActivity(expectedAmount, 1);
  }
  await activityList.checkNoFailedTransactions();
}
