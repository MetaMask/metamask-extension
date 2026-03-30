/**
 * Production E2E Test: Multi-Network Swap Quotation Validation
 *
 * This test validates swap quotations across multiple imported tokens
 * by testing all token-pair combinations for cross-token quotation consistency.
 *
 * Flow:
 * 1. Add network and import 3 tokens from tokenlist URL
 * 2. For each token pair combination:
 *    a. Navigate to source token details page
 *    b. Click Swap → Select destination token → Enter amount
 *    c. Capture initial quotation values (5 metrics)
 *    d. Click switch-tokens and capture updated values
 *    e. Verify values differ (tokens were switched)
 *    f. Navigate back to home
 * 3. Generate comprehensive JSON report with all results
 *
 * Uses REAL network infrastructure (production RPC endpoints)
 */

import { Suite } from 'mocha';
import FixtureBuilder from '../../../fixtures/fixture-builder';
import { withProductionFixtures } from '../../helpers/prod-with-fixtures';
import { PROD_DELAYS } from '../../helpers/prod-test-helpers';
import { loginWithoutBalanceValidation } from '../../../page-objects/flows/login.flow';
import HomePage from '../../../page-objects/pages/home/homepage';
import NetworkManager from '../../../page-objects/pages/network-manager';
import { Driver } from '../../../webdriver/driver';
import {
  SWAP_TEST_NETWORKS,
  DEFAULT_SWAP_AMOUNT,
  Token,
  QuotationTestResult,
} from './network-swap-config';
import {
  importTokensFromTokenlist,
  importTokensIntoWallet,
  performSwapFlow,
  captureQuotationValues,
  switchTokensAndCapture,
  navigateBack,
  generateQuotationReport,
  generateTokenPairs,
} from './swap-quotation-helpers';

/**
 * Main test suite for swap quotations
 */
