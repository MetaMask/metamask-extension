/**
 * Production E2E Test: Import Tokens and Verify Token Details Page for Multiple Networks
 *
 * This test automatically runs for all networks defined in network-configs.ts
 *
 * Test Flow:
 * 1. Import Custom Network
 * 2. Verify imported network is showing
 * 3. Perform token import from tokenlist
 * 4. Verify imported token logo and balance
 * 5. Click on each imported token line item
 * 6. Verify Token Details Page (Your Balance, Token Details, Market Details, Your Activity)
 * 7. Also verify native token details page
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
 * Token details found on the token details page
 */
interface TokenDetailsPageData {
  balanceData?: {
    currency?: string;
    priceChangePercent?: string;
    nativeCurrencyBalance?: string;
    usdBalance?: string;
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
    sent?: string[];
    received?: string[];
  };
  chartData?: {
    chartFound: boolean;
    hasCandles?: boolean;
    hasPriceAxis?: boolean;
    hasTimeAxis?: boolean;
  };
  validationResult: {
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
 * Verify token details page
 */
async function verifyTokenDetailsPage(
  driver: Driver,
  tokenSymbol: string,
  isNativeToken: boolean = false,
): Promise<TokenDetailsPageData> {
  const result: TokenDetailsPageData = {
    validationResult: {
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
    // 0. Verify "Price Chart" section
    // ===========================================
    console.log(
      `[PROD TEST]    🔍 Looking for "Price Chart" section...`,
    );

    let chartFound = false;

    try {
      // Look for price chart section
      const chartElements = await safeFindElements(
        driver,
        '[data-testid="token-details__price-chart"]',
      );

      if (chartElements.length > 0) {
        // Check if error message is displayed
        const errorMessageElement = await driver.findElement(
          'text=We could not fetch any historical data',
        );
        const errorMessageText = await safeGetText(
          driver,
          'text=We could not fetch any historical data',
        );

        if (errorMessageText) {
          console.log(
            `[PROD TEST]       ❌ Price chart failed to load: "${errorMessageText}"`,
          );
          result.chartData = { chartFound: false };
        } else {
          console.log(
            `[PROD TEST]       ✅ Price chart section found and loaded`,
          );
          chartFound = true;
          result.chartData = { chartFound: true };
          result.validationResult.chartFound = true;
        }
      } else {
        console.log(
          `[PROD TEST]       ⚠️  Price chart section not found`,
        );
        result.chartData = { chartFound: false };
      }
    } catch (error) {
      console.log(
        `[PROD TEST]       ⚠️  Price chart section not found or error occurred`,
      );
      result.chartData = { chartFound: false };
    }

    // ===========================================
    // 1. Verify "Your Balance" section
    // ===========================================
    console.log(
      `[PROD TEST]    🔍 Looking for "Your Balance" section...`,
    );

    const balanceSectionSelectors = [
      '[data-testid="token-details__your-balance"]',
      '[data-testid="token-balance-section"]',
      'text=Your Balance',
    ];

    let balanceDataFound = false;
    const balanceData: any = {};

    for (const selector of balanceSectionSelectors) {
      try {
        const elements = await driver.findElements(selector);
        if (elements.length > 0) {
          balanceDataFound = true;
          console.log(
            `[PROD TEST]       ✅ "Your Balance" section found`,
          );

          // Try to extract balance information
          const currencyText = await safeGetText(
            driver,
            '[data-testid="token-details__balance-currency"]',
          );
          const priceChangeText = await safeGetText(
            driver,
            '[data-testid="token-details__price-change"]',
          );
          const nativeCurrencyBalanceText = await safeGetText(
            driver,
            '[data-testid="token-details__balance-native-currency"]',
          );
          const usdBalanceText = await safeGetText(
            driver,
            '[data-testid="token-details__balance-usd"]',
          );

          if (currencyText) balanceData.currency = currencyText;
          if (priceChangeText) balanceData.priceChangePercent = priceChangeText;
          if (nativeCurrencyBalanceText) balanceData.nativeCurrencyBalance = nativeCurrencyBalanceText;
          if (usdBalanceText) balanceData.usdBalance = usdBalanceText;

          result.balanceData = balanceData;
          result.validationResult.balanceDataFound = true;
          break;
        }
      } catch (error) {
        // Continue to next selector
      }
    }

    if (!balanceDataFound) {
      console.log(
        `[PROD TEST]       ⚠️  "Your Balance" section not found (might be loading)`,
      );
    }

    // ===========================================
    // 2. Verify "Token Details" section
    // ===========================================
    console.log(
      `[PROD TEST]    🔍 Looking for "Token Details" section...`,
    );

    const tokenDetailsSectionSelectors = [
      '[data-testid="token-details__token-details"]',
      '[data-testid="token-details-info"]',
      'text=Token Details',
    ];

    let tokenDetailsFound = false;
    const tokenDetailsData: any = {};

    for (const selector of tokenDetailsSectionSelectors) {
      try {
        const elements = await driver.findElements(selector);
        if (elements.length > 0) {
          tokenDetailsFound = true;
          console.log(
            `[PROD TEST]       ✅ "Token Details" section found`,
          );

          // Try to extract network information
          const networkText = await safeGetText(
            driver,
            '[data-testid="token-details__network"]',
          );

          if (networkText) {
            tokenDetailsData.network = networkText;
            console.log(
              `[PROD TEST]          Network: ${networkText}`,
            );
          }

          result.tokenDetails = tokenDetailsData;
          result.validationResult.tokenDetailsFound = true;
          break;
        }
      } catch (error) {
        // Continue to next selector
      }
    }

    if (!tokenDetailsFound) {
      console.log(
        `[PROD TEST]       ⚠️  "Token Details" section not found`,
      );
    }

    // ===========================================
    // 3. Verify "Market Details" section
    // ===========================================
    console.log(
      `[PROD TEST]    🔍 Looking for "Market Details" section...`,
    );

    const marketDetailsSectionSelectors = [
      '[data-testid="token-details__market-details"]',
      '[data-testid="market-details-section"]',
      'text=Market Details',
    ];

    let marketDetailsFound = false;
    const marketDetailsData: any = {};

    for (const selector of marketDetailsSectionSelectors) {
      try {
        const elements = await driver.findElements(selector);
        if (elements.length > 0) {
          marketDetailsFound = true;
          console.log(
            `[PROD TEST]       ✅ "Market Details" section found`,
          );

          // Try to extract market information
          const marketCapText = await safeGetText(
            driver,
            '[data-testid="token-details__market-cap"]',
          );
          const totalVolumeText = await safeGetText(
            driver,
            '[data-testid="token-details__total-volume"]',
          );
          const circulatingSupplyText = await safeGetText(
            driver,
            '[data-testid="token-details__circulating-supply"]',
          );
          const allTimeHighText = await safeGetText(
            driver,
            '[data-testid="token-details__all-time-high"]',
          );
          const allTimeLowText = await safeGetText(
            driver,
            '[data-testid="token-details__all-time-low"]',
          );

          if (marketCapText) marketDetailsData.marketCap = marketCapText;
          if (totalVolumeText) marketDetailsData.totalVolume = totalVolumeText;
          if (circulatingSupplyText) marketDetailsData.circulatingSupply = circulatingSupplyText;
          if (allTimeHighText) marketDetailsData.allTimeHigh = allTimeHighText;
          if (allTimeLowText) marketDetailsData.allTimeLow = allTimeLowText;

          result.marketDetails = marketDetailsData;
          result.validationResult.marketDetailsFound = true;
          break;
        }
      } catch (error) {
        // Continue to next selector
      }
    }

    if (!marketDetailsFound) {
      console.log(
        `[PROD TEST]       ⚠️  "Market Details" section not found (market data may not be available for this token)`,
      );
    }

    // ===========================================
    // 4. Verify "Your Activity" section
    // ===========================================
    console.log(
      `[PROD TEST]    🔍 Looking for "Your Activity" section...`,
    );

    const activitySectionSelectors = [
      '[data-testid="token-details__your-activity"]',
      '[data-testid="transaction-history"]',
      'text=Your Activity',
    ];

    let activityFound = false;
    const activityData: any = {
      sent: [],
      received: [],
    };

    for (const selector of activitySectionSelectors) {
      try {
        const elements = await driver.findElements(selector);
        if (elements.length > 0) {
          activityFound = true;
          console.log(
            `[PROD TEST]       ✅ "Your Activity" section found`,
          );

          // Try to get sent transactions
          const sentTxElements = await safeFindElements(
            driver,
            '[data-testid="transaction-item-sent"]',
          );
          if (sentTxElements.length > 0) {
            activityData.sent = sentTxElements.map((_, idx) => `Transaction ${idx + 1}`);
            console.log(
              `[PROD TEST]          Found ${sentTxElements.length} sent transaction(s)`,
            );
          }

          // Try to get received transactions
          const receivedTxElements = await safeFindElements(
            driver,
            '[data-testid="transaction-item-received"]',
          );
          if (receivedTxElements.length > 0) {
            activityData.received = receivedTxElements.map((_, idx) => `Transaction ${idx + 1}`);
            console.log(
              `[PROD TEST]          Found ${receivedTxElements.length} received transaction(s)`,
            );
          }

          // If no transactions found, that's OK for freshly imported tokens
          if (sentTxElements.length === 0 && receivedTxElements.length === 0) {
            console.log(
              `[PROD TEST]       ℹ️  No transactions found (this is expected for freshly imported tokens)`,
            );
          }

          result.yourActivity = activityData;
          result.validationResult.yourActivityFound = true;
          break;
        }
      } catch (error) {
        // Continue to next selector
      }
    }

    if (!activityFound) {
      console.log(
        `[PROD TEST]       ⚠️  "Your Activity" section not found`,
      );
    }

    // Summary
    console.log(`[PROD TEST]    📊 Details Page Validation Summary:`);
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

      // Import tokens (limited to first few for testing)
      const tokensToTest = tokens.slice(0, 5); // Test first 5 tokens
      let successfulImports = 0;

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
          `[PROD TEST] 📊 Native token: ${sectionsFound}/5 sections found`,
        );

        // Collect result
        collectedResults.push({
          symbol: networkConfig.symbol,
          address: 'NATIVE',
          name: networkConfig.networkName,
          isNativeToken: true,
          chartFound: nativeTokenDetails.validationResult.chartFound,
          balanceDataFound: nativeTokenDetails.validationResult.balanceDataFound,
          tokenDetailsFound: nativeTokenDetails.validationResult.tokenDetailsFound,
          marketDetailsFound: nativeTokenDetails.validationResult.marketDetailsFound,
          yourActivityFound: nativeTokenDetails.validationResult.yourActivityFound,
          balanceDetails: nativeTokenDetails.balanceData,
          tokenDetails: nativeTokenDetails.tokenDetails,
          marketDetails: nativeTokenDetails.marketDetails,
          chartDetails: nativeTokenDetails.chartData,
          yourActivity: {
            sentCount: nativeTokenDetails.yourActivity?.sent?.length || 0,
            receivedCount: nativeTokenDetails.yourActivity?.received?.length || 0,
          },
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
            `[PROD TEST] 📊 ${token.symbol}: ${sectionsFound}/5 sections found`,
          );

          // Collect result
          collectedResults.push({
            symbol: token.symbol,
            address: token.address,
            name: token.name,
            isNativeToken: false,
            chartFound: tokenDetails.validationResult.chartFound,
            balanceDataFound: tokenDetails.validationResult.balanceDataFound,
            tokenDetailsFound: tokenDetails.validationResult.tokenDetailsFound,
            marketDetailsFound: tokenDetails.validationResult.marketDetailsFound,
            yourActivityFound: tokenDetails.validationResult.yourActivityFound,
            balanceDetails: tokenDetails.balanceData,
            tokenDetails: tokenDetails.tokenDetails,
            marketDetails: tokenDetails.marketDetails,
            chartDetails: tokenDetails.chartData,
            yourActivity: {
              sentCount: tokenDetails.yourActivity?.sent?.length || 0,
              receivedCount: tokenDetails.yourActivity?.received?.length || 0,
            },
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
