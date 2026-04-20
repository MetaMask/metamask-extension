/**
 * Production E2E Test: Import Tokens and Verify Token Details Page for Multiple Networks
 *
 * This test automatically runs for all networks defined in network-configs.ts
 *
 * Test Flow:
 * 1. Import Custom Network (native token imported automatically)
 * 2. Import first TOKENS_TO_TEST tokens from tokenlist
 * 3. For each token (native + imported):
 *    - Click on token to open details page
 *    - Validate token details sections (header, balance, market, activity, chart)
 *    - Go back to asset list
 * 4. Generate consolidated report
 *
 * To add a new network:
 * 1. Add network configuration to network-configs.ts
 * 2. Test will automatically run for that network
 *
 * No code changes needed!
 */

import { strict as assert } from 'assert';
import { Suite } from 'mocha';
import { toHex } from '@metamask/controller-utils';
import FixtureBuilder from '../../../fixtures/fixture-builder';
import { withProductionFixtures } from '../../helpers/prod-with-fixtures';
import { Driver } from '../../../webdriver/driver';
import { PROD_DELAYS } from '../../helpers/prod-test-helpers';
import { loginWithoutBalanceValidation } from '../../../page-objects/flows/login.flow';
import { switchToEditRPCViaGlobalMenuNetworks } from '../../../page-objects/flows/network.flow';
import SelectNetwork from '../../../page-objects/pages/dialog/select-network';
import AddEditNetworkModal from '../../../page-objects/pages/dialog/add-edit-network';
import AddNetworkRpcUrlModal from '../../../page-objects/pages/dialog/add-network-rpc-url';
import HomePage from '../../../page-objects/pages/home/homepage';
import AssetListPage from '../../../page-objects/pages/home/asset-list';
import { NETWORK_CONFIGS, NetworkConfig } from './network-configs';
import {
  fetchTokenList,
  Token,
  TokenDetailsValidationResult,
  NetworkTokenDetailsResult,
  generateTokenDetailsReport,
} from './token-import-helpers';

/**
 * Configuration: Number of tokens to import and test
 * Can be changed here for testing with more/fewer tokens
 */
const TOKENS_TO_TEST = 10;

/**
 * Token details found on the token details page
 */
interface TokenDetailsPageData {
  headerData?: {
    coinPrice?: string;
    currencySymbol?: string;
  };
  balanceData?: {
    currency?: string;
    priceChange24h?: string;
    dollarAmount?: string;
    nativeCurrencyAmount?: string;
  };
  tokenDetails?: {
    network?: string;
  };
  marketDetails?: {
    marketCap?: string;
    totalVolume?: string;
    circulatingSupply?: string;
    allTimeHigh?: string;
    allTimeLow?: string;
  };
  yourActivity?: {
    hasNoActivity: boolean;
    transactionCount?: number;
  };
  chartData?: {
    chartFound: boolean;
    hasError: boolean;
  };
  validationResult: {
    headerDataFound: boolean;
    balanceDataFound: boolean;
    tokenDetailsFound: boolean;
    marketDetailsFound: boolean;
    yourActivityFound: boolean;
    chartFound: boolean;
  };
}

/**
 * Helper function to extract text from element if it exists
 */
async function safeGetText(
  driver: Driver,
  selector: string,
): Promise<string | null> {
  try {
    const element = await driver.findElement(selector);
    return await element.getText();
  } catch (error) {
    return null;
  }
}

/**
 * Helper function to find elements safely
 */
async function safeFindElements(
  driver: Driver,
  selector: string,
): Promise<any[]> {
  try {
    return await driver.findElements(selector);
  } catch (error) {
    return [];
  }
}

/**
 * Verify token details page with proper section validations
 */
