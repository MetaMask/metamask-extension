import type { CaipAssetType, Hex } from '@metamask/utils';
import { toEvmCaipChainId } from '@metamask/multichain-network-controller';
import { NETWORK_TO_SHORT_NETWORK_NAME_MAP } from '../../../../shared/constants/bridge';
import { toAssetId } from '../../../../shared/lib/asset-utils';
import { buildAssetRoutePath } from '../../../../shared/lib/asset-route';
import { Driver } from '../../webdriver/driver';
import AccountListPage from '../pages/accounts/list-page';
import ActivityTab from '../pages/home/activity-tab';
import SwapAssetPickerPage from '../pages/swap/swap-asset-picker-page';
import SwapPage, { type AssetPickerSide } from '../pages/swap/swap-page';
import HomePage from '../pages/home/homepage';
import TokenOverviewPage from '../pages/asset/token-overview-page';

export type BridgeQuote = {
  amount: string;
  tokenFrom?: string;
  tokenTo?: string;
  fromChain?: string;
  toChain?: string;
  unapproved?: boolean;
};

export type SwapOptions = {
  amount: number;
  swapFrom: string;
  swapTo: string;
  network: string;
  swapToContractAddress?: string;
};

/**
 * Opens an asset picker from the Swap screen, searches for a token and
 * selects it.
 *
 * @param driver - The driver instance.
 * @param token - Token symbol to search for and select.
 * @param assetPicker - Which asset picker to open. Defaults to the source.
 */
export const searchAndSelectToken = async (
  driver: Driver,
  token: string,
  assetPicker: AssetPickerSide = 'source',
): Promise<void> => {
  console.log(`Selecting ${assetPicker} token ${token}`);
  await new SwapPage(driver).openAssetPicker(assetPicker);
  await new SwapAssetPickerPage(driver).searchAndSelectToken(token);
};

/**
 * Selects the source token when it is not already selected.
 * Re-selecting the current token clears the balance and hides Max.
 *
 * @param driver - The driver instance.
 * @param token - Token symbol, such as ETH or MON.
 */
export const selectSourceTokenIfNeeded = async (
  driver: Driver,
  token: string,
): Promise<void> => {
  if (await new SwapPage(driver).isSourceTokenSelected(token)) {
    return;
  }
  await searchAndSelectToken(driver, token);
};

/**
 * Opens the destination asset picker from the Swap screen and selects a
 * token, searching for it only when it is not already listed.
 *
 * @param driver - The driver instance.
 * @param token - Token symbol to select.
 */
export const selectDestinationToken = async (
  driver: Driver,
  token: string,
): Promise<void> => {
  await new SwapPage(driver).openAssetPicker('destination');
  const assetPickerPage = new SwapAssetPickerPage(driver);
  await assetPickerPage.checkPageIsLoaded();
  if (!(await assetPickerPage.isTokenListed(token))) {
    await assetPickerPage.search(token);
  }
  await assetPickerPage.selectToken(token);
};

/**
 * Opens the destination asset picker from the Swap screen and selects a token
 * by contract address, importing it first when it is not listed.
 *
 * @param driver - The driver instance.
 * @param contractAddress - The token contract address.
 */
export const selectDestinationTokenByContract = async (
  driver: Driver,
  contractAddress: string,
): Promise<void> => {
  await new SwapPage(driver).openAssetPicker('destination');
  await new SwapAssetPickerPage(driver).selectTokenByContractAddress(
    contractAddress,
  );
};

/**
 * Builds a same-chain swap on the Swap screen: picks the source and
 * destination tokens on the given network, then enters the amount.
 *
 * @param driver - The driver instance.
 * @param options - The swap to build.
 */
export const createSwap = async (
  driver: Driver,
  options: SwapOptions,
): Promise<void> => {
  const swapPage = new SwapPage(driver);
  const assetPickerPage = new SwapAssetPickerPage(driver);

  await swapPage.openAssetPicker('source');
  await assetPickerPage.selectNetwork(options.network);
  await assetPickerPage.checkPageIsLoaded(30000);
  await assetPickerPage.searchAndSelectToken(options.swapFrom, {
    timeout: 30000,
  });

  await swapPage.openAssetPicker('destination');
  await assetPickerPage.selectNetwork(options.network);
  if (options.swapToContractAddress) {
    await assetPickerPage.selectTokenByContractAddress(
      options.swapToContractAddress,
    );
  } else {
    await assetPickerPage.checkPageIsLoaded(30000);
    await assetPickerPage.searchAndSelectToken(options.swapTo, {
      timeout: 30000,
    });
  }

  await swapPage.enterSwapAmount(options.amount.toString());
};

/**
 * Fills in the Swap screen: picks the source and destination networks and
 * tokens through the asset picker, then enters the amount.
 *
 * @param driver - The driver instance.
 * @param quote - The quote inputs to enter.
 * @param options - Options.
 * @param options.openPickersWithDebounce - Opens the asset pickers only after
 * the Swap screen has sent its debounced quote parameter update. Set this only
 * when the test asserts on `Input Changed` metrics events.
 */
