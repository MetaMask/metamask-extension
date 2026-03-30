/**
 * Shared helper functions for swap quotation tests
 *
 * Provides reusable functions for:
 * - Importing tokens from tokenlist URLs
 * - Performing swap flows
 * - Capturing quotation values
 * - Switching tokens and comparing quotations
 * - Generating test reports
 */

import { Driver } from '../../../webdriver/driver';
import { PROD_DELAYS } from '../../helpers/prod-test-helpers';
import { toHex } from '@metamask/controller-utils';
import AssetListPage from '../../../page-objects/pages/home/asset-list';
import HomePage from '../../../page-objects/pages/home/homepage';
import {
  Token,
  QuotationSnapshot,
  QuotationTestResult,
  ConsolidatedTestResults,
  DEFAULT_SWAP_AMOUNT,
  TOKENS_TO_IMPORT,
} from './network-swap-config';

/**
 * Fetch tokens from a tokenlist URL and return the first N tokens
 *
 * Supports multiple tokenlist formats and filters by chain ID
 * @param tokenlistUrl - URL to the tokenlist JSON file
 * @param chainId - Chain ID to filter tokens
 * @param count - Number of tokens to return (default: TOKENS_TO_IMPORT)
 * @returns Promise resolving to array of Token objects
 * @throws Error if tokenlist fetch fails or no tokens found
 */