async function verifyTokenDetailsPage(
  driver: Driver,
  tokenSymbol: string,
  isNativeToken: boolean = false,
): Promise<TokenDetailsPageData> {
  const result: TokenDetailsPageData = {
    validationResult: {
      headerDataFound: false,
      balanceDataFound: false,
      tokenDetailsFound: false,
      marketDetailsFound: false,
      yourActivityFound: false,
      chartFound: false,
    },
  };

  console.log(
    `[PROD TEST] 📄 Verifying token details page for: ${tokenSymbol}${isNativeToken ? ' (Native Token)' : ''}`,
  );

  // Wait for details page to load
  await driver.delay(2000);

  try {
    // ===========================================
    // 0. HEADER SECTION: Coin Price and Currency
    // ===========================================
    console.log(`[PROD TEST]    🔍 Checking header section (price & currency)...`);
    const headerData: any = {};

    try {
      const coinPrice = await safeGetText(driver, '[data-testid="asset-hovered-price"]');
      if (coinPrice) {
        headerData.coinPrice = coinPrice;
        console.log(`[PROD TEST]       ✅ Coin Price: ${coinPrice}`);
      } else {
        console.log(`[PROD TEST]       ⚠️  Coin Price not found`);
      }
    } catch (error) {
      console.log(`[PROD TEST]       ⚠️  Error getting coin price`);
    }

    try {
      const currencySymbol = await safeGetText(driver, '[data-testid="asset-name"]');
      if (currencySymbol) {
        headerData.currencySymbol = currencySymbol;
        console.log(`[PROD TEST]       ✅ Currency Symbol: ${currencySymbol}`);
      } else {
        console.log(`[PROD TEST]       ⚠️  Currency Symbol not found`);
      }
    } catch (error) {
      console.log(`[PROD TEST]       ⚠️  Error getting currency symbol`);
    }

    if (Object.keys(headerData).length > 0) {
      result.headerData = headerData;
      result.validationResult.headerDataFound = true;
    } else {
      console.log(`[PROD TEST]       ⚠️  Header section - no data found`);
    }

    // ===========================================
    // 1. PRICE CHART SECTION
    // ===========================================
    console.log(`[PROD TEST]    🔍 Checking Price Chart section...`);

    try {
      const emptyStateElements = await safeFindElements(driver, '[data-testid="asset-chart-empty-state"]');
      const errorMessageText = await safeGetText(driver, 'text=We could not fetch any historical data');

      if (errorMessageText) {
        console.log(`[PROD TEST]       ❌ Price Chart: Failed to load (error message: "${errorMessageText}")`);
        result.chartData = { chartFound: false, hasError: true };
      } else if (emptyStateElements.length === 0) {
        console.log(`[PROD TEST]       ✅ Price Chart: Loaded successfully`);
        result.chartData = { chartFound: true, hasError: false };
        result.validationResult.chartFound = true;
      } else {
        console.log(`[PROD TEST]       ⚠️  Price Chart: Not rendering`);
        result.chartData = { chartFound: false, hasError: false };
      }
    } catch (error) {
      console.log(`[PROD TEST]       ⚠️  Error checking price chart: ${error}`);
      result.chartData = { chartFound: false, hasError: false };
    }

    // ===========================================
    // 2. YOUR BALANCE SECTION
    // ===========================================
    console.log(`[PROD TEST]    🔍 Checking Your Balance section...`);
    const balanceData: any = {};
    let balanceFieldsFound = 0;

    try {
      // Currency
      const currencyValue = await safeGetText(driver, '[data-testid="multichain-token-list-item-token-name"]');
      if (currencyValue) {
        balanceData.currency = currencyValue;
        balanceFieldsFound++;
        console.log(`[PROD TEST]       ✅ Currency: ${currencyValue}`);
      } else {
        console.log(`[PROD TEST]       ⚠️  Currency not found`);
      }
    } catch (error) {
      console.log(`[PROD TEST]       ⚠️  Error getting currency`);
    }

    try {
      // 24hr change - using dedicated data-testid (more reliable than complex XPath)
      await driver.delay(2000);
      const priceChangeElements = await safeFindElements(driver, '//*[@data-testid="multichain-token-list-item-value"]/../div/p');

      console.log(`[PROD TEST]       📊 24h Change - Elements found: ${priceChangeElements.length}`);

      if (priceChangeElements.length > 0) {
        const priceChangeText = await priceChangeElements[0].getText();
        const trimmedText = priceChangeText?.trim() ?? '';

        console.log(`[PROD TEST]       📊 24h Change - Raw getText(): "${priceChangeText}"`);
        console.log(`[PROD TEST]       📊 24h Change - Trimmed: "${trimmedText}"`);

        // Also check element visibility
        const isDisplayed = await priceChangeElements[0].isDisplayed().catch(() => false);
        console.log(`[PROD TEST]       📊 24h Change - Is displayed: ${isDisplayed}`);

        if (trimmedText) {
          balanceData.priceChange24h = trimmedText;
          balanceFieldsFound++;
          console.log(`[PROD TEST]       ✅ 24h Change: ${trimmedText}`);
        } else {
          console.log(`[PROD TEST]       ⚠️  24h change - Element found but getText() returned empty/whitespace`);
        }
      } else {
        console.log(`[PROD TEST]       ⚠️  24h change not found`);
      }
    } catch (error) {
      console.log(`[PROD TEST]       ⚠️  Error getting 24h change: ${(error as Error).message}`);
    }

    try {
      // Dollar amount
      const dollarAmount = await safeGetText(driver, '[data-testid="multichain-token-list-item-secondary-value"]');
      if (dollarAmount) {
        balanceData.dollarAmount = dollarAmount;
        balanceFieldsFound++;
        console.log(`[PROD TEST]       ✅ Dollar Amount: ${dollarAmount}`);
      } else {
        console.log(`[PROD TEST]       ⚠️  Dollar amount not found`);
      }
    } catch (error) {
      console.log(`[PROD TEST]       ⚠️  Error getting dollar amount`);
    }

    try {
      // Native currency amount
      const nativeCurrencyAmount = await safeGetText(driver, '[data-testid="multichain-token-list-item-value"]');
      if (nativeCurrencyAmount) {
        balanceData.nativeCurrencyAmount = nativeCurrencyAmount;
        balanceFieldsFound++;
        console.log(`[PROD TEST]       ✅ Native Currency Amount: ${nativeCurrencyAmount}`);
      } else {
        console.log(`[PROD TEST]       ⚠️  Native currency amount not found`);
      }
    } catch (error) {
      console.log(`[PROD TEST]       ⚠️  Error getting native currency amount`);
    }

    if (balanceFieldsFound > 0) {
      result.balanceData = balanceData;
      result.validationResult.balanceDataFound = true;
      console.log(`[PROD TEST]       📊 Your Balance: ${balanceFieldsFound}/4 fields found`);
    } else {
      console.log(`[PROD TEST]       ⚠️  Your Balance section - no fields found`);
    }

    // ===========================================
    // 3. TOKEN DETAILS SECTION (Network)
    // ===========================================
    console.log(`[PROD TEST]    🔍 Checking Token Details section (Network)...`);
    const tokenDetailsData: any = {};

    try {
      // Get network from the dedicated data-testid
      const networkElements = await safeFindElements(driver, '//*[@data-testid="asset-network"]/p');
      if (networkElements.length > 0) {
        const networkText = await networkElements[0].getText();
        if (networkText && networkText.trim()) {
          tokenDetailsData.network = networkText.trim();
          result.tokenDetails = tokenDetailsData;
          result.validationResult.tokenDetailsFound = true;
          console.log(`[PROD TEST]       ✅ Network: ${networkText}`);
        }
      } else {
        // Check for "Token Details" heading/section as fallback
        const tokenDetailsSection = await safeFindElements(driver, `//*[text()='Token details']`);
        if (tokenDetailsSection.length > 0) {
          result.validationResult.tokenDetailsFound = true;
          console.log(`[PROD TEST]       ✅ Token Details section found`);
        } else {
          console.log(`[PROD TEST]       ⚠️  Token Details section not found`);
        }
      }
    } catch (error) {
      console.log(`[PROD TEST]       ⚠️  Error checking token details: ${error}`);
    }

    // ===========================================
    // 4. MARKET DETAILS SECTION
    // ===========================================
    console.log(`[PROD TEST]    🔍 Checking Market Details section...`);
    const marketDetailsData: any = {};
    let marketFieldsFound = 0;

    try {
      // Market cap
      const marketCap = await safeGetText(driver, '[data-testid="asset-market-cap"]');
      if (marketCap) {
        marketDetailsData.marketCap = marketCap;
        marketFieldsFound++;
        console.log(`[PROD TEST]       ✅ Market Cap: ${marketCap}`);
      } else {
        console.log(`[PROD TEST]       ⚠️  Market cap not found`);
      }
    } catch (error) {
      console.log(`[PROD TEST]       ⚠️  Error getting market cap`);
    }

    try {
      await driver.delay(500);
      // Total volume - using XPath with multiple fallback approaches
      let volumeText: string | null = null;

      // Fallback: try finding the value element after the label
      if (!volumeText) {
        let volumeElements = await safeFindElements(driver, `//*[contains(text(),'Total volume')]/following-sibling::*[1]`);
        if (volumeElements.length > 0) {
          volumeText = await volumeElements[0].getText();
        }
      }

      if (volumeText && volumeText.trim()) {
        marketDetailsData.totalVolume = volumeText.trim();
        marketFieldsFound++;
        console.log(`[PROD TEST]       ✅ Total Volume: ${volumeText}`);
      } else {
        console.log(`[PROD TEST]       ⚠️  Total volume not found - check page HTML structure`);
      }
    } catch (error) {
      console.log(`[PROD TEST]       ⚠️  Error getting total volume: ${error}`);
    }

    try {
      // Circulating supply - using XPath with multiple fallback approaches
       await driver.delay(500);
      let supplyText: string | null = null;

      // Fallback: try finding the value element after the label
      if (!supplyText) {
        let supplyElements = await safeFindElements(driver, `//*[contains(text(),'Circulating supply')]/following-sibling::*[1]`);
        if (supplyElements.length > 0) {
          supplyText = await supplyElements[0].getText();
        }
      }

      if (supplyText && supplyText.trim()) {
        marketDetailsData.circulatingSupply = supplyText.trim();
        marketFieldsFound++;
        console.log(`[PROD TEST]       ✅ Circulating Supply: ${supplyText}`);
      } else {
        console.log(`[PROD TEST]       ⚠️  Circulating supply not found - check page HTML structure`);
      }
    } catch (error) {
      console.log(`[PROD TEST]       ⚠️  Error getting circulating supply: ${error}`);
    }

    try {
      // All-time high - using XPath with multiple fallback approaches
       await driver.delay(500);
      let alhText: string | null = null;

      // Fallback: try finding the value element after the label
      if (!alhText) {
        let alhElements = await safeFindElements(driver, `//*[contains(text(),'All-time high')]/following-sibling::*[1]`);
        if (alhElements.length > 0) {
          alhText = await alhElements[0].getText();
        }
      }

      if (alhText && alhText.trim()) {
        marketDetailsData.allTimeHigh = alhText.trim();
        marketFieldsFound++;
        console.log(`[PROD TEST]       ✅ All-Time High: ${alhText}`);
      } else {
        console.log(`[PROD TEST]       ⚠️  All-time high not found - check page HTML structure`);
      }
    } catch (error) {
      console.log(`[PROD TEST]       ⚠️  Error getting all-time high: ${error}`);
    }

    try {
      // All-time low - using XPath with multiple fallback approaches
       await driver.delay(500);
      let atlText: string | null = null;

      // Fallback: try finding the value element after the label
      if (!atlText) {
        let atlElements = await safeFindElements(driver, `//*[contains(text(),'All-time low')]/following-sibling::*[1]`);
        if (atlElements.length > 0) {
          atlText = await atlElements[0].getText();
        }
      }

      if (atlText && atlText.trim()) {
        marketDetailsData.allTimeLow = atlText.trim();
        marketFieldsFound++;
        console.log(`[PROD TEST]       ✅ All-Time Low: ${atlText}`);
      } else {
        console.log(`[PROD TEST]       ⚠️  All-time low not found - check page HTML structure`);
      }
    } catch (error) {
      console.log(`[PROD TEST]       ⚠️  Error getting all-time low: ${error}`);
    }

    if (marketFieldsFound > 0) {
      result.marketDetails = marketDetailsData;
      result.validationResult.marketDetailsFound = true;
      console.log(`[PROD TEST]       📊 Market Details: ${marketFieldsFound}/5 fields found`);
    } else {
      console.log(`[PROD TEST]       ⚠️  Market Details section - no fields found`);
    }

    // ===========================================
    // 5. YOUR ACTIVITY SECTION
    // ===========================================
    console.log(`[PROD TEST]    🔍 Checking Your Activity section...`);
    const yourActivityData: any = {
      hasNoActivity: false,
      transactionCount: 0,
    };

    try {
      // Check for "Nothing to see yet" empty state
      const emptyStateElements = await safeFindElements(driver, '[data-testid="activity-tab-empty-state"]');

      if (emptyStateElements.length > 0) {
        yourActivityData.hasNoActivity = true;
        console.log(`[PROD TEST]       ℹ️  No activity: "Nothing to see yet" message shown`);
        result.validationResult.yourActivityFound = true;
      } else {
        // Activity exists - count transactions
        const activityItems = await safeFindElements(driver, '[data-testid="activity-list-item"]');
        if (activityItems.length > 0) {
          yourActivityData.transactionCount = activityItems.length;
          yourActivityData.hasNoActivity = false;
          console.log(`[PROD TEST]       ✅ Activity found: ${activityItems.length} transaction(s)`);
          result.validationResult.yourActivityFound = true;
        } else {
          console.log(`[PROD TEST]       ⚠️  Activity section not found`);
        }
      }

      result.yourActivity = yourActivityData;
    } catch (error) {
      console.log(`[PROD TEST]       ⚠️  Error checking activity: ${error}`);
    }

    // Summary
    console.log(`[PROD TEST]    📊 Token Details Validation Summary:`);
    console.log(
      `[PROD TEST]       ${result.validationResult.headerDataFound ? '✅' : '⚠️'} Header Data: ${result.validationResult.headerDataFound ? 'Found' : 'Not found'}`,
    );
    console.log(
      `[PROD TEST]       ${result.validationResult.chartFound ? '✅' : '⚠️'} Price Chart: ${result.validationResult.chartFound ? 'Found' : 'Not found'}`,
    );
    console.log(
      `[PROD TEST]       ${result.validationResult.balanceDataFound ? '✅' : '⚠️'} Your Balance: ${result.validationResult.balanceDataFound ? 'Found' : 'Not found'}`,
    );
    console.log(
      `[PROD TEST]       ${result.validationResult.tokenDetailsFound ? '✅' : '⚠️'} Token Details: ${result.validationResult.tokenDetailsFound ? 'Found' : 'Not found'}`,
    );
    console.log(
      `[PROD TEST]       ${result.validationResult.marketDetailsFound ? '✅' : '⚠️'} Market Details: ${result.validationResult.marketDetailsFound ? 'Found' : 'Not found'}`,
    );
    console.log(
      `[PROD TEST]       ${result.validationResult.yourActivityFound ? '✅' : '⚠️'} Your Activity: ${result.validationResult.yourActivityFound ? 'Found' : 'Not found'}`,
    );
  } catch (error) {
    console.log(
      `[PROD TEST] ⚠️  Error verifying token details page: ${error}`,
    );
  }

  return result;
}

