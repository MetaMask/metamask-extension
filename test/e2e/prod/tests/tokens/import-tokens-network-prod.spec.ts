/**
 * Production E2E Test: Import Tokens for Multiple Networks
 *
 * This test automatically runs for all networks defined in network-configs.ts
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
  downloadImage,
  isTransparentFallback,
  compareImages,
  validateLogoURL,
  fetchTokenList,
  TokenImportResults,
  Token,
  NetworkTestResult,
  generateConsolidatedReport,
} from './token-import-helpers';

/**
 * Run token import test for a specific network
 * Returns the test results for consolidated reporting
 * @param networkConfig
 * @param testContext
 */
async function runTokenImportTest(
  networkConfig: NetworkConfig,
  testContext: any,
): Promise<NetworkTestResult | null> {
  let testResult: NetworkTestResult | null = null;

  await withProductionFixtures(
    {
      fixtures: new FixtureBuilder().withNetworkControllerOnMainnet().build(),
      title:
        testContext.test?.fullTitle() ??
        `${networkConfig.networkName} Token Import Test`,
    },
    async ({ driver }: { driver: Driver }) => {
      // Login
      await loginWithoutBalanceValidation(driver);

      console.log(
        `[PROD TEST] Starting ${networkConfig.networkName} network addition...`,
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

      // Verify we're on the correct network
      try {
        const networkDisplay = await driver.findElement(
          '[data-testid="network-display"]',
        );
        const networkText = await networkDisplay.getText();
        console.log(`[PROD TEST] Current network: ${networkText}`);
      } catch (error) {
        console.log('[PROD TEST] Error:', error);
      }

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

      // Track import results
      const importResults: TokenImportResults = {
        successful: [],
        failed: [],
        skipped: [],
        missingLogos: [],
      };

      console.log(`[PROD TEST] Starting to import ${tokens.length} tokens...`);

      // Import each token with error handling
      for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        const progress = `[${i + 1}/${tokens.length}]`;

        // Pre-validate token before attempting import
        const validationIssues: string[] = [];

        // Check if symbol exists and is not empty
        if (!token.symbol || token.symbol.trim().length === 0) {
          validationIssues.push('Symbol is empty or missing');
        }

        // Check symbol length (MetaMask limit: 11 characters)
        if (token.symbol && token.symbol.length > 11) {
          validationIssues.push(
            `Symbol too long (${token.symbol.length} chars, max 11)`,
          );
        }

        // Check if address is valid (basic check)
        if (
          !token.address ||
          !token.address.startsWith('0x') ||
          token.address.length !== 42
        ) {
          validationIssues.push('Invalid token address format');
        }

        // Check if address is not all zeros
        if (
          token.address &&
          token.address.toLowerCase() === `0x${'0'.repeat(40)}`
        ) {
          validationIssues.push('Token address is all zeros (invalid)');
        }

        // If validation fails, skip this token
        if (validationIssues.length > 0) {
          const reason = validationIssues.join(', ');
          importResults.skipped.push({
            symbol: token.symbol,
            address: token.address,
            name: token.name,
            reason,
          });
          console.log(
            `[PROD TEST] ${progress} ⏭️  Skipped ${token.symbol}: ${reason}`,
          );
          continue;
        }

        console.log(
          `[PROD TEST] ${progress} Importing token: ${token.symbol} (${token.address})`,
        );

        try {
          // Set a timeout for the import operation (15 seconds for symbol/decimals to load)
          const importTimeout = 15000;
          const importPromise = assetListPage.importCustomTokenByChain(
            toHex(networkConfig.chainId).toString(),
            token.address,
          );

          // Race between import and timeout
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(
              () =>
                reject(
                  new Error(
                    'Token import timed out - symbol/decimals may not have loaded',
                  ),
                ),
              importTimeout,
            );
          });

          try {
            await Promise.race([importPromise, timeoutPromise]);
            // Wait a bit for token to be imported
            await driver.delay(2000);
          } catch (timeoutError) {
            // Import timed out - try to close any open modals and continue
            console.log(
              `[PROD TEST] ${progress} ⏱️  Import timeout, attempting cleanup...`,
            );

            try {
              // Try to close the import modal if it's still open
              const closeButton =
                '[data-testid="import-tokens-modal-close-button"]';
              const cancelButton =
                '[data-testid="import-tokens-modal-cancel-button"]';

              // Try close button first
              const closeElements = await driver.findElements(closeButton);
              if (closeElements.length > 0) {
                await driver.clickElement(closeButton);
                await driver.delay(500);
              } else {
                // Try cancel button
                const cancelElements = await driver.findElements(cancelButton);
                if (cancelElements.length > 0) {
                  await driver.clickElement(cancelButton);
                  await driver.delay(500);
                }
              }
            } catch (cleanupError) {
              console.log(
                `[PROD TEST] ${progress} ⚠️  Cleanup failed: ${cleanupError}`,
              );
            }

            // Re-throw the timeout error to be caught by outer try-catch
            throw timeoutError;
          }

          // Two-part logo validation:
          // a) Server-side: Does the URL fetch a valid image?
          // b) Client-side: Does MetaMask render the image (not showing fallback)?

          let logoStatus: 'valid' | 'fallback' | 'not-checked' = 'not-checked';

          if (!token.logoURI || token.logoURI.trim().length === 0) {
            // No logoURI provided in tokenlist
            importResults.missingLogos.push({
              symbol: token.symbol,
              address: token.address,
              name: token.name,
              logoURI: token.logoURI,
              reason: 'No logoURI in tokenlist',
            });
            logoStatus = 'fallback';
            console.log(
              `[PROD TEST] ${progress} ⚠️  Logo missing (no URI): ${token.symbol}`,
            );
          } else {
            // logoURI exists, validate if it fetches a valid image
            console.log(
              `[PROD TEST] ${progress} 🔍 Validating logo URL for: ${token.symbol}`,
            );
            console.log(`[PROD TEST]    URL: ${token.logoURI}`);
            const urlValidation = await validateLogoURL(token.logoURI);
            if (!urlValidation.valid) {
              importResults.missingLogos.push({
                symbol: token.symbol,
                address: token.address,
                name: token.name,
                logoURI: token.logoURI,
                reason: `URL validation failed: ${urlValidation.error}`,
              });
              logoStatus = 'fallback';
              console.log(
                `[PROD TEST] ${progress} ⚠️  Logo URL failed: ${token.symbol} - ${urlValidation.error}`,
              );
            } else {
              // URL is valid (or skipped for BASE_URL placeholders), now check if MetaMask actually rendered the image
              if (urlValidation.skipped) {
                console.log(
                  `[PROD TEST] ${progress} ⏭️  Logo URL validation skipped (BASE_URL placeholder), checking UI rendering...`,
                );
              } else {
                console.log(
                  `[PROD TEST] ${progress} ✅ Logo URL valid, checking UI rendering...`,
                );
              }
              await driver.clickElement(
                '[data-testid="account-overview__asset-tab"]',
              );
              await driver.delay(1000);

              try {
                const altText = `${token.symbol} logo`;
                console.log(
                  `[PROD TEST] ${progress} 🔍 Looking for img with alt="${altText}"`,
                );

                // Get all logo images and find the matching one (case-insensitive)
                // This avoids timeout issues with exact CSS selectors and handles special characters
                const allImages = await driver.findElements('img[alt*="logo"]');
                console.log(
                  `[PROD TEST] ${progress} 📊 Found ${allImages.length} total logo images`,
                );

                const images = [];
                const foundAlts = [];
                for (const img of allImages) {
                  const alt = await img.getAttribute('alt');
                  foundAlts.push(alt);

                  // Case-insensitive comparison
                  if (alt && alt.toLowerCase() === altText.toLowerCase()) {
                    images.push(img);
                    console.log(
                      `[PROD TEST] ${progress} ✅ Found matching image: alt="${alt}"`,
                    );
                    break;
                  }
                }

                if (images.length === 0) {
                  // Debug: Show all alt texts found to help diagnose mismatches
                  console.log(
                    `[PROD TEST] ${progress} 🔍 No match found. All alt texts seen:`,
                  );
                  foundAlts.forEach((alt, idx) => {
                    console.log(`[PROD TEST]    [${idx + 1}] "${alt}"`);
                  });
                }

                console.log(
                  `[PROD TEST] ${progress} 📊 Found ${images.length} image(s) matching "${altText}"`,
                );

                if (images.length > 0) {
                  const img = images[0];
                  const metamaskSrc = await img.getAttribute('src');
                  console.log(
                    `[PROD TEST] ${progress} 🖼️  Image src: ${metamaskSrc}`,
                  );

                  // Compare the original logo with what MetaMask is serving
                  console.log(
                    `[PROD TEST] ${progress} 🔍 Comparing images for: ${token.symbol}`,
                  );

                  const comparison = await compareImages(
                    token.logoURI,
                    metamaskSrc,
                  );

                  if (!comparison.areSimilar) {
                    importResults.missingLogos.push({
                      symbol: token.symbol,
                      address: token.address,
                      name: token.name,
                      logoURI: token.logoURI,
                      reason: `Logo mismatch - ${comparison.info}`,
                    });
                    logoStatus = 'fallback';
                    console.log(
                      `[PROD TEST] ${progress} ⚠️  Logo mismatch: ${token.symbol}`,
                    );
                    console.log(`[PROD TEST]    ${comparison.info}`);
                    console.log(`[PROD TEST]    Original: ${token.logoURI}`);
                    console.log(`[PROD TEST]    MetaMask: ${metamaskSrc}`);
                  } else {
                    logoStatus = 'valid';
                    console.log(
                      `[PROD TEST] ${progress} ✅ Logo matches: ${token.symbol}`,
                    );
                    console.log(`[PROD TEST]    ${comparison.info}`);
                  }
                } else {
                  // No image element found - report as missing logo
                  importResults.missingLogos.push({
                    symbol: token.symbol,
                    address: token.address,
                    name: token.name,
                    logoURI: token.logoURI,
                    reason:
                      'No image element found in UI (token may not be visible)',
                  });
                  logoStatus = 'fallback';
                  console.log(
                    `[PROD TEST] ${progress} ⚠️  No img tag found for: ${token.symbol}`,
                  );
                  console.log(`[PROD TEST]    Expected alt text: "${altText}"`);
                  console.log(
                    `[PROD TEST]    This might mean the token is not visible in the UI`,
                  );
                }
              } catch (logoError) {
                // Logo check error - report as missing logo
                importResults.missingLogos.push({
                  symbol: token.symbol,
                  address: token.address,
                  name: token.name,
                  logoURI: token.logoURI,
                  reason: `Logo check error: ${logoError}`,
                });
                logoStatus = 'fallback';
                console.log(
                  `[PROD TEST] ${progress} ⚠️  Logo check error for ${token.symbol}: ${logoError}`,
                );
              }
            }
          }

          // Fetch balance, price, and price change information
          let balance = 'N/A';
          let fiatValue = 'N/A';
          let priceAvailable = false;
          let priceChange = 'N/A';

          try {
            console.log(
              `[PROD TEST] ${progress} 💰 Fetching balance, price, and price change for: ${token.symbol}`,
            );

            // Navigate to asset list to check balance and price
            await driver.clickElement(
              '[data-testid="account-overview__asset-tab"]',
            );
            await driver.delay(3000); // Wait for price API response

            // Find all token list items
            const tokenListItems = await driver.findElements(
              '[data-testid="multichain-token-list-button"]',
            );

            // Search for the specific token
            for (const item of tokenListItems) {
              try {
                const itemText = await item.getText();

                // Check if this is our token (by symbol)
                if (itemText.includes(token.symbol)) {
                  console.log(
                    `[PROD TEST] ${progress} 🔍 Found token in list: ${token.symbol}`,
                  );

                  // Try to get balance using driver.findNestedElement
                  try {
                    const balanceElement = await driver.findNestedElement(
                      item,
                      '[data-testid="multichain-token-list-item-value"]',
                    );
                    balance = await balanceElement.getText();
                    console.log(
                      `[PROD TEST] ${progress}    Balance: ${balance}`,
                    );
                  } catch (balanceError) {
                    console.log(
                      `[PROD TEST] ${progress}    ⚠️  Could not fetch balance: ${balanceError}`,
                    );
                  }

                  // Try to get fiat value (indicates price was fetched)
                  try {
                    const fiatElement = await driver.findNestedElement(
                      item,
                      '[data-testid="multichain-token-list-item-secondary-value"]',
                    );
                    fiatValue = await fiatElement.getText();

                    // Check if price is actually available (not just $0.00 from zero balance)
                    if (
                      fiatValue &&
                      fiatValue !== '' &&
                      fiatValue !== '$0.00'
                    ) {
                      priceAvailable = true;
                      console.log(
                        `[PROD TEST] ${progress}    ✅ Price fetched: ${fiatValue}`,
                      );
                    } else if (fiatValue === '$0.00') {
                      // Could be zero balance or no price - check if balance is also zero
                      if (balance.startsWith('0 ')) {
                        // Zero balance, price might still be available
                        priceAvailable = true;
                        console.log(
                          `[PROD TEST] ${progress}    ✅ Price available (zero balance): ${fiatValue}`,
                        );
                      } else {
                        console.log(
                          `[PROD TEST] ${progress}    ⚠️  Price not available`,
                        );
                      }
                    } else {
                      console.log(
                        `[PROD TEST] ${progress}    ⚠️  Price not available`,
                      );
                    }
                  } catch (fiatError) {
                    console.log(
                      `[PROD TEST] ${progress}    ⚠️  Could not fetch fiat value: ${fiatError}`,
                    );
                  }

                  // Try to get price change percentage (24h change)
                  try {
                    const priceChangeSelector = `[data-testid="token-increase-decrease-percentage-${token.address}"]`;
                    const priceChangeElement = await driver.findNestedElement(
                      item,
                      priceChangeSelector,
                    );
                    priceChange = await priceChangeElement.getText();

                    if (priceChange && priceChange.trim() !== '') {
                      console.log(
                        `[PROD TEST] ${progress}    📊 24h Price Change: ${priceChange}`,
                      );
                    } else {
                      priceChange = 'N/A';
                      console.log(
                        `[PROD TEST] ${progress}    ⚠️  Price change not available`,
                      );
                    }
                  } catch (priceChangeError) {
                    console.log(
                      `[PROD TEST] ${progress}    ⚠️  Could not fetch price change: ${priceChangeError}`,
                    );
                  }

                  break; // Found our token, stop searching
                }
              } catch (itemError) {
                // Skip this item and continue
              }
            }
          } catch (priceError) {
            console.log(
              `[PROD TEST] ${progress} ⚠️  Error fetching price/balance/change: ${priceError}`,
            );
          }

          importResults.successful.push({
            symbol: token.symbol,
            address: token.address,
            name: token.name,
            logoStatus,
            balance,
            fiatValue,
            priceAvailable,
            priceChange,
          });
          console.log(
            `[PROD TEST] ${progress} ✅ Successfully imported: ${token.symbol}`,
          );
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);

          // Check if this is a timeout error (stuck on symbol/decimals loading)
          if (errorMessage.includes('timed out')) {
            console.log(
              `[PROD TEST] ${progress} ⏱️  Import timed out for: ${token.symbol}`,
            );
            console.log(
              `[PROD TEST]    This usually means the RPC didn't return token metadata (symbol/decimals)`,
            );

            // Try to close the stuck import modal
            try {
              console.log(
                `[PROD TEST]    Attempting to close stuck import modal...`,
              );

              // Try to find and click the close button on the modal
              const closeButtonSelectors = [
                '[data-testid="import-tokens-modal-close-button"]',
                '.mm-modal-content__header-close-button',
                'button[aria-label="Close"]',
                '.modal-close-button',
              ];

              let modalClosed = false;
              for (const selector of closeButtonSelectors) {
                try {
                  const closeButton = await driver.findElement(selector);
                  if (closeButton) {
                    await driver.clickElement(selector);
                    await driver.delay(1000);
                    modalClosed = true;
                    console.log(
                      `[PROD TEST]    ✅ Modal closed using selector: ${selector}`,
                    );
                    break;
                  }
                } catch (e) {
                  // Try next selector
                }
              }

              // If no close button found, try clicking outside the modal or refreshing
              if (!modalClosed) {
                console.log(
                  `[PROD TEST]    ⚠️  Could not find close button, attempting to navigate away...`,
                );
                // Navigate to home page to dismiss any open modals
                await driver.clickElement(
                  '[data-testid="account-overview__asset-tab"]',
                );
                await driver.delay(1000);
              }
            } catch (closeError) {
              console.log(
                `[PROD TEST]    ⚠️  Could not close modal: ${closeError}`,
              );
            }
          }

          importResults.failed.push({
            symbol: token.symbol,
            address: token.address,
            name: token.name,
            error: errorMessage,
          });
          console.log(
            `[PROD TEST] ${progress} ❌ Failed to import: ${token.symbol}`,
          );
          console.log(`[PROD TEST]    Error: ${errorMessage}`);
        }
      }

      // Calculate logo statistics
      const validLogos = importResults.successful.filter(
        (t) => t.logoStatus === 'valid',
      ).length;
      const fallbackLogos = importResults.successful.filter(
        (t) => t.logoStatus === 'fallback',
      ).length;
      const notCheckedLogos = importResults.successful.filter(
        (t) => t.logoStatus === 'not-checked',
      ).length;

      // Print summary
      console.log('\n[PROD TEST] ========================================');
      console.log('[PROD TEST] ========== IMPORT SUMMARY ==========');
      console.log('[PROD TEST] ========================================');
      console.log(
        `[PROD TEST] Network: ${networkConfig.networkName} (Chain ID: ${networkConfig.chainId})`,
      );
      console.log(`[PROD TEST] Total tokens in tokenlist: ${tokens.length}`);
      console.log('[PROD TEST] ----------------------------------------');
      console.log(
        `[PROD TEST] ✅ Successfully imported: ${importResults.successful.length}`,
      );
      console.log(`[PROD TEST]    └─ With valid logos: ${validLogos}`);
      console.log(`[PROD TEST]    └─ With fallback logos: ${fallbackLogos}`);
      console.log(`[PROD TEST]    └─ Logo not checked: ${notCheckedLogos}`);
      console.log(
        `[PROD TEST] ⏭️  Skipped (validation): ${importResults.skipped.length}`,
      );
      console.log(
        `[PROD TEST] ❌ Failed to import: ${importResults.failed.length}`,
      );
      console.log(
        `[PROD TEST] ⚠️  Missing/broken logos: ${importResults.missingLogos.length}`,
      );
      console.log('[PROD TEST] ========================================\n');

      // Print detailed results for ALL categories
      console.log('[PROD TEST] ========================================');
      console.log('[PROD TEST] ========== DETAILED RESULTS ==========');
      console.log('[PROD TEST] ========================================\n');

      // 1. Successfully imported tokens
      if (importResults.successful.length > 0) {
        console.log(
          `[PROD TEST] ✅ SUCCESSFULLY IMPORTED (${importResults.successful.length} tokens):`,
        );
        console.log('[PROD TEST] ----------------------------------------');
        importResults.successful.forEach((item, index) => {
          const logoIcon =
            item.logoStatus === 'valid'
              ? '🖼️'
              : item.logoStatus === 'fallback'
                ? '⚠️'
                : '❓';
          console.log(`[PROD TEST] ${index + 1}. ${item.symbol} ${logoIcon}`);
          console.log(`[PROD TEST]    Name: ${item.name}`);
          console.log(`[PROD TEST]    Address: ${item.address}`);
          console.log(`[PROD TEST]    Logo Status: ${item.logoStatus}`);
        });
        console.log('');
      }

      // 2. Skipped tokens
      if (importResults.skipped.length > 0) {
        console.log(
          `[PROD TEST] ⏭️  SKIPPED TOKENS (${importResults.skipped.length} tokens):`,
        );
        console.log('[PROD TEST] ----------------------------------------');
        importResults.skipped.forEach((item, index) => {
          console.log(`[PROD TEST] ${index + 1}. ${item.symbol}`);
          console.log(`[PROD TEST]    Name: ${item.name}`);
          console.log(`[PROD TEST]    Address: ${item.address}`);
          console.log(`[PROD TEST]    Reason: ${item.reason}`);
        });
        console.log('');
      }

      // 3. Failed imports
      if (importResults.failed.length > 0) {
        console.log(
          `[PROD TEST] ❌ FAILED IMPORTS (${importResults.failed.length} tokens):`,
        );
        console.log('[PROD TEST] ----------------------------------------');
        importResults.failed.forEach((item, index) => {
          console.log(`[PROD TEST] ${index + 1}. ${item.symbol}`);
          console.log(`[PROD TEST]    Name: ${item.name}`);
          console.log(`[PROD TEST]    Address: ${item.address}`);
          console.log(`[PROD TEST]    Error: ${item.error}`);
        });
        console.log('');
      }

      // 4. Missing/broken logos
      if (importResults.missingLogos.length > 0) {
        console.log(
          `[PROD TEST] ⚠️  MISSING/BROKEN LOGOS (${importResults.missingLogos.length} tokens):`,
        );
        console.log('[PROD TEST] ----------------------------------------');
        importResults.missingLogos.forEach((item, index) => {
          console.log(`[PROD TEST] ${index + 1}. ${item.symbol}`);
          console.log(`[PROD TEST]    Name: ${item.name}`);
          console.log(`[PROD TEST]    Address: ${item.address}`);
          console.log(`[PROD TEST]    Logo URI: ${item.logoURI || 'N/A'}`);
          console.log(`[PROD TEST]    Reason: ${item.reason}`);
        });
        console.log('');
      }

      console.log('[PROD TEST] ========================================');

      console.log(
        `[PROD TEST] ✅ ${networkConfig.networkName} test completed successfully`,
      );

      // Store results for consolidated report
      testResult = {
        networkName: networkConfig.networkName,
        chainId: networkConfig.chainId,
        tokenlistUrl: networkConfig.tokenlistUrl,
        blockExplorerUrl: networkConfig.blockExplorerUrl || 'N/A',
        totalTokens: tokens.length,
        results: importResults,
        timestamp: new Date(),
      };
    },
  );

  return testResult;
}

/**
 * Array to collect results from all network tests for consolidated report
 */
const allNetworkResults: NetworkTestResult[] = [];

/**
 * Generate tests for all configured networks
 */
describe('Production E2E: Import Tokens for Multiple Networks', function (this: Suite) {
  this.timeout(14400000); // 4 hours for importing many tokens across all networks

  // Generate a test for each network in the configuration
  NETWORK_CONFIGS.forEach((networkConfig) => {
    it(`imports all tokens from ${networkConfig.networkName} (Chain ID: ${networkConfig.chainId})`, async function () {
      // Set per-test timeout to 60 minutes per network
      this.timeout(3600000);

      const result = await runTokenImportTest(networkConfig, this);

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
      const reportPath = 'test/e2e/prod/tests/tokens/token-import-report.md';
      try {
        generateConsolidatedReport(allNetworkResults, reportPath);
        console.log(
          `[PROD TEST] 📄 Consolidated report generated: ${reportPath}`,
        );
      } catch (error) {
        console.warn(
          `[PROD TEST] ⚠️  Failed to generate consolidated report: ${error}`,
        );
      }
    } else {
      console.warn(
        '[PROD TEST] ⚠️  No network results collected, skipping report generation',
      );
    }
  });
});