export async function importTokensFromTokenlist(
  tokenlistUrl: string,
  chainId: number,
  count: number = TOKENS_TO_IMPORT,
): Promise<Token[]> {
  console.log(
    `[HELPER] Fetching tokenlist from: ${tokenlistUrl}`,
  );
  let data: any;

  // Handle both remote URLs and local file:// URLs
  if (tokenlistUrl.startsWith('file://')) {
    // For local files, use fs module instead of fetch
    const fs = await import('fs').then((m) => m.promises);
    const filePath = tokenlistUrl.replace('file://', '');
    const fileContent = await fs.readFile(filePath, 'utf-8');
    data = JSON.parse(fileContent);
  } else {
    // For remote URLs, use fetch
    const response = await fetch(tokenlistUrl);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch tokenlist: ${response.status} ${response.statusText}`,
      );
    }
    data = await response.json();
  }

  let tokensArray: Token[] = [];

  // Strategy 1: Check if data is directly an array
  if (Array.isArray(data)) {
    tokensArray = data;
  }
  // Strategy 2: Check if data.tokens exists (standard format)
  else if (data.tokens && Array.isArray(data.tokens)) {
    tokensArray = data.tokens;
  }
  // Strategy 3: Check for nested structures (e.g., data.data.tokens)
  else if (data.data?.tokens && Array.isArray(data.data.tokens)) {
    tokensArray = data.data.tokens;
  }
  // Strategy 4: Search for any "tokens" property recursively
  else {
    tokensArray = findTokensArray(data);
  }

  if (!tokensArray || tokensArray.length === 0) {
    throw new Error(`No tokens array found in tokenlist from ${tokenlistUrl}`);
  }

  console.log(
    `[HELPER] Total tokens in tokenlist: ${tokensArray.length}`,
  );

  // Normalize logoUri/logoURI field (some tokenlists use lowercase, some uppercase)
  const normalizedTokens = tokensArray.map((token: any) => {
    if (token.logoUri && !token.logoURI) {
      return { ...token, logoURI: token.logoUri };
    }
    if (token.logoURI && !token.logoUri) {
      return { ...token, logoUri: token.logoURI };
    }
    return token;
  });

  // Filter for tokens matching the specified chain ID
  const filteredTokens = normalizedTokens.filter(
    (token: Token) => Number(token.chainId) === chainId,
  );

  if (filteredTokens.length === 0) {
    console.warn(
      `[WARN] No tokens found for chainId ${chainId} in tokenlist`,
    );
    const availableChainIds = [
      ...new Set(normalizedTokens.map((t: Token) => Number(t.chainId))),
    ];
    console.warn(
      `[WARN] Available chain IDs in tokenlist: ${availableChainIds.join(', ')}`,
    );
    throw new Error(
      `No tokens found for chainId ${chainId} in tokenlist`,
    );
  }

  console.log(
    `[HELPER] Filtered tokens for chainId ${chainId}: ${filteredTokens.length}`,
  );

  // Return first N tokens
  const selectedTokens = filteredTokens.slice(0, count);
  console.log(
    `[HELPER] Selected first ${selectedTokens.length} tokens: ${selectedTokens.map((t) => t.symbol).join(', ')}`,
  );

  return selectedTokens;
}

/**
 * Import tokens into wallet via UI and verify each token is visible in asset list
 *
 * @param driver - Playwright Driver instance
 * @param chainId - Chain ID used in token import dropdown
 * @param tokens - Tokens to import
 */
export async function importTokensIntoWallet(
  driver: Driver,
  chainId: number,
  tokens: Token[],
): Promise<void> {
  const assetListPage = new AssetListPage(driver);
  const chainIdHex = toHex(chainId).toString();

  await driver.clickElement('[data-testid="account-overview__asset-tab"]');
  await driver.delay(PROD_DELAYS.API_RESPONSE);

  for (const token of tokens) {
    console.log(
      `[HELPER] Importing token in wallet: ${token.symbol} (${token.address})`,
    );
    await assetListPage.importCustomTokenByChain(chainIdHex, token.address);
    await driver.delay(PROD_DELAYS.API_RESPONSE);
  }

  for (const token of tokens) {
    await assetListPage.checkTokenExistsInList(token.symbol);
    console.log(`[HELPER] Verified token visible in asset list: ${token.symbol}`);
  }
}

/**
 * Recursively search for a "tokens" array in nested objects
 * @param obj - Object to search
 * @returns Array of tokens if found, empty array otherwise
 */
function findTokensArray(obj: any): Token[] {
  if (Array.isArray(obj)) {
    return obj;
  }
  if (typeof obj !== 'object' || obj === null) {
    return [];
  }
  for (const key in obj) {
    if (key === 'tokens' && Array.isArray(obj[key])) {
      return obj[key];
    }
    const result = findTokensArray(obj[key]);
    if (result.length > 0) {
      return result;
    }
  }
  return [];
}

/**
 * Perform a complete swap flow from native token to destination token
 *
 * Steps:
 * 1. Click native token in asset list
 * 2. Click Swap button on token details page
 * 3. Click bridge-destination-button
 * 4. Search for and select destination token by address
 * 5. Fill from-amount with specified value
 *
 * @param driver - Playwright Driver instance
 * @param options - Swap flow options
 * @throws Error if any step fails
 */
export async function performSwapFlow(
  driver: Driver,
  options: {
    sourceTokenSymbol: string;
    destinationTokenAddress: string;
    destinationTokenSymbol: string;
    fromAmount?: number;
  },
): Promise<void> {
  const {
    sourceTokenSymbol,
    destinationTokenAddress,
    destinationTokenSymbol,
    fromAmount = DEFAULT_SWAP_AMOUNT,
  } = options;

  console.log(
    `[HELPER] Starting swap flow: ${sourceTokenSymbol} → ${destinationTokenSymbol}`,
  );

  // Step 1: Open source token details from asset list
  console.log(`[HELPER] Step 1: Clicking source token (${sourceTokenSymbol})`);
  const assetListPage = new AssetListPage(driver);

  await driver.clickElement('[data-testid="account-overview__asset-tab"]');
  await driver.delay(PROD_DELAYS.API_RESPONSE);
  try {
    await assetListPage.clickOnAsset(sourceTokenSymbol);
  } catch (error) {
    await driver.clickElement({
      css: '[data-testid="multichain-token-list-button"]',
      text: sourceTokenSymbol,
    });
  }
  await driver.delay(PROD_DELAYS.API_RESPONSE);

  // Step 2: Try clicking Swap from token details, fallback to homepage swap if missing
  console.log(`[HELPER] Step 2: Clicking Swap button`);
  let clickedSwap = false;
  const swapSelectors: Array<string | { text: string; css: string }> = [
    '[data-testid="eth-overview-swap"]',
    { text: 'Swap', css: '.icon-button' },
    '[aria-label="Swap"]',
  ];

  for (const swapSelector of swapSelectors) {
    try {
      await driver.waitForSelector(swapSelector, { timeout: 10000 });
      await driver.clickElement(swapSelector);
      clickedSwap = true;
      break;
    } catch (error) {
      // Try next selector
    }
  }

  if (!clickedSwap) {
    console.log(
      '[HELPER] Swap button not found on token details, falling back to homepage swap flow',
    );
    try {
      await navigateBack(driver);
    } catch (error) {
      // best effort
    }
    const homePage = new HomePage(driver);
    await homePage.startSwapFlow();
  }
  await driver.delay(PROD_DELAYS.API_RESPONSE);

  // Step 3: Ensure source token is selected in swap UI
  console.log(`[HELPER] Step 3: Selecting source token (${sourceTokenSymbol})`);
  const sourceButton = '[data-testid="bridge-source-button"]';
  const searchInput = '[data-testid="bridge-asset-picker-search-input"]';
  const bridgeAsset = '[data-testid="bridge-asset"]';

  await driver.waitForSelector(sourceButton);
  await driver.clickElement(sourceButton);
  await driver.waitForSelector(searchInput);
  await driver.fill(searchInput, sourceTokenSymbol);
  await driver.waitForSelector({ css: bridgeAsset, text: sourceTokenSymbol });
  await driver.clickElement({ css: bridgeAsset, text: sourceTokenSymbol });
  await driver.delay(PROD_DELAYS.API_RESPONSE);

  // Step 4: Click bridge-destination-button to open token selector
  console.log(`[HELPER] Step 4: Opening destination token selector`);
  const destinationButton = '[data-testid="bridge-destination-button"]';
  await driver.waitForSelector(destinationButton);
  await driver.clickElement(destinationButton);
  await driver.delay(PROD_DELAYS.API_RESPONSE);

  // Step 5: Search for and select destination token
  console.log(
    `[HELPER] Step 5: Searching for token (${destinationTokenAddress})`,
  );
  await driver.waitForSelector(searchInput);
  await driver.clickElement(searchInput);
  await driver.fill(searchInput, destinationTokenAddress);
  await driver.delay(PROD_DELAYS.API_RESPONSE);

  // Select the token from search results
  console.log(`[HELPER] Selecting token from search results`);
  const tokenOption = '[data-testid="bridge-asset"]';
  await driver.waitForSelector(tokenOption);
  await driver.clickElement(tokenOption);
  await driver.delay(PROD_DELAYS.API_RESPONSE);

  // Step 6: Fill from-amount
  console.log(`[HELPER] Step 6: Filling from-amount with ${fromAmount}`);
  const fromAmountInput = '[data-testid="from-amount"]';
  await driver.waitForSelector(fromAmountInput);
  await driver.fill(fromAmountInput, fromAmount.toString());
  await driver.delay(PROD_DELAYS.API_RESPONSE);

  console.log(
    `[HELPER] Swap flow completed: ${sourceTokenSymbol} → ${destinationTokenSymbol}`,
  );
}

/**
 * Capture quotation values from the swap page
 *
 * Extracts 5 key values:
 * 1. to-amount (data-testid="to-amount")
 * 2. network-fees-sponsored (data-testid="network-fees-sponsored")
 * 3. slippageValue (XPath: //*[@data-testid="slippage-edit-button"]/../p)
 * 4. priceImpact (XPath: //*[text()='Price impact']/../../div[2]/p)
 * 5. minimumReceived (data-testid="minimum-received")
 *
 * @param driver - Playwright Driver instance
 * @returns Promise resolving to QuotationSnapshot
 * @throws Error if unable to capture required values
 */
export async function captureQuotationValues(
  driver: Driver,
): Promise<QuotationSnapshot> {
  console.log(`[HELPER] Capturing quotation values...`);

  const snapshot: QuotationSnapshot = {
    toAmount: '',
    networkFeeSponsored: '',
    slippageValue: '',
    priceImpact: '',
    minimumReceived: '',
    capturedAt: new Date().toISOString(),
  };

  try {
    // 1. Capture to-amount
    const toAmountElement = '[data-testid="to-amount"]';
      try {
        const toAmountEl = await driver.findElement(toAmountElement);
        snapshot.toAmount = await toAmountEl.getText();
        console.log(`  [✓] to-amount: ${snapshot.toAmount}`);
      } catch (e) {
        console.warn(`  [⚠] to-amount not found`);
      }

    // 2. Capture network-fees-sponsored
    const feesElement = '[data-testid="network-fees-sponsored"]';
      try {
        const feesEl = await driver.findElement(feesElement);
        snapshot.networkFeeSponsored = await feesEl.getText();
        console.log(
          `  [✓] network-fees-sponsored: ${snapshot.networkFeeSponsored}`,
        );
      } catch (e) {
        console.warn(`  [⚠] network-fees-sponsored not found`);
      }

    // 3. Capture slippage value (XPath: //*[@data-testid="slippage-edit-button"]/../p)
    const slippageXPath = '//*[@data-testid="slippage-edit-button"]/../p';
    try {
        const slippageEl = await driver.findElement(slippageXPath);
        snapshot.slippageValue = await slippageEl.getText();
        console.log(`  [✓] slippage-value: ${snapshot.slippageValue}`);
    } catch (e) {
      console.warn(`  [⚠] slippage-value not found at XPath`);
    }

    // 4. Capture price impact (XPath: //*[text()='Price impact']/../../div[2]/p)
    const priceImpactXPath = `//*[text()='Price impact']/../../div[2]/p`;
    try {
        const priceEl = await driver.findElement(priceImpactXPath);
        snapshot.priceImpact = await priceEl.getText();
        console.log(`  [✓] price-impact: ${snapshot.priceImpact}`);
    } catch (e) {
      console.warn(`  [⚠] price-impact not found at XPath`);
    }

    // 5. Capture minimum-received
    const minimumElement = '[data-testid="minimum-received"]';
      try {
        const minimumEl = await driver.findElement(minimumElement);
        snapshot.minimumReceived = await minimumEl.getText();
        console.log(`  [✓] minimum-received: ${snapshot.minimumReceived}`);
      } catch (e) {
        console.warn(`  [⚠] minimum-received not found`);
      }
  } catch (error) {
    console.error(`[ERROR] Failed to capture quotation values:`, error);
    throw error;
  }

  console.log(`[HELPER] Quotation snapshot captured at ${snapshot.capturedAt}`);
  return snapshot;
}

