import { Driver } from '../../webdriver/driver';
import BridgeQuotePage, { type BridgeQuote } from '../pages/bridge/quote-page';
import ActivityListPage from '../pages/home/activity-list';
import AccountListPage from '../pages/account-list-page';
import HomePage from '../pages/home/homepage';

/**
 * Execute a bridge transaction and checks the activity list
 *
 * @param testParams - The test parameters
 * @param testParams.driver - The driver instance
 * @param testParams.quote - The quote input parameters
 * @param testParams.expectedTransactionsCount - The number of transactions to expect in the activity list
 * @param testParams.expectedWalletBalance - The expected wallet balance after the transaction
 * @param testParams.expectedSwapTokens - The expected swap tokens shown in the activity list
 * @param testParams.expectedDestAmount - The expected quoted destination amounts in the quote page
 * @param testParams.submitDelay - The delay to wait before submitting the transaction, must be less than the refresh interval of the stream
 * @param testParams.expectedStatus - The expected state of the transaction
 * @param testParams.dismissStatusPage - Whether to dismiss the status page after submitting
 */
export const bridgeTransaction = async ({
  driver,
  quote,
  expectedTransactionsCount = 1,
  expectedStatus = 'success',
  expectedWalletBalance,
  expectedSwapTokens,
  expectedDestAmount,
  submitDelay,
  dismissStatusPage = false,
}: {
  driver: Driver;
  quote: BridgeQuote;
  expectedTransactionsCount: number;
  expectedStatus?: 'success' | 'failed' | 'pending';
  expectedWalletBalance?: string;
  expectedSwapTokens?: Pick<BridgeQuote, 'tokenFrom' | 'tokenTo'>;
  expectedDestAmount: string;
  submitDelay?: number;
  dismissStatusPage?: boolean;
}) => {
  const homePage = new HomePage(driver);
  await homePage.checkPageIsLoaded();
  await homePage.startSwapFlow();

  const bridgePage = new BridgeQuotePage(driver);

  await bridgePage.checkAssetsAreSelected('ETH', 'mUSD');
  await bridgePage.enterBridgeQuote(quote);
  await bridgePage.waitForQuote();
  await bridgePage.checkExpectedNetworkFeeIsDisplayed();
  submitDelay && (await driver.delay(submitDelay));
  if (expectedDestAmount) {
    await bridgePage.checkDestAmount(expectedDestAmount);
  }
  await bridgePage.submitQuote({ dismissStatusPage });

  await homePage.goToActivityList();

  const activityList = new ActivityListPage(driver);
  await activityList.checkCompletedBridgeTransactionActivity(
    expectedTransactionsCount,
  );

  const isBridge =
    quote.fromChain && quote.toChain
      ? quote.fromChain !== quote.toChain
      : false;

  let action = '';
  const expectedSrcToken = quote.tokenFrom ?? expectedSwapTokens?.tokenFrom;
  const expectedDestToken = quote.tokenTo ?? expectedSwapTokens?.tokenTo;

  if (quote.unapproved) {
    action = isBridge
      ? `Bridged to ${quote.toChain}`
      : `Swapped ${expectedSrcToken} to ${expectedDestToken}`;
    await activityList.checkTxAction({
      action,
      confirmedTx: expectedTransactionsCount,
    });
    await activityList.checkTxAction({
      action: `Approve ${expectedSrcToken} for ${isBridge ? 'bridge' : 'swap'}`,
      confirmedTx: expectedTransactionsCount,
      txIndex: 2,
    });
  } else {
    action = isBridge
      ? `Bridged to ${quote.toChain}`
      : `Swap ${expectedSrcToken} to ${expectedDestToken}`;
    await activityList.checkTxAction({
      action,
      confirmedTx: expectedTransactionsCount,
    });
  }

  await activityList.checkTxAmountInActivity(
    `-${quote.amount} ${quote.tokenFrom ?? expectedSwapTokens?.tokenFrom}`,
  );

  await activityList.checkBridgeTransactionDetails(
    action,
    isBridge,
    expectedStatus,
    quote.amount,
    expectedSrcToken,
    expectedDestAmount,
    expectedDestToken,
  );

  const accountListPage = new AccountListPage(driver);
  if (expectedWalletBalance) {
    await accountListPage.checkAccountValueAndSuffixDisplayed(
      expectedWalletBalance,
    );
  }
};
