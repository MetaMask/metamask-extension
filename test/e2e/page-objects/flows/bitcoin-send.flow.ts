import { DEFAULT_BTC_BALANCE } from '../../constants';
import { Driver } from '../../webdriver/driver';
import { TxToastNotification } from '../components/tx-toast-notification';
import ActivityTab from '../pages/home/activity-tab';
import HomePage from '../pages/home/homepage';
import TokensTab from '../pages/home/tokens-tab';
import BitcoinReviewTxPage from '../pages/send/bitcoin-review-tx-page';
import SendPage from '../pages/send/send-page';
import { login } from './login.flow';
import { switchToNetworkFromNetworkSelect } from './network.flow';

const BITCOIN_CHAIN_ID = 'bip122:000000000019d6689c085ae165831e93';
const BITCOIN_CONFIRMATION_TIMEOUT_MS = 90_000;

/**
 * Logs in, selects Bitcoin, and opens the BTC send form.
 *
 * @param driver - The webdriver instance.
 * @param expectedBalance - BTC balance expected on the homepage.
 * @returns The Bitcoin send page.
 */
export const landOnBitcoinSendScreen = async (
  driver: Driver,
  expectedBalance: number = DEFAULT_BTC_BALANCE,
): Promise<SendPage> => {
  await login(driver);
  const homePage = new HomePage(driver);
  await homePage.checkPageIsLoaded();
  await switchToNetworkFromNetworkSelect(driver, 'Bitcoin');
  // Refresh re-hydrates the UI from background state so the asynchronously
  // fetched Snap balance is shown reliably.
  await homePage.refreshPage();
  await new TokensTab(driver).checkExpectedTokenBalanceIsDisplayed(
    `${expectedBalance}`,
    'BTC',
  );

  await homePage.startSendFlow();
  const sendPage = new SendPage(driver);
  await sendPage.selectToken(BITCOIN_CHAIN_ID, 'BTC');
  return sendPage;
};

/**
 * Broadcasts a Bitcoin send transaction from the homepage through confirmation.
 *
 * @param params - An object containing the parameters.
 * @param params.driver - The webdriver instance.
 * @param params.recipientAddress - The recipient Bitcoin address.
 * @param params.amount - The amount of BTC to send.
 * @param params.expectedBalance - The expected BTC balance shown before sending. Defaults to DEFAULT_BTC_BALANCE.
 */
export const broadcastBitcoinSend = async ({
  driver,
  recipientAddress,
  amount,
  expectedBalance = DEFAULT_BTC_BALANCE,
}: {
  driver: Driver;
  recipientAddress: string;
  amount: string;
  expectedBalance?: number;
}): Promise<void> => {
  const homePage = new HomePage(driver);
  const assetList = new TokensTab(driver);
  await assetList.checkTokenAmountIsDisplayed(`${expectedBalance} BTC`);

  const sendPage = new SendPage(driver);
  await homePage.startSendFlow();
  await sendPage.selectToken(BITCOIN_CHAIN_ID, 'BTC');
  await sendPage.fillRecipient({ recipientAddress });
  await sendPage.fillAmount(amount);
  await sendPage.checkContinueButton({ state: 'enabled' });
  await sendPage.pressContinueButton();

  const reviewPage = new BitcoinReviewTxPage(driver);
  await reviewPage.checkPageIsLoaded();
  await reviewPage.clickConfirmButton();

  const txToast = new TxToastNotification(driver);
  await txToast.checkTxSubmittedToast();
  await txToast.closeToastNotification();
};

/**
 * Confirms a prepared Bitcoin send and checks its activity entry.
 *
 * @param params - Send assertion parameters.
 * @param params.driver - The webdriver instance.
 * @param params.expectedAmount - Exact amount expected in the activity list.
 * @returns The activity page object for additional lifecycle assertions.
 */
export const confirmBitcoinSendAndAssertPending = async ({
  driver,
  expectedAmount,
}: {
  driver: Driver;
  expectedAmount?: string;
}): Promise<ActivityTab> => {
  const reviewPage = new BitcoinReviewTxPage(driver);
  await reviewPage.checkPageIsLoaded();
  await reviewPage.clickConfirmButton();

  const txToast = new TxToastNotification(driver);
  await txToast.checkTxSubmittedToast();

  const homePage = new HomePage(driver);
  await homePage.goToActivityList();
  const activityTab = new ActivityTab(driver);
  await activityTab.checkTransactionActivityByText('Sending');
  if (expectedAmount) {
    await activityTab.checkWaitForTransactionStatusByAmount(
      expectedAmount,
      'pending',
    );
  } else {
    await activityTab.checkWaitForTransactionStatus('pending');
  }
  return activityTab;
};

/**
 * Waits for the visible Bitcoin transaction to become confirmed.
 *
 * @param params - Confirmation assertion parameters.
 * @param params.activityTab - Activity page object for the current Bitcoin account.
 * @param params.expectedAmount - Exact amount identifying the outgoing send.
 */
export const waitForBitcoinSendConfirmation = async ({
  activityTab,
  expectedAmount,
}: {
  activityTab: ActivityTab;
  expectedAmount: string;
}): Promise<void> => {
  await activityTab.checkWaitForTransactionStatusByAmount(
    expectedAmount,
    'confirmed',
    {
      timeout: BITCOIN_CONFIRMATION_TIMEOUT_MS,
    },
  );
};