/**
 * Switch tokens and capture updated quotation values
 *
 * Steps:
 * 1. Click switch-tokens button
 * 2. Wait for swap form to update
 * 3. Capture updated quotation values
 *
 * @param driver - Playwright Driver instance
 * @returns Promise resolving to updated QuotationSnapshot
 */
export async function switchTokensAndCapture(
  driver: Driver,
): Promise<QuotationSnapshot> {
  console.log(`[HELPER] Switching tokens...`);

  // Click switch-tokens button
  const switchButton = '[data-testid="switch-tokens"]';
  await driver.waitForSelector(switchButton);
  await driver.clickElement(switchButton);
  await driver.delay(PROD_DELAYS.API_RESPONSE);

  console.log(`[HELPER] Tokens switched, capturing new quotation values...`);

  // Capture updated values
  return captureQuotationValues(driver);
}

/**
 * Navigate back to previous page (home/token details)
 *
 * Clicks the back button and waits for navigation
 * @param driver - Playwright Driver instance
 */
export async function navigateBack(driver: Driver): Promise<void> {
  console.log(`[HELPER] Navigating back...`);
  const backButton = '[aria-label="Back"]';
  const backExists = await driver.findElement(backButton);
  if (backExists) {
    await driver.clickElement(backButton);
    await driver.delay(PROD_DELAYS.API_RESPONSE);
    console.log(`[HELPER] Back navigation completed`);
  } else {
    console.warn(`[WARN] Back button not found`);
  }
}