export const enterBridgeQuote = async (
  driver: Driver,
  quote: BridgeQuote,
  {
    openPickersWithDebounce = false,
  }: { openPickersWithDebounce?: boolean } = {},
): Promise<void> => {
  const swapPage = new SwapPage(driver);
  const assetPickerPage = new SwapAssetPickerPage(driver);
  const pickerOptions = { waitForQuoteParamsDebounce: openPickersWithDebounce };

  if (quote.tokenFrom || quote.fromChain) {
    await swapPage.openAssetPicker('source', pickerOptions);
    if (quote.fromChain) {
      await assetPickerPage.selectNetwork(quote.fromChain);
    }
    if (quote.tokenFrom) {
      await assetPickerPage.searchAndSelectToken(quote.tokenFrom);
    }
  }

  if (quote.tokenTo || quote.toChain) {
    await swapPage.openAssetPicker('destination', pickerOptions);
    if (quote.toChain) {
      await assetPickerPage.selectNetwork(quote.toChain);
    }
    if (quote.tokenTo) {
      await assetPickerPage.searchAndSelectToken(quote.tokenTo);
    }
  }

  await swapPage.enterBridgeAmount(quote.amount);
};

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
  await new SwapPage(driver).goBackAfterSubmit();
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
 * @param testParams.expectedTotalCost - The expected Total cost shown in the Select quote dialog, as rendered (e.g. `$2.26` or `0.0143 ETH`). Pass an array to assert every quote in display order. When omitted the dialog is not opened.
 * @param testParams.expectedDetailsDestAmount - The expected destination amount shown in the transaction details
 * @param testParams.expectedActivityAmount - The expected destination amount shown in the activity list
 * @param testParams.submitDelay - The delay to wait before submitting the transaction, must be less than the refresh interval of the stream
 * @param testParams.expectedStatus - The expected state of the transaction
 * @param testParams.skipStatusPage - Whether to skip the status page after submitting
 * @param testParams.openPickersWithDebounce - Whether to open the asset pickers only after the prepare page has sent its debounced quote parameter update. Set this only when the test asserts on `Input Changed` metrics events.
 * @param testParams.expectedInitialSourceToken - Expected source token on the prepare page before entering the quote (defaults to ETH).
 * @param testParams.expectedInitialDestToken - Expected destination token on the prepare page before entering the quote (defaults to mUSD).
 * @param testParams.skipNetworkFeeCheck - Skip the `$X.XX` network fee assertion (e.g. when fee estimation is unavailable for the chain under test).
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
  expectedTotalCost,
  submitDelay,
  skipStatusPage,
  openPickersWithDebounce,
  expectedInitialSourceToken = 'ETH',
  expectedInitialDestToken = 'mUSD',
  skipNetworkFeeCheck = false,
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
  expectedTotalCost?: string[];
  submitDelay?: number;
  skipStatusPage?: boolean;
  openPickersWithDebounce?: boolean;
  expectedInitialSourceToken?: string;
  expectedInitialDestToken?: string;
  skipNetworkFeeCheck?: boolean;
}) => {
  const homePage = new HomePage(driver);
  await homePage.goToHomePage();
  await homePage.startSwapFlow();

  const swapPage = new SwapPage(driver);

  await swapPage.checkAssetsAreSelected(
    expectedInitialSourceToken,
    expectedInitialDestToken,
  );
  await enterBridgeQuote(driver, quote, { openPickersWithDebounce });
  await swapPage.waitForQuote();
  if (!skipNetworkFeeCheck) {
    await swapPage.checkExpectedNetworkFeeIsDisplayed();
  }
  submitDelay && (await driver.delay(submitDelay));
  if (expectedDestAmount) {
    await swapPage.checkDestAmount(expectedDestAmount);
  }
  if (expectedTotalCost) {
    await swapPage.checkQuoteTotalCost(expectedTotalCost);
  }

  if (skipStatusPage) {
    await swapPage.submitQuote();
  } else {
    await swapPage.submitQuoteAndDismiss();
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
 * Opens an asset picker from the Swap screen, searches for a token (filtering
 * to the token's network), clicks the info icon to navigate to the token's
 * asset overview page, and waits for it to load.
 *
 * @param params - The parameters for navigating to the asset page.
 * @param params.driver - The driver instance.
 * @param params.token - The token symbol to search for (e.g. 'DAI').
 * @param params.chainId - The chain ID where the token lives (e.g. '0x1').
 * @param params.address - The token contract address.
 * @param params.assetPicker - Which asset picker to open. Defaults to the
 * source.
 */
export const goToAssetPage = async ({
  driver,
  token,
  chainId,
  address,
  assetPicker = 'source',
}: {
  driver: Driver;
  token: string;
  chainId: Hex;
  address: string;
  assetPicker?: AssetPickerSide;
}) => {
  const assetId = toAssetId(address, chainId);
  if (!assetId) {
    throw new Error('Unable to resolve asset id for bridge flow');
  }

  const network =
    NETWORK_TO_SHORT_NETWORK_NAME_MAP[
      chainId as keyof typeof NETWORK_TO_SHORT_NETWORK_NAME_MAP
    ];

  await new SwapPage(driver).openAssetPicker(assetPicker);
  await new SwapAssetPickerPage(driver).searchAndClickAssetInfo({
    token,
    assetId,
    network,
  });

  await waitForAssetPageNavigation(driver, { chainId, address, assetId });
  const assetPage = new TokenOverviewPage(driver);
  await assetPage.checkPageIsLoaded();
};
