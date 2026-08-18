import { WINDOW_TITLES } from '../../constants';
import { Driver } from '../../webdriver/driver';
import { TxToastNotification } from '../components/tx-toast-notification';
import SnapTransactionConfirmation from '../pages/confirmations/snap-transaction-confirmation';
import ActivityTab from '../pages/home/activity-tab';
import HomePage from '../pages/home/homepage';
import NonEvmHomepage from '../pages/home/non-evm-homepage';
import SendPage from '../pages/send/send-page';
import { TRON_CHAIN_ID } from '../../tests/tron/mocks/common-tron';
import { switchToAccount } from './account-list.flow';
import { addMultipleAccounts } from './add-account.flow';
import { login } from './login.flow';
import { selectTronNetwork } from './tron-network.flow';
import { waitUntilAccountTreeSyncIdle } from './tron-account-derivation.flow';

const TRON_CONFIRM_TIMEOUT_MS = 30_000;
const TRON_ACTIVITY_PENDING_OR_CONFIRMED_SELECTOR =
  '[data-tx-status="submitted"], [data-tx-status="approved"], [data-tx-status="unapproved"], [data-tx-status="pending"], [data-tx-status="confirmed"]';

type TronSendSymbol = 'TRX' | 'USDT' | 'USDD' | 'HTX' | 'SEED';

/**
 * Logs in, selects Tron, and waits for homepage balances.
 *
 * When `extraHdAccountCount` is greater than 0, this flow creates that many
 * extra HD accounts and switches to `accountToSelect` first.
 * Shared Send sessions create those extras once, then switch between the
 * already-derived accounts so mutating cases keep isolated chain state.
 *
 * @param options - Flow options.
 * @param options.accountToSelect - Account label to select after creating extras.
 * @param options.driver - The webdriver instance.
 * @param options.extraHdAccountCount - Extra HD accounts to create. `0` keeps Account 1.
 * @param options.expectedNativeBalance - Homepage TRX balance to wait for.
 * @param options.expectedTokenBalance - Homepage token balance to wait for.
 * @param options.symbol - Token symbol used for the optional token balance wait.
 */
export async function prepareTronHomepageForSend({
  accountToSelect = 'Account 1',
  driver,
  extraHdAccountCount = 0,
  expectedNativeBalance = '6.072',
  expectedTokenBalance,
  symbol = 'TRX',
}: {
  accountToSelect?: string;
  driver: Driver;
  extraHdAccountCount?: number;
  expectedNativeBalance?: string | null;
  expectedTokenBalance?: string;
  symbol?: TronSendSymbol;
}): Promise<void> {
  await login(driver, { validateBalance: false });
  const home = new NonEvmHomepage(driver);
  if (extraHdAccountCount > 0) {
    await addMultipleAccounts({
      accountToSelect,
      driver,
      numberOfAccounts: extraHdAccountCount,
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
  if (extraHdAccountCount === 0 || accountToSelect === 'Account 1') {
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
}

/**
 * Opens the unified Send amount/recipient screen for the current account.
 *
 * @param options - Flow options.
 * @param options.assetId - Optional asset id for the Send deep link.
 * @param options.driver - The webdriver instance.
 * @returns The loaded Send page.
 */
export async function openTronSendAmountRecipient({
  assetId,
  driver,
}: {
  assetId?: string;
  driver: Driver;
}): Promise<SendPage> {
  const sendPage = new SendPage(driver);
  const searchParams = new URLSearchParams({ chainId: TRON_CHAIN_ID });
  if (assetId) {
    searchParams.set('asset', assetId);
  }
  const sendUrl = `${driver.extensionUrl}/home.html#/send/amount-recipient?${searchParams.toString()}`;
  // Selenium `get()` is a no-op when the URL (including hash) is unchanged, so
  // leave Send first when a previous case already landed here.
  const currentUrl = await driver.getCurrentUrl();
  if (currentUrl.includes('#/send')) {
    await driver.navigate();
  }
  await driver.openNewURL(sendUrl);
  await sendPage.checkSendFormIsLoaded();
  return sendPage;
}

/**
 * Switches to an already-derived Tron account and waits for homepage balances.
 *
 * Use this in a held fixture session after {@link prepareTronHomepageForSend}
 * has created the extra HD accounts. Leaves Send first when the previous case
 * is still on that route.
 *
 * @param options - Flow options.
 * @param options.accountName - Account label to select, for example `Account 3`.
 * @param options.driver - The webdriver instance.
 * @param options.expectedNativeBalance - Homepage TRX balance to wait for.
 * @param options.expectedTokenBalance - Homepage token balance to wait for.
 * @param options.symbol - Token symbol used for the optional token balance wait.
 */
export async function switchToTronAccountForSend({
  accountName,
  driver,
  expectedNativeBalance = '6.072',
  expectedTokenBalance,
  symbol = 'TRX',
}: {
  accountName: string;
  driver: Driver;
  expectedNativeBalance?: string | null;
  expectedTokenBalance?: string;
  symbol?: TronSendSymbol;
}): Promise<void> {
  const currentUrl = await driver.getCurrentUrl();
  if (currentUrl.includes('#/send')) {
    await driver.navigate();
  }

  const home = new NonEvmHomepage(driver);
  await home.checkPageIsLoaded();
  await waitUntilAccountTreeSyncIdle(driver);
  await switchToAccount(driver, accountName);
  await waitUntilAccountTreeSyncIdle(driver);
  await home.goToTokensTab();

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
}

/**
 * Logs in, selects Tron, and opens the Send amount/recipient screen.
 *
 * When `accountIndex` is greater than 0, this flow creates that many extra HD
 * accounts and switches to `Account ${accountIndex + 1}` first.
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
  symbol: TronSendSymbol;
  assetId?: string;
  expectedNativeBalance?: string | null;
  expectedTokenBalance?: string;
}): Promise<SendPage> {
  await prepareTronHomepageForSend({
    accountToSelect: `Account ${accountIndex + 1}`,
    driver,
    extraHdAccountCount: accountIndex,
    expectedNativeBalance,
    expectedTokenBalance,
    symbol,
  });
  return await openTronSendAmountRecipient({ assetId, driver });
}

async function waitForTronSendActivity(
  driver: Driver,
  expectedCount = 1,
): Promise<void> {
  // Local java-tron can confirm before a pending row is observable.
  console.log(
    `Waiting for Tron send activity (pending or confirmed), count >= ${expectedCount}`,
  );
  await driver.wait(async () => {
    try {
      const activityItems = await driver.findElements(
        TRON_ACTIVITY_PENDING_OR_CONFIRMED_SELECTOR,
      );
      return activityItems.length >= expectedCount;
    } catch {
      return false;
    }
  }, 30_000);
}

export async function confirmTronSendAndAssertActivity({
  driver,
  expectedAmount,
  expectedConfirmedTxCount = 1,
}: {
  driver: Driver;
  expectedAmount?: string;
  expectedConfirmedTxCount?: number;
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
  await waitForTronSendActivity(driver, expectedConfirmedTxCount);
  await activityList.checkConfirmedTxNumberDisplayedInActivity(
    expectedConfirmedTxCount,
  );
  if (expectedAmount) {
    await activityList.checkTxAmountInActivity(expectedAmount, 1);
  }
  await activityList.checkNoFailedTransactions();
}