/**
 * Generate a comprehensive JSON report of test results
 *
 * Creates a JSON file with all quotation test results and metadata
 * @param testResults - Array of accumulated test results
 * @param networkName - Name of the network tested
 * @param chainId - Chain ID of the network
 * @param tokenlistUrl - URL of the tokenlist used
 * @param nativeTokenSymbol - Native token symbol
 * @returns Promise resolving to the file path of generated report
 */
export async function generateQuotationReport(
  testResults: QuotationTestResult[],
  networkName: string,
  chainId: number,
  tokenlistUrl: string,
  nativeTokenSymbol: string,
): Promise<string> {
  const fs = await import('fs').then((m) => m.promises);
  const path = await import('path').then((m) => m);

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportName = `swap-quotations-${networkName}-${timestamp}.json`;
  const reportPath = path.join(
    process.cwd(),
    'test-artifacts',
    reportName,
  );

  // Ensure test-artifacts directory exists
  const artifactDir = path.dirname(reportPath);
  try {
    await fs.mkdir(artifactDir, { recursive: true });
  } catch (e) {
    // Directory might already exist
  }

  // Calculate statistics
  const passedCount = testResults.filter((r) => r.status === 'passed').length;
  const failedCount = testResults.filter((r) => r.status === 'failed').length;

  const consolidatedResults: ConsolidatedTestResults = {
    networkName,
    chainId,
    tokenlistUrl,
    nativeTokenSymbol,
    timestamp: new Date().toISOString(),
    tokensImported: TOKENS_TO_IMPORT,
    totalTestCases: testResults.length,
    passedTestCases: passedCount,
    failedTestCases: failedCount,
    testResults,
  };

  // Write JSON report
  await fs.writeFile(
    reportPath,
    JSON.stringify(consolidatedResults, null, 2),
    'utf-8',
  );

  console.log(`[REPORT] Generated quotation report: ${reportPath}`);

  // Also log summary to console
  console.log(`\n${'='.repeat(80)}`);
  console.log(`SWAP QUOTATION TEST REPORT - ${networkName}`);
  console.log(`${'='.repeat(80)}`);
  console.log(`Network: ${networkName} (Chain ID: ${chainId})`);
  console.log(`Native Token: ${nativeTokenSymbol}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`\nTest Results Summary:`);
  console.log(`  Total Test Cases: ${testResults.length}`);
  console.log(`  ✅ Passed: ${passedCount}`);
  console.log(`  ❌ Failed: ${failedCount}`);
  console.log(`\nDetailed Results:`);

  testResults.forEach((result, index) => {
    const status = result.status === 'passed' ? '✅' : '❌';
    console.log(`  ${index + 1}. ${status} ${result.tokenPair}`);
    if (result.error) {
      console.log(`     Error: ${result.error}`);
    } else {
      console.log(
        `     Before Switch - ToAmount: ${result.quotations.beforeSwitch.toAmount}`,
      );
      console.log(
        `     After Switch  - ToAmount: ${result.quotations.afterSwitch.toAmount}`,
      );
    }
  });

  console.log(`\nReport saved to: ${reportPath}`);
  console.log(`${'='.repeat(80)}\n`);

  return reportPath;
}

/**
 * Generate all token-pair combinations from a list of tokens
 *
 * For N tokens (including native token), generates C(N, 2) pairs
 * Example with 3 tokens (Native, T1, T2):
 * - Native → T1
 * - Native → T2
 * - T1 → T2
 *
 * @param importedTokens - Array of imported tokens (not including native)
 * @param nativeTokenSymbol - Symbol of native token
 * @returns Array of token pair combinations
 */
export function generateTokenPairs(
  importedTokens: Token[],
  nativeTokenSymbol: string,
): Array<{ source: Token | 'native'; destination: Token; label: string }> {
  const pairs: Array<{
    source: Token | 'native';
    destination: Token;
    label: string;
  }> = [];

  // Native → each imported token
  importedTokens.forEach((token) => {
    pairs.push({
      source: 'native',
      destination: token,
      label: `${nativeTokenSymbol} → ${token.symbol}`,
    });
  });

  // Imported token combinations without reverse duplication (T1→T2, T1→T3, T2→T3)
  for (let sourceIndex = 0; sourceIndex < importedTokens.length; sourceIndex++) {
    for (
      let destinationIndex = sourceIndex + 1;
      destinationIndex < importedTokens.length;
      destinationIndex++
    ) {
      const sourceToken = importedTokens[sourceIndex];
      const destinationToken = importedTokens[destinationIndex];
      pairs.push({
        source: sourceToken,
        destination: destinationToken,
        label: `${sourceToken.symbol} → ${destinationToken.symbol}`,
      });
    }
  }

  console.log(`[HELPER] Generated ${pairs.length} token pairs for testing`);
  pairs.forEach((pair) => {
    console.log(`  - ${pair.label}`);
  });

  return pairs;
}
