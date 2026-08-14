import { WINDOW_TITLES } from '../../constants';
import { Driver } from '../../webdriver/driver';
import { TxToastNotification } from '../components/tx-toast-notification';
import SnapTransactionConfirmation from '../pages/confirmations/snap-transaction-confirmation';
import ActivityTab from '../pages/home/activity-tab';
import HomePage from '../pages/home/homepage';
import NonEvmHomepage from '../pages/home/non-evm-homepage';
import SendPage from '../pages/send/send-page';
import { TRON_CHAIN_ID } from '../../tests/tron/mocks/common-tron';
import { addMultipleAccounts } from './add-account.flow';
import { login } from './login.flow';
import { selectTronNetwork } from './tron-network.flow';
import { waitUntilAccountTreeSyncIdle } from './tron-account-derivation.flow';

const TRON_CONFIRM_TIMEOUT_MS = 30_000;
const TRON_ACTIVITY_PENDING_OR_CONFIRMED_SELECTOR =
  '[data-tx-status="submitted"], [data-tx-status="approved"], [data-tx-status="unapproved"], [data-tx-status="pending"], [data-tx-status="confirmed"]';

/**
 * Logs in, selects Tron, and opens the Send amount/recipient screen.
 *
 * When `accountIndex` is greater than 0, this flow creates that many extra HD
 * accounts and switches to `Account ${accountIndex + 1}` first.
 * Send specs that share one Java-Tron node use a distinct derived address per
 * mutating test so chain state does not leak across cases.
 *
 * @param options - Flow options.
 * @param options.accountIndex - HD account index to land on. `0` is Account 1.
 * @param options.driver - The webdriver instance.
 * @param options.symbol - Token symbol used for balance assertions and Send.
 * @param options.assetId - Optional asset id for the Send deep link.
 * @param options.expectedNativeBalance - Homepage TRX balance to wait for.
 * @param options.expectedTokenBalance - Homepage token balance to wait for.
 * @returns The loaded Send page.
 */
export async function landOnTronSendScreen({
  accountIndex = 0,
  driver,
  symbol,
  assetId,
  expectedNativeBalance = '6.072',
  expectedTokenBalance,
}: {
  accountIndex?: number;
  driver: Driver;
  symbol: 'TRX' | 'USDT' | 'USDD' | 'HTX' | 'SEED';
  assetId?: string;
  expectedNativeBalance?: string | null;
  expectedTokenBalance?: string;
}): Promise<SendPage> {
  await login(driver, { validateBalance: false });
  const home = new NonEvmHomepage(driver);
  if (accountIndex > 0) {
    await addMultipleAccounts({
      accountToSelect: `Account ${accountIndex + 1}`,
      driver,
      numberOfAccounts: accountIndex,
    });
    // Runtime-created non-EVM accounts must finish loading before a network
    // switch or refresh. In-flight Snap derivation slows the service worker
    // and makes the next page load time out on `.controller-loaded`.
    await home.checkPageIsLoaded();
    await home.waitForNonEvmAccountsLoaded();
    await waitUntilAccountTreeSyncIdle(driver);
  }
  await selectTronNetwork(driver);
  await waitUntilAccountTreeSyncIdle(driver);

  // Refresh re-hydrates Account 1 from background state so Snap balances
  // appear in the token list. Account switches already trigger that hydration.
  if (accountIndex === 0) {
    await driver.refresh();
  }

  await home.checkPageIsLoaded();
  // Wait for the live TRX balance to land on the homepage before navigating to
  // Send. Without this gate, Send opens with the cached "0 TRX available" and
  // every amount renders "Insufficient funds", leaving the Continue button
  // disabled. The local Tron node is seeded with 6.072 TRX in profiles.ts.
  if (expectedNativeBalance) {
    await home.checkExpectedTokenBalanceIsDisplayed(
      expectedNativeBalance,
      'TRX',
    );
  }
  if (expectedTokenBalance) {
    await home.checkExpectedTokenBalanceIsDisplayed(
      expectedTokenBalance,
      symbol,
    );
  }

  const sendPage = new SendPage(driver);
  const searchParams = new URLSearchParams({ chainId: TRON_CHAIN_ID });
  if (assetId) {
    searchParams.set('asset', assetId);
  }
  await driver.openNewURL(
    `${driver.extensionUrl}/home.html#/send/amount-recipient?${searchParams.toString()}`,
  );
  await sendPage.checkSendFormIsLoaded();
  return sendPage;
}

async function waitForTronSendActivity(driver: Driver): Promise<void> {
  // Local java-tron can confirm before a pending row is observable.
  console.log('Waiting for Tron send activity (pending or confirmed)');
  await driver.wait(async () => {
    try {
      const activityItems = await driver.findElements(
        TRON_ACTIVITY_PENDING_OR_CONFIRMED_SELECTOR,
      );
      return activityItems.length >= 1;
    } catch {
      return false;
    }
  }, 30_000);
}

export async function confirmTronSendAndAssertActivity({
  driver,
  expectedAmount,
}: {
  driver: Driver;
  expectedAmount?: string;
}): Promise<void> {
  const snapConfirmation = new SnapTransactionConfirmation(driver);
  const extensionHandle = await driver.driver.getWindowHandle();
  let usingDialog = false;

  try {
    await driver.waitForWindowWithTitleToBePresent(WINDOW_TITLES.Dialog, 5_000);
    await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
    usingDialog = true;
  } catch {
    // Unified send may render confirmation inline in the extension popup.
  }

  await snapConfirmation.checkPageIsLoaded({
    timeout: TRON_CONFIRM_TIMEOUT_MS,
  });

  if (usingDialog) {
    await snapConfirmation.clickFooterConfirmButtonAndWaitForWindowToClose();
    await driver.switchToWindow(extensionHandle);
  } else {
    await snapConfirmation.clickFooterConfirmButton();
  }

  const txToast = new TxToastNotification(driver);
  await txToast.checkTxSubmittedToast();

  const homePage = new HomePage(driver);
  await homePage.goToActivityList();

  const activityList = new ActivityTab(driver);
  await waitForTronSendActivity(driver);
  await activityList.checkConfirmedTxNumberDisplayedInActivity(1);
  if (expectedAmount) {
    await activityList.checkTxAmountInActivity(expectedAmount, 1);
  }
  await activityList.checkNoFailedTransactions();
}
