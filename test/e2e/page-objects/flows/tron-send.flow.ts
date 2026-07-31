import { Driver } from '../../webdriver/driver';
import SnapTransactionConfirmation from '../pages/confirmations/snap-transaction-confirmation';
import ActivityTab from '../pages/home/activity-tab';
import HomePage from '../pages/home/homepage';
import NonEvmHomepage from '../pages/home/non-evm-homepage';
import SendPage from '../pages/send/send-page';
import { TRON_CHAIN_ID } from '../../tests/tron/mocks/common-tron';
import { login } from './login.flow';
import { selectTronNetwork } from './tron-network.flow';

export async function landOnTronSendScreen({
  driver,
  symbol,
  assetId,
  expectedNativeBalance = '6.072',
}: {
  driver: Driver;
  symbol: 'TRX' | 'USDT' | 'USDD' | 'HTX' | 'SEED';
  assetId?: string;
  expectedNativeBalance?: string | null;
}): Promise<SendPage> {
  await login(driver, { validateBalance: false });
  await selectTronNetwork(driver);

  // Refresh re-hydrates the UI from background state so asynchronously-fetched
  // Snap balances appear reliably in the token list (same pattern as assets.spec).
  await driver.refresh();

  const home = new NonEvmHomepage(driver);
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

export async function confirmTronSendAndAssertActivity({
  driver,
  expectedAmount,
}: {
  driver: Driver;
  expectedAmount?: string;
}): Promise<void> {
  const snapConfirmation = new SnapTransactionConfirmation(driver);
  await snapConfirmation.checkPageIsLoaded();
  await snapConfirmation.clickFooterConfirmButton();

  const homePage = new HomePage(driver);
  // Same mitigation as BTC Bug #43641: confirm may leave Assets/Home selected.
  await homePage.goToActivityList();

  const activityList = new ActivityTab(driver);
  await activityList.checkPendingTxNumberDisplayedInActivity(1);
  await activityList.checkConfirmedTxNumberDisplayedInActivity(1);
  if (expectedAmount) {
    await activityList.checkTxAmountInActivity(expectedAmount, 1);
  }
  await activityList.checkNoFailedTransactions();
}