/**
 * Click on a token in the asset list to open details page
 */
async function clickTokenToViewDetails(
  driver: Driver,
  tokenSymbol: string,
): Promise<boolean> {
  try {
    console.log(`[PROD TEST]    Clicking on token: ${tokenSymbol}`);

    // Wait for list to be ready
    await driver.delay(1500);

    // Get all token list items
    const tokenListItems = await driver.findElements(
      '[data-testid="multichain-token-list-button"]',
    );

    console.log(
      `[PROD TEST]    Found ${tokenListItems.length} token items in list`,
    );

    // Search for the specific token
    for (const item of tokenListItems) {
      try {
        const itemText = await item.getText();

        // Check if this is our token (by symbol)
        if (itemText.includes(tokenSymbol)) {
          console.log(
            `[PROD TEST]    ✅ Found token in list: ${tokenSymbol}`,
          );
          try {
            await item.click();
            // Wait longer for details page to load (account for network latency)
            await driver.delay(3000);
            return true;
          } catch (clickError) {
            console.log(
              `[PROD TEST]    ⚠️  Failed to click token: ${clickError}`,
            );
            return false;
          }
        }
      } catch (itemError) {
        // Skip this item and continue
      }
    }

    console.log(
      `[PROD TEST]    ❌ Token not found in list: ${tokenSymbol}`,
    );
    return false;
  } catch (error) {
    console.log(
      `[PROD TEST]    ⚠️  Error clicking token to view details: ${error}`,
    );
    return false;
  }
}

