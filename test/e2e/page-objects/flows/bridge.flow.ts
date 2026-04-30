import type { Hex } from '@metamask/utils';
import { toAssetId } from '../../../../shared/lib/asset-utils';
import { ASSET_ROUTE } from '../../../../shared/lib/deep-links/routes/route';
import { toChecksumHexAddress } from '../../../../shared/lib/hexstring-utils';
import { Driver } from '../../webdriver/driver';
import AccountListPage from '../pages/account-list-page';
import ActivityListPage from '../pages/home/activity-list';
import BridgeQuotePage, { type BridgeQuote } from '../pages/bridge/quote-page';
import HomePage from '../pages/home/homepage';
import TokenOverviewPage from '../pages/token-overview-page';

export const verifySubmittedSwapTransaction = async ({
  driver,
  quote,
  expectedTransactionsCount = 1,
  expectedStatus = 'success',
  expectedWalletBalance,
  expectedSwapTokens,
  expectedDestAmount,
}: {
  driver: Driver;
  quote: BridgeQuote;
  expectedTransactionsCount: number;
  expectedStatus?: 'success' | 'failed' | 'pending';
  expectedWalletBalance?: string;
  expectedSwapTokens?: Pick<BridgeQuote, 'tokenFrom' | 'tokenTo'>;
  expectedDestAmount?: string;
}) => {
  const homePage = new HomePage(driver);
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
  // Check the amount of ETH deducted in the activity is correct
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

  // Check the wallet ETH balance is correct
  const accountListPage = new AccountListPage(driver);
  if (expectedWalletBalance) {
    await accountListPage.checkAccountValueAndSuffixDisplayed(
      expectedWalletBalance,
    );
  }
};

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
 * @param testParams.skipStatusPage - Whether to skip the status page after submitting
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
  skipStatusPage,
}: {
  driver: Driver;
  quote: BridgeQuote;
  expectedTransactionsCount: number;
  expectedStatus?: 'success' | 'failed' | 'pending';
  expectedWalletBalance?: string;
  expectedSwapTokens?: Pick<BridgeQuote, 'tokenFrom' | 'tokenTo'>;
  expectedDestAmount: string;
  submitDelay?: number;
  skipStatusPage?: boolean;
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

  if (skipStatusPage) {
    await bridgePage.submitQuote();
  } else {
    await bridgePage.submitQuoteAndDismiss();
  }

  await verifySubmittedSwapTransaction({
    driver,
    quote,
    expectedTransactionsCount,
    expectedStatus,
    expectedWalletBalance,
    expectedSwapTokens,
    expectedDestAmount,
  });
};

/**
 * Searches for a token in the asset picker, clicks the info icon to navigate
 * to the token's asset overview page, and waits for it to load.
 *
 * @param params - The parameters for navigating to the asset page.
 * @param params.driver - The driver instance.
 * @param params.token - The token symbol to search for (e.g. 'DAI').
 * @param params.chainId - The chain ID where the token lives (e.g. '0x1').
 * @param params.address - The token contract address.
 * @param params.assetPicker - Optional CSS selector for the asset picker button.
 */
export const goToAssetPage = async ({
  driver,
  token,
  chainId,
  address,
  assetPicker,
}: {
  driver: Driver;
  token: string;
  chainId: Hex;
  address: string;
  assetPicker?: string;
}) => {
  const bridgePage = new BridgeQuotePage(driver);
  const picker = assetPicker ?? bridgePage.sourceAssetPickerButton;
  const expectedAssetId = toAssetId(address, chainId)?.toLowerCase();
  const expectedUrl = `${ASSET_ROUTE}/${chainId}/${encodeURIComponent(toChecksumHexAddress(address))}`;

  await bridgePage.searchAndClickAssetInfo({
    token,
    assetId: expectedAssetId ?? '',
    assetPicker: picker,
  });

  await driver.waitForUrlContaining({ url: expectedUrl });
  const assetPage = new TokenOverviewPage(driver);
  await assetPage.checkPageIsLoaded();
};
