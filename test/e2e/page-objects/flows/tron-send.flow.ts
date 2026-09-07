import { WINDOW_TITLES } from '../../constants';
import { Driver } from '../../webdriver/driver';
import { TxToastNotification } from '../components/tx-toast-notification';
import SnapTransactionConfirmation from '../pages/confirmations/snap-transaction-confirmation';
import ActivityTab from '../pages/home/activity-tab';
import HomePage from '../pages/home/homepage';
import NonEvmHomepage from '../pages/home/non-evm-homepage';
import TokensTab from '../pages/home/tokens-tab';
import SendPage from '../pages/send/send-page';
import { TRON_CHAIN_ID } from '../../tests/tron/mocks/common-tron';
import { login } from './login.flow';
import { TRON_HOMEPAGE_TOKEN_TIMEOUT_MS } from './tron-assets.flow';
import { selectTronNetwork } from './tron-network.flow';
import { waitUntilAccountTreeSyncIdle } from './tron-account-derivation.flow';

const TRON_CONFIRM_TIMEOUT_MS = 30_000;

export async function landOnTronSendScreen({
  driver,
  symbol,
  assetId,
  expectedNativeBalance = '6.072',
  expectedTokenBalance,
}: {
  driver: Driver;
  symbol: 'TRX' | 'USDT' | 'USDD' | 'HTX' | 'SEED';
  assetId?: string;
  expectedNativeBalance?: string | null;
  expectedTokenBalance?: string;
}): Promise<SendPage> {
  await login(driver, { validateBalance: false });
  await waitUntilAccountTreeSyncIdle(driver);
  await selectTronNetwork(driver);

  const home = new NonEvmHomepage(driver);
  await home.checkPageIsLoaded();
  const tokensTab = new TokensTab(driver);
  await tokensTab.checkTokenNameVisible('Tron', {
    timeout: TRON_HOMEPAGE_TOKEN_TIMEOUT_MS,
  });
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
  const sendUrl = `${driver.extensionUrl}/home.html#/send/amount-recipient?${searchParams.toString()}`;

  if ((await driver.getCurrentUrl()).includes('#/send')) {
    await new HomePage(driver).navigateToHome();
  }
  await driver.openNewURL(sendUrl);
  await sendPage.checkSendFormIsLoaded();
  return sendPage;
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
  await activityList.checkPendingOrConfirmedTxNumberDisplayedInActivity(
    expectedConfirmedTxCount,
  );
  await activityList.checkConfirmedTxNumberDisplayedInActivity(
    expectedConfirmedTxCount,
  );
  if (expectedAmount) {
    await activityList.checkTxAmountInActivity(expectedAmount, 1);
  }
  await activityList.checkNoFailedTransactions();
}