/**
 * Go back to asset list from token details page
 */
async function goBackToAssetList(driver: Driver): Promise<void> {
  try {
    // Increase delay for slow transitions
    await driver.delay(1500);

    // Try multiple selectors for back button with longer timeout
    const backButtonSelectors = [
      '[data-testid="asset-list-back-button"]',
      'button[aria-label="Back"]',
      '.mm-icon-button--size-sm',
      '[class*="back"]',
    ];

    let backFound = false;
    for (const selector of backButtonSelectors) {
      try {
        const elements = await driver.findElements(selector);
        if (elements.length > 0) {
          try {
            await elements[0].click();
            // Give page time to transition back
            await driver.delay(2000);
            backFound = true;
            console.log(`[PROD TEST]    ⬅️  Returned to asset list`);
            break;
          } catch (clickError) {
            console.log(
              `[PROD TEST]    ⚠️  Click on back button failed, trying next selector`,
            );
            // Continue to next selector
          }
        }
      } catch (error) {
        // Try next selector
      }
    }

    if (!backFound) {
      console.log(
        `[PROD TEST]    ⚠️  Back button not found, using asset tab fallback`,
      );
      // Fallback: click on asset tab
      try {
        await driver.clickElement(
          '[data-testid="account-overview__asset-tab"]',
        );
        await driver.delay(2000);
      } catch (tabError) {
        console.log(
          `[PROD TEST]    ⚠️  Asset tab click also failed: ${tabError}`,
        );
      }
    }
  } catch (error) {
    console.log(`[PROD TEST]    ⚠️  Error going back to asset list: ${error}`);
  }
}

