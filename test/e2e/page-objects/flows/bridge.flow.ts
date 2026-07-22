import type { CaipAssetType, Hex } from '@metamask/utils';
import { toEvmCaipChainId } from '@metamask/multichain-network-controller';
import { toAssetId } from '../../../../shared/lib/asset-utils';
import { buildAssetRoutePath } from '../../../../shared/lib/asset-route';
import { Driver } from '../../webdriver/driver';
import AccountListPage from '../pages/account-list-page';
import ActivityTab from '../pages/home/activity-tab';
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
  expectedDetailsDestAmount,
  expectedActivityAmount,
}: {
  driver: Driver;
  quote: BridgeQuote;
  expectedTransactionsCount: number;
  expectedStatus?: 'success' | 'failed' | 'pending';
  expectedWalletBalance?: string;
  expectedSwapTokens?: Pick<BridgeQuote, 'tokenFrom' | 'tokenTo'>;
  expectedDestAmount?: string;
  expectedDetailsDestAmount?: string;
  expectedActivityAmount?: string;
}) => {
  const homePage = new HomePage(driver);
  await homePage.goToActivityList();

  const activityTab = new ActivityTab(driver);
  await activityTab.checkCompletedBridgeTransactionActivity(
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
    action = isBridge ? `Bridged ${expectedSrcToken}` : 'Swapped';
    await activityTab.checkTxAction({
      action,
      confirmedTx: expectedTransactionsCount,
    });
    await activityTab.checkTxAction({
      action: 'Approved spending cap',
      confirmedTx: expectedTransactionsCount,
      txIndex: 2,
    });
  } else {
    action = isBridge ? `Bridged ${expectedSrcToken}` : 'Swapped';
    await activityTab.checkTxAction({
      action,
      confirmedTx: expectedTransactionsCount,
    });
  }
  // v3 activity rows show the destination amount as the primary line
  await activityTab.checkTxAmountInActivity(
    `${expectedActivityAmount ?? expectedDestAmount} ${quote.tokenTo ?? expectedSwapTokens?.tokenTo}`,
  );

  await activityTab.checkBridgeTransactionDetails(
    action,
    isBridge,
    expectedStatus,
    undefined,
    expectedSrcToken,
    expectedDetailsDestAmount ?? expectedDestAmount,
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
 * @param testParams.expectedDetailsDestAmount - The expected destination amount shown in the transaction details
 * @param testParams.expectedActivityAmount - The expected destination amount shown in the activity list
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
  expectedDetailsDestAmount,
  expectedActivityAmount,
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
  expectedDetailsDestAmount?: string;
  expectedActivityAmount?: string;
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
    expectedDetailsDestAmount,
    expectedActivityAmount,
  });
};

const waitForAssetPageNavigation = async (
  driver: Driver,
  {
    chainId,
    address,
    assetId,
  }: {
    chainId: Hex;
    address: string;
    assetId: CaipAssetType;
  },
) => {
  const lowercaseAssetId = assetId.toLowerCase() as CaipAssetType;
  const encodedLowercasePath = buildAssetRoutePath(lowercaseAssetId);
  const checksummedAssetId = toAssetId(address, chainId);
  const encodedChecksumPath = checksummedAssetId
    ? buildAssetRoutePath(checksummedAssetId)
    : encodedLowercasePath;
  const caipChainId = toEvmCaipChainId(chainId);
  const addressNeedle = address.toLowerCase().slice(2);

  await driver.waitUntil(
    async () => {
      const url = (await driver.getCurrentUrl()).toLowerCase();
      return (
        url.includes(encodedLowercasePath.toLowerCase()) ||
        url.includes(encodedChecksumPath.toLowerCase()) ||
        (url.includes(`/asset/${caipChainId.toLowerCase()}`) &&
          url.includes(addressNeedle))
      );
    },
    { timeout: driver.timeout, interval: 100 },
  );
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
  const assetId = toAssetId(address, chainId);
  if (!assetId) {
    throw new Error('Unable to resolve asset id for bridge flow');
  }
  // Bridge search results use lowercase erc20 addresses; wallet-held assets may
  // use checksummed CAIP-19 ids from toAssetId().
  const normalizedAssetId = assetId.toLowerCase() as typeof assetId;

  try {
    await bridgePage.searchAndClickAssetInfo({
      token,
      assetId: normalizedAssetId,
      assetPicker: picker,
    });
  } catch (error) {
    if (assetId === normalizedAssetId) {
      throw error;
    }
    await bridgePage.searchAndClickAssetInfo({
      token,
      assetId,
      assetPicker: picker,
    });
  }

  await waitForAssetPageNavigation(driver, { chainId, address, assetId });
  const assetPage = new TokenOverviewPage(driver);
  await assetPage.checkPageIsLoaded();
};