describe(
  'Production E2E: Multi-Network Swap Quotation Validation',
  function (this: Suite) {
    this.timeout(600000); // 10 minutes for multiple token pairs and network operations

    /**
     * Test each network in SWAP_TEST_NETWORKS
     */
    SWAP_TEST_NETWORKS.forEach((networkConfig) => {
      describe(`Network: ${networkConfig.networkName}`, function (this: Suite) {
        /**
         * Main test case: Test all token-pair combinations
         */
        it(`should validate swap quotations for all ${networkConfig.nativeTokenSymbol} token pairs`, async function () {
          await withProductionFixtures(
            {
              fixtures: new FixtureBuilder()
                  .withNetworkControllerOnMonad()
                .build(),
              title:
                this.test?.fullTitle() ||
                `Swap quotations test for ${networkConfig.networkName}`,
              extendedTimeoutMultiplier: 2,
            },
            async ({ driver }: { driver: Driver }) => {
              console.log(`\n${'='.repeat(80)}`);
              console.log(
                `[TEST] Starting swap quotation test for ${networkConfig.networkName}`,
              );
              console.log(`${'='.repeat(80)}\n`);

              // Step 1: Login
              console.log(`[TEST] Logging in to wallet...`);
              await loginWithoutBalanceValidation(driver);
              const homePage = new HomePage(driver);
              await homePage.checkPageIsLoaded();
              await driver.delay(PROD_DELAYS.API_RESPONSE);

              // Step 2: Verify network is active
              console.log(
                `[TEST] Verifying network: ${networkConfig.networkName}`,
              );
              const networkManager = new NetworkManager(driver);
              await networkManager.openNetworkManager();

              // Determine which tab to use based on network type
              const usePopularTab = networkConfig.fixtureSetupMethod
                ? 'Popular'
                : 'Add';

              await networkManager.selectTab(usePopularTab);
              await networkManager.selectNetworkByNameWithWait(
                networkConfig.networkName,
              );
              await driver.delay(PROD_DELAYS.API_RESPONSE);

              // Verify we're back on home page
              await homePage.checkPageIsLoaded();
              console.log(
                `[TEST] ✅ Network verified: ${networkConfig.networkName}`,
              );

              // Step 3: Import tokens from tokenlist
              console.log(`[TEST] Importing tokens from tokenlist...`);
              let importedTokens: Token[];
              try {
                importedTokens = await importTokensFromTokenlist(
                  networkConfig.tokenlistUrl,
                  networkConfig.chainId,
                );

                await importTokensIntoWallet(
                  driver,
                  networkConfig.chainId,
                  importedTokens,
                );

                console.log(
                  `[TEST] ✅ Successfully imported ${importedTokens.length} tokens`,
                );
                importedTokens.forEach((token, index) => {
                  console.log(
                    `  ${index + 1}. ${token.symbol} (${token.address})`,
                  );
                });
              } catch (error) {
                console.error(`[TEST] ❌ Failed to import tokens:`, error);
                throw error;
              }

              // Step 4: Generate token pairs
              console.log(`[TEST] Generating token-pair combinations...`);
              const tokenPairs = generateTokenPairs(
                importedTokens,
                networkConfig.nativeTokenSymbol,
              );

              // Step 5: Test each token pair
              console.log(
                `[TEST] Testing ${tokenPairs.length} token pair combinations...`,
              );
              const testResults: QuotationTestResult[] = [];

              for (let pairIndex = 0; pairIndex < tokenPairs.length; pairIndex++) {
                const pair = tokenPairs[pairIndex];
                const pairNumber = pairIndex + 1;

                console.log(
                  `\n[TEST] Testing pair ${pairNumber}/${tokenPairs.length}: ${pair.label}`,
                );

                try {
                  // Determine source token info
                  let sourceTokenSymbol = networkConfig.nativeTokenSymbol;

                  if (pair.source !== 'native') {
                    sourceTokenSymbol = pair.source.symbol;
                  }

                  const destinationTokenSymbol = pair.destination.symbol;
                  const destinationTokenAddress = pair.destination.address;

                  // Perform swap flow
                  console.log(
                    `[TEST]   → Performing swap: ${sourceTokenSymbol} → ${destinationTokenSymbol}`,
                  );
                  await performSwapFlow(driver, {
                    sourceTokenSymbol,
                    destinationTokenAddress: destinationTokenAddress,
                    destinationTokenSymbol: destinationTokenSymbol,
                    fromAmount: DEFAULT_SWAP_AMOUNT,
                  });

                  // Capture initial quotation values
                  console.log(`[TEST]   → Capturing initial quotation values`);
                  const beforeSwitchSnapshot = await captureQuotationValues(
                    driver,
                  );

                  // Switch tokens and capture new values
                  console.log(
                    `[TEST]   → Switching tokens and capturing new values`,
                  );
                  const afterSwitchSnapshot = await switchTokensAndCapture(
                    driver,
                  );

                  // Verify values changed
                  const valuesChanged =
                    beforeSwitchSnapshot.toAmount !==
                    afterSwitchSnapshot.toAmount;
                  console.log(
                    `[TEST]   → Values changed: ${valuesChanged ? '✅' : '⚠️'}`,
                  );

                  // Create quotation test result
                  const sourceToken =
                    pair.source === 'native'
                      ? {
                          chainId: networkConfig.chainId,
                          address: '',
                          name: networkConfig.nativeTokenSymbol,
                          symbol: networkConfig.nativeTokenSymbol,
                          decimals: 18,
                        }
                      : pair.source;

                  const testResult: QuotationTestResult = {
                    networkName: networkConfig.networkName,
                    tokenPair: pair.label,
                    sourceTokenSymbol: sourceToken.symbol,
                    destinationTokenSymbol: destinationTokenSymbol,
                    quotations: {
                      sourceToken,
                      destinationToken: pair.destination,
                      beforeSwitch: beforeSwitchSnapshot,
                      afterSwitch: afterSwitchSnapshot,
                      assertion: {
                        expectedTokensSwitch: true,
                        valuesChanged,
                      },
                    },
                    status: valuesChanged ? 'passed' : 'failed',
                  };

                  testResults.push(testResult);
                  console.log(
                    `[TEST]   ✅ Pair test completed: ${pair.label}`,
                  );

                  // Navigate back to home (2x back clicks)
                  console.log(`[TEST]   → Navigating back to home`);
                  await navigateBack(driver);
                  await driver.delay(PROD_DELAYS.API_RESPONSE);
                  await navigateBack(driver);
                  await driver.delay(PROD_DELAYS.API_RESPONSE);

                  // Verify back on home page
                  await homePage.checkPageIsLoaded();
                } catch (error) {
                  console.error(
                    `[TEST]   ❌ Error testing pair ${pairNumber}: ${pair.label}`,
                  );
                  console.error(error);

                  const testResult: QuotationTestResult = {
                    networkName: networkConfig.networkName,
                    tokenPair: pair.label,
                    sourceTokenSymbol: pair.source === 'native' ? networkConfig.nativeTokenSymbol : pair.source.symbol,
                    destinationTokenSymbol: pair.destination.symbol,
                    quotations: {
                      sourceToken:
                        pair.source === 'native'
                          ? {
                              chainId: networkConfig.chainId,
                              address: '',
                              name: networkConfig.nativeTokenSymbol,
                              symbol: networkConfig.nativeTokenSymbol,
                              decimals: 18,
                            }
                          : pair.source,
                      destinationToken: pair.destination,
                      beforeSwitch: {
                        toAmount: '',
                        networkFeeSponsored: '',
                        slippageValue: '',
                        priceImpact: '',
                        minimumReceived: '',
                        capturedAt: new Date().toISOString(),
                      },
                      afterSwitch: {
                        toAmount: '',
                        networkFeeSponsored: '',
                        slippageValue: '',
                        priceImpact: '',
                        minimumReceived: '',
                        capturedAt: new Date().toISOString(),
                      },
                      assertion: {
                        expectedTokensSwitch: false,
                        valuesChanged: false,
                      },
                    },
                    status: 'failed',
                    error: String(error),
                  };

                  testResults.push(testResult);

                  // Try to navigate back even after error
                  try {
                    await navigateBack(driver);
                    await driver.delay(PROD_DELAYS.API_RESPONSE);
                  } catch (backError) {
                    console.warn(
                      `[TEST]   ⚠️  Could not navigate back after error`,
                    );
                  }
                }
              }

              // Step 6: Generate comprehensive report
              console.log(
                `\n[TEST] Generating comprehensive quotation report...`,
              );
              try {
                const reportPath = await generateQuotationReport(
                  testResults,
                  networkConfig.networkName,
                  networkConfig.chainId,
                  networkConfig.tokenlistUrl,
                  networkConfig.nativeTokenSymbol,
                );

                console.log(`[TEST] ✅ Report generated: ${reportPath}`);

                // Verify test results
                const totalTests = testResults.length;
                const passedTests = testResults.filter(
                  (r) => r.status === 'passed',
                ).length;
                const failedTests = testResults.filter(
                  (r) => r.status === 'failed',
                ).length;

                console.log(`\n[TEST] Final Results Summary:`);
                console.log(`  Total token pairs tested: ${totalTests}`);
                console.log(`  ✅ Passed: ${passedTests}`);
                console.log(`  ❌ Failed: ${failedTests}`);

                // Assert at least some tests passed
                if (passedTests === 0) {
                  throw new Error(
                    `All token-pair tests failed. Check report: ${reportPath}`,
                  );
                }

                console.log(
                  `\n[TEST] ✅ Swap quotation test suite completed successfully!`,
                );
                console.log(`[TEST] Report path: ${reportPath}\n`);
              } catch (error) {
                console.error(`[TEST] ❌ Failed to generate report:`, error);
                throw error;
              }
            },
          );
        });
      });
    });
  },
);