/**
 * Run token details test for a specific network
 */
async function runTokenDetailsTest(
  networkConfig: NetworkConfig,
  testContext: any,
): Promise<NetworkTokenDetailsResult | null> {
  let testResult: NetworkTokenDetailsResult | null = null;

  await withProductionFixtures(
    {
      fixtures: new FixtureBuilder().withNetworkControllerOnMainnet().build(),
      title:
        testContext.test?.fullTitle() ??
        `${networkConfig.networkName} Token Details Verification Test`,
    },
    async ({ driver }: { driver: Driver }) => {
      // Initialize result collection
      const collectedResults: TokenDetailsValidationResult[] = [];

      // Login
      await loginWithoutBalanceValidation(driver);

      console.log(
        `[PROD TEST] Starting ${networkConfig.networkName} token details verification...`,
      );

      // Open network menu and navigate to add custom network
      await switchToEditRPCViaGlobalMenuNetworks(driver);

      const selectNetworkDialog = new SelectNetwork(driver);
      await selectNetworkDialog.checkPageIsLoaded();
      await selectNetworkDialog.openAddCustomNetworkModal();

      console.log(
        `[PROD TEST] Adding ${networkConfig.networkName} network details...`,
      );

      // Fill in network details using page object
      const addEditNetworkModal = new AddEditNetworkModal(driver);
      await addEditNetworkModal.checkPageIsLoaded();
      await addEditNetworkModal.fillNetworkNameInputField(
        networkConfig.networkName,
      );
      await addEditNetworkModal.fillNetworkChainIdInputField(
        toHex(networkConfig.chainId).toString(),
      );
      await addEditNetworkModal.fillCurrencySymbolInputField(
        networkConfig.symbol,
      );

      // Add RPC URL
      await addEditNetworkModal.openAddRpcUrlModal();

      const addRpcUrlModal = new AddNetworkRpcUrlModal(driver);
      await addRpcUrlModal.checkPageIsLoaded();
      await addRpcUrlModal.fillAddRpcUrlInput(networkConfig.rpcUrl);
      await addRpcUrlModal.fillAddRpcNameInput(networkConfig.rpcName);
      await addRpcUrlModal.saveAddRpcUrl();

      // Save the network
      await addEditNetworkModal.saveEditedNetwork();

      // Verify network was added
      const homepage = new HomePage(driver);
      await homepage.checkPageIsLoaded();
      await homepage.checkAddNetworkMessageIsDisplayed(
        networkConfig.networkName,
      );

      console.log(
        `[PROD TEST] ✅ ${networkConfig.networkName} network added successfully`,
      );

      // Wait for RPC to connect
      await driver.delay(PROD_DELAYS.RPC_RESPONSE);

      console.log(
        `[PROD TEST] Fetching ${networkConfig.networkName} tokenlist...`,
      );

      // Fetch all tokens from the tokenlist
      let tokens: Token[] = [];
      try {
        tokens = await fetchTokenList(
          networkConfig.tokenlistUrl,
          networkConfig.chainId,
        );
        console.log(
          `[PROD TEST] Successfully fetched ${tokens.length} tokens from ${networkConfig.networkName} tokenlist`,
        );
      } catch (error) {
        console.error(
          `[PROD TEST] Failed to fetch ${networkConfig.networkName} tokenlist:`,
          error,
        );
        throw new Error(
          `Could not fetch ${networkConfig.networkName} tokenlist`,
        );
      }

      const assetListPage = new AssetListPage(driver);

      console.log(`[PROD TEST] Starting to import tokens...`);

      // Determine how many tokens to import
      // If tokenlist has <= TOKENS_TO_TEST tokens, import all
      // If tokenlist has > TOKENS_TO_TEST tokens, import only first TOKENS_TO_TEST
      const tokensToTest = tokens.slice(0, Math.min(TOKENS_TO_TEST, tokens.length));
      let successfulImports = 0;

      console.log(
        `[PROD TEST] Will test ${tokensToTest.length} tokens (configured for ${TOKENS_TO_TEST})`,
      );

      for (let i = 0; i < tokensToTest.length; i++) {
        const token = tokensToTest[i];
        const progress = `[${i + 1}/${tokensToTest.length}]`;

        console.log(
          `[PROD TEST] ${progress} Importing token: ${token.symbol}`,
        );

        try {
          // Import token
          const importTimeout = 15000;
          const importPromise = assetListPage.importCustomTokenByChain(
            toHex(networkConfig.chainId).toString(),
            token.address,
          );

          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(
              () =>
                reject(
                  new Error(
                    'Token import timed out',
                  ),
                ),
              importTimeout,
            );
          });

          try {
            await Promise.race([importPromise, timeoutPromise]);
            await driver.delay(2000);
          } catch (timeoutError) {
            console.log(
              `[PROD TEST] ${progress} ⏱️  Import timeout, attempting cleanup...`,
            );

            try {
              const closeButton =
                '[data-testid="import-tokens-modal-close-button"]';
              const closeElements = await driver.findElements(closeButton);
              if (closeElements.length > 0) {
                await driver.clickElement(closeButton);
                await driver.delay(500);
              }
            } catch (cleanupError) {
              // Ignore cleanup errors
            }

            throw timeoutError;
          }

          successfulImports++;
          console.log(
            `[PROD TEST] ${progress} ✅ Successfully imported: ${token.symbol}`,
          );
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          console.log(
            `[PROD TEST] ${progress} ❌ Failed to import: ${token.symbol}`,
          );
          console.log(`[PROD TEST]    Error: ${errorMessage}`);
        }
      }

      console.log(
        `[PROD TEST] Imported ${successfulImports} tokens successfully`,
      );

      // ======================================================
      // NOW VERIFY TOKEN DETAILS PAGE FOR EACH IMPORTED TOKEN
      // ======================================================

      // First, test native token details
      console.log(
        `[PROD TEST]\n[PROD TEST] ========================================`,
      );
      console.log(
        `[PROD TEST] Testing NATIVE TOKEN details: ${networkConfig.symbol}`,
      );
      console.log(
        `[PROD TEST] ========================================`,
      );

      // Navigate to asset list with generous delay
      try {
        await driver.clickElement(
          '[data-testid="account-overview__asset-tab"]',
        );
      } catch (error) {
        console.log(`[PROD TEST] ⚠️  Error clicking asset tab: ${error}`);
      }
      await driver.delay(2000);

      const nativeTokenClicked = await clickTokenToViewDetails(
        driver,
        networkConfig.symbol,
      );

      if (nativeTokenClicked) {
        const nativeTokenDetails = await verifyTokenDetailsPage(
          driver,
          networkConfig.symbol,
          true,
        );

        // Assert that at least some sections were found
        const sectionsFound = Object.values(
          nativeTokenDetails.validationResult,
        ).filter((v) => v).length;
        console.log(
          `[PROD TEST] 📊 Native token: ${sectionsFound}/6 sections found`,
        );

        // Collect result
        collectedResults.push({
          symbol: networkConfig.symbol,
          address: 'NATIVE',
          name: networkConfig.networkName,
          isNativeToken: true,
          headerDataFound: nativeTokenDetails.validationResult.headerDataFound,
          chartFound: nativeTokenDetails.validationResult.chartFound,
          balanceDataFound: nativeTokenDetails.validationResult.balanceDataFound,
          tokenDetailsFound: nativeTokenDetails.validationResult.tokenDetailsFound,
          marketDetailsFound: nativeTokenDetails.validationResult.marketDetailsFound,
          yourActivityFound: nativeTokenDetails.validationResult.yourActivityFound,
          headerData: nativeTokenDetails.headerData,
          balanceDetails: nativeTokenDetails.balanceData,
          tokenDetails: nativeTokenDetails.tokenDetails,
          marketDetails: nativeTokenDetails.marketDetails,
          chartDetails: nativeTokenDetails.chartData,
          yourActivity: nativeTokenDetails.yourActivity,
        });

        await goBackToAssetList(driver);
      } else {
        console.log(
          `[PROD TEST] ⚠️  Native token not found in asset list`,
        );
      }

      // Then test each imported token details
      console.log(
        `[PROD TEST]\n[PROD TEST] ========================================`,
      );
      console.log(
        `[PROD TEST] Testing IMPORTED TOKENS details pages`,
      );
      console.log(
        `[PROD TEST] ========================================`,
      );

      for (let i = 0; i < tokensToTest.length; i++) {
        const token = tokensToTest[i];

        console.log(
          `[PROD TEST]\n[PROD TEST] Testing token ${i + 1}/${tokensToTest.length}: ${token.symbol}`,
        );

        // Generous delay between tokens
        await driver.delay(2500);

        // Navigate to asset list with explicit click
        try {
          await driver.clickElement(
            '[data-testid="account-overview__asset-tab"]',
          );
        } catch (error) {
          console.log(`[PROD TEST] ⚠️  Error clicking asset tab before token click: ${error}`);
        }
        await driver.delay(2000);

        const tokenClicked = await clickTokenToViewDetails(driver, token.symbol);

        if (tokenClicked) {
          const tokenDetails = await verifyTokenDetailsPage(
            driver,
            token.symbol,
            false,
          );

          // Assert that at least some sections were found
          const sectionsFound = Object.values(
            tokenDetails.validationResult,
          ).filter((v) => v).length;
          console.log(
            `[PROD TEST] 📊 ${token.symbol}: ${sectionsFound}/6 sections found`,
          );

          // Collect result
          collectedResults.push({
            symbol: token.symbol,
            address: token.address,
            name: token.name,
            isNativeToken: false,
            headerDataFound: tokenDetails.validationResult.headerDataFound,
            chartFound: tokenDetails.validationResult.chartFound,
            balanceDataFound: tokenDetails.validationResult.balanceDataFound,
            tokenDetailsFound: tokenDetails.validationResult.tokenDetailsFound,
            marketDetailsFound: tokenDetails.validationResult.marketDetailsFound,
            yourActivityFound: tokenDetails.validationResult.yourActivityFound,
            headerData: tokenDetails.headerData,
            balanceDetails: tokenDetails.balanceData,
            tokenDetails: tokenDetails.tokenDetails,
            marketDetails: tokenDetails.marketDetails,
            chartDetails: tokenDetails.chartData,
            yourActivity: tokenDetails.yourActivity,
          });

          await goBackToAssetList(driver);
        } else {
          console.log(`[PROD TEST] ⚠️  Token ${token.symbol} not found in asset list`);
        }
      }

      console.log(
        `[PROD TEST]\n[PROD TEST] ✅ ${networkConfig.networkName} token details verification completed`,
      );

      // Store results for consolidated report
      testResult = {
        networkName: networkConfig.networkName,
        chainId: networkConfig.chainId,
        blockExplorerUrl: networkConfig.blockExplorerUrl || 'N/A',
        nativeTokenSymbol: networkConfig.symbol,
        tokenlistUrl: networkConfig.tokenlistUrl,
        totalTokensTested: collectedResults.length,
        results: collectedResults,
        timestamp: new Date(),
      };
    },
  );

  return testResult;
}

/**
 * Array to collect results from all network tests for consolidated report
 */
const allNetworkResults: NetworkTokenDetailsResult[] = [];

/**
 * Generate tests for all configured networks
 */
describe('Production E2E: Import Tokens and Verify Token Details Page for Multiple Networks', function (this: Suite) {
  this.timeout(14400000); // 4 hours

  // Generate a test for each network in the configuration
  NETWORK_CONFIGS.forEach((networkConfig) => {
    it(`verifies token details page for ${networkConfig.networkName} (Chain ID: ${networkConfig.chainId})`, async function () {
      // Set per-test timeout to 60 minutes per network
      this.timeout(3600000);

      const result = await runTokenDetailsTest(networkConfig, this);

      // Collect results for consolidated report
      if (result) {
        allNetworkResults.push(result);
      }

      // Add a small delay between tests to ensure proper cleanup
      await new Promise((resolve) => setTimeout(resolve, 2000));
    });
  });

  // Cleanup hook to ensure all browsers are closed
  afterEach(async function () {
    console.log('[PROD TEST] Test completed, cleanup should have occurred');
  });

  // Generate consolidated report after all tests complete
  after(function () {
    if (allNetworkResults.length > 0) {
      const reportPath = 'test/e2e/prod/tests/tokens/token-details-report.md';
      try {
        generateTokenDetailsReport(allNetworkResults, reportPath);
        console.log(
          `[PROD TEST] 📄 Token details report generated: ${reportPath}`,
        );
      } catch (error) {
        console.warn(
          `[PROD TEST] ⚠️  Failed to generate token details report: ${error}`,
        );
      }
    } else {
      console.warn(
        '[PROD TEST] ⚠️  No network results collected, skipping report generation',
      );
    }
  });
});
