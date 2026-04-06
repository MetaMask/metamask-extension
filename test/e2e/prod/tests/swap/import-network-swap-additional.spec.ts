/**
 * Production E2E Test: Monad Network Swap Execution
 *
 * Submits live swap transactions across a predefined sequence of routes,
 * verifies each route results in a confirmed activity entry, asserts the
 * detail-page values, and generates a simple markdown execution report.
 *
 * Routes tested (Monad):  MON → AUSD → AZND → BTC.b → MON
 *
 * Prerequisites:
 * - PRIVATE_KEY_TO in .env.e2e (funded account with Monad-native MON)
 * - Real network connectivity to Monad RPC
 */

import { Suite } from 'mocha';
import FixtureBuilder from '../../../fixtures/fixture-builder';
import { withProductionFixtures } from '../../helpers/prod-with-fixtures';
import { PROD_DELAYS } from '../../helpers/prod-test-helpers';
import { loginWithoutBalanceValidation } from '../../../page-objects/flows/login.flow';
import HomePage from '../../../page-objects/pages/home/homepage';
import NetworkManager from '../../../page-objects/pages/network-manager';
import { Driver } from '../../../webdriver/driver';
import { getRequiredE2EEnv } from '../../../helpers/e2e-env';
import {
  SWAP_TEST_NETWORKS,
  DEFAULT_SWAP_AMOUNT,
  Token,
  SwapRouteResult,
} from './network-swap-config';
import {
  importTokensFromTokenlist,
  importTokensIntoWallet,
  performSwapFlow,
  configureSwapPairInCurrentSwapPage,
} from './swap-quotation-helpers';
import {
  resolveTokensBySymbols,
  importSingleFundedAccount,
  waitForSwapQuoteReady,
  assertCtaFeeText,
  captureSwapAmounts,
  submitSwapAndWaitForConfirmed,
  assertActivityPrimaryCurrency,
  assertActivitySecondaryCurrency,
  openLatestSwapActivityRecord,
  assertSwapDetailConfirmed,
  assertDetailRow,
  assertGasFeeRowPaidByMetaMask,
  navigateBackToHome,
  recoverToHome,
  generateSwapExecutionReport,
} from './swap-execution-helpers';

/**
 * Production E2E Test: Monad Swap Execution
 *
 * Configuration is driven by SWAP_TEST_NETWORKS — only networks with
 * `swapExecutionRoutes` defined will run. Currently: Monad only.
 */
describe('Production E2E: Network Swap Execution', function (this: Suite) {
  this.timeout(900000); // 15 minutes total for all routes

  SWAP_TEST_NETWORKS.forEach((networkConfig) => {
    if (!networkConfig.swapExecutionRoutes?.length) {
      return; // skip networks not yet configured for execution tests
    }

    describe(`Network: ${networkConfig.networkName}`, function (this: Suite) {
      it(`should execute swap routes for ${networkConfig.nativeTokenSymbol}`, async function () {
        // Collect per-route results for the final markdown report
        const routeResults: SwapRouteResult[] = [];

        await withProductionFixtures(
          {
            fixtures: new FixtureBuilder()
              .withNetworkControllerOnMonad()
              .build(),
            title:
              this.test?.fullTitle() ||
              `Swap execution test for ${networkConfig.networkName}`,
            extendedTimeoutMultiplier: 2,
          },
          async ({ driver }: { driver: Driver }) => {
            console.log(`\n${'='.repeat(80)}`);
            console.log(
              `[TEST] Starting swap execution test for ${networkConfig.networkName}`,
            );
            console.log(`${'='.repeat(80)}\n`);

            // ----------------------------------------------------------------
            // Step 1: Login
            // ----------------------------------------------------------------
            console.log(`[TEST] Logging in to wallet...`);
            await loginWithoutBalanceValidation(driver);
            const homePage = new HomePage(driver);
            await homePage.checkPageIsLoaded();
            await driver.delay(PROD_DELAYS.API_RESPONSE);
            console.log(`[TEST] ✅ Logged in`);

            // ----------------------------------------------------------------
            // Step 2: Select network
            // ----------------------------------------------------------------
            console.log(
              `[TEST] Selecting ${networkConfig.networkName} network...`,
            );
            const networkManager = new NetworkManager(driver);
            await networkManager.openNetworkManager();
            await networkManager.selectTab('Popular');
            await networkManager.selectNetworkByNameWithWait(
              networkConfig.networkName,
            );
            await homePage.checkPageIsLoaded();
            await driver.delay(PROD_DELAYS.API_RESPONSE);
            console.log(
              `[TEST] ✅ Network selected: ${networkConfig.networkName}`,
            );

            // ----------------------------------------------------------------
            // Step 3: Import funded account
            // PRIVATE_KEY_TO holds the account that has balance for swaps.
            // This does NOT import the entire wallet — it adds one funded
            // account to the existing MetaMask instance.
            // ----------------------------------------------------------------
            console.log(`[TEST] Importing funded account (PRIVATE_KEY_TO)...`);
            const privateKeyTo = getRequiredE2EEnv('PRIVATE_KEY_TO');
            await importSingleFundedAccount(driver, privateKeyTo);
            console.log(`[TEST] ✅ Funded account imported and active`);

            // ----------------------------------------------------------------
            // Step 4: Fetch tokenlist and import ERC-20 tokens
            // Fetch a larger set so symbol-based resolution can find all
            // configured symbols regardless of tokenlist order.
            // ----------------------------------------------------------------
            console.log(
              `[TEST] Fetching tokenlist for ${networkConfig.networkName}...`,
            );
            const tokenlistTokens = await importTokensFromTokenlist(
              networkConfig.tokenlistUrl,
              networkConfig.chainId,
              50, // fetch up to 50 tokens so we can find symbols by name
            );

            const executionSymbols =
              networkConfig.swapExecutionTokenSymbols ?? [];
            const resolvedTokens = resolveTokensBySymbols(
              tokenlistTokens,
              executionSymbols,
            );
            console.log(
              `[TEST] Resolved ${resolvedTokens.length} execution tokens: ${resolvedTokens.map((t) => t.symbol).join(', ')}`,
            );

            await importTokensIntoWallet(
              driver,
              networkConfig.chainId,
              resolvedTokens,
            );
            console.log(`[TEST] ✅ ERC-20 tokens imported into wallet`);

            // Build symbol → token lookup for address resolution
            const tokenBySymbol = new Map<string, Token>(
              resolvedTokens.map((t) => [t.symbol, t]),
            );

            // ----------------------------------------------------------------
            // Step 5: Execute each route sequentially
            // Route 1 starts with 20 MON. Each subsequent route uses the
            // previous route's exact received amount so the chain stays at the
            // live equivalent of the initial 20 MON swap.
            // ----------------------------------------------------------------
            let hasEnteredSwapFlow = false;
            let nextRouteFromAmount = DEFAULT_SWAP_AMOUNT.toString();
            // swapExecutionRoutes is guaranteed non-empty (checked by the
            // outer guard: `if (!networkConfig.swapExecutionRoutes?.length)`)
            const executionRoutes = networkConfig.swapExecutionRoutes ?? [];

            for (const [routeIndex, route] of executionRoutes.entries()) {
              const { from: fromSymbol, to: toSymbol } = route;
              const routeLabel = `${fromSymbol} → ${toSymbol}`;
              const plannedFromAmount = nextRouteFromAmount;
              const useMaxForRoute =
                routeIndex === executionRoutes.length - 1 &&
                fromSymbol === 'BTC.b' &&
                toSymbol === networkConfig.nativeTokenSymbol;

              const routeResult: SwapRouteResult = {
                route: routeLabel,
                fromSymbol,
                toSymbol,
                fromAmount: '',
                toAmount: '',
                status: 'failed',
              };

              // Resolve destination address.
              // For native token destination, use the symbol as the picker
              // search term (no contract address needed).
              const isToNative = toSymbol === networkConfig.nativeTokenSymbol;
              const destinationAddress = isToNative
                ? toSymbol
                : (tokenBySymbol.get(toSymbol)?.address ?? toSymbol);

              console.log(`\n[TEST] ── Route: ${routeLabel} ──`);

              try {
                // -- Enter or reconfigure the swap page --
                if (hasEnteredSwapFlow) {
                  console.log(
                    `[TEST] Reconfiguring in-page swap for route: ${routeLabel}`,
                  );
                  await configureSwapPairInCurrentSwapPage(driver, {
                    sourceTokenSymbol: fromSymbol,
                    destinationTokenAddress: destinationAddress,
                    destinationTokenSymbol: toSymbol,
                    fromAmount: plannedFromAmount,
                    useMax: useMaxForRoute,
                  });
                } else {
                  console.log(`[TEST] Entering swap flow for first route...`);
                  await performSwapFlow(driver, {
                    sourceTokenSymbol: fromSymbol,
                    destinationTokenAddress: destinationAddress,
                    destinationTokenSymbol: toSymbol,
                    fromAmount: plannedFromAmount,
                    useMax: useMaxForRoute,
                  });
                  hasEnteredSwapFlow = true;
                }

                // -- Wait for quote and assert fee text --
                await waitForSwapQuoteReady(driver);
                await assertCtaFeeText(driver);

                // -- Capture amounts before submission --
                const { fromAmount, toAmount } =
                  await captureSwapAmounts(driver);
                routeResult.fromAmount = fromAmount;
                routeResult.toAmount = toAmount;
                nextRouteFromAmount = toAmount;

                // -- Submit and wait for confirmed activity entry --
                await submitSwapAndWaitForConfirmed(
                  driver,
                  fromSymbol,
                  toSymbol,
                );

                // -- Assert activity list primary/secondary currency --
                await assertActivityPrimaryCurrency(
                  driver,
                  `-${fromAmount} ${fromSymbol}`,
                );
                await assertActivitySecondaryCurrency(
                  driver,
                  `+${toAmount} ${toSymbol}`,
                );

                // -- Open detail page --
                await openLatestSwapActivityRecord(
                  driver,
                  fromSymbol,
                  toSymbol,
                );

                // -- Assert detail page --
                await assertSwapDetailConfirmed(driver);
                await assertDetailRow(
                  driver,
                  'You sent',
                  `${fromAmount} ${fromSymbol}`,
                );
                await assertDetailRow(
                  driver,
                  'You received',
                  `${toAmount} ${toSymbol}`,
                );
                await assertGasFeeRowPaidByMetaMask(driver);

                // -- Navigate back to home for next route --
                await navigateBackToHome(driver);

                routeResult.status = 'passed';
                console.log(`[TEST] ✅ Route passed: ${routeLabel}`);
              } catch (error) {
                routeResult.status = 'failed';
                routeResult.error = String(error);
                console.error(`[TEST] ❌ Route failed: ${routeLabel}`);
                console.error(error);

                // Reset entry flag so next route re-enters from home
                hasEnteredSwapFlow = false;
                const recovered = await recoverToHome(driver);
                if (!recovered) {
                  console.error(
                    `[TEST] Recovery failed after route ${routeLabel} — stopping suite`,
                  );
                  routeResults.push(routeResult);
                  break;
                }
              }

              routeResults.push(routeResult);
            }

            // ----------------------------------------------------------------
            // Step 6: Generate markdown execution report
            // ----------------------------------------------------------------
            try {
              generateSwapExecutionReport(routeResults, networkConfig);
            } catch (reportError) {
              console.warn(
                `[TEST] ⚠️  Failed to generate report:`,
                reportError,
              );
            }

            // Fail the test if any routes did not pass
            const failedRoutes = routeResults.filter(
              (r) => r.status === 'failed',
            );
            if (failedRoutes.length > 0) {
              throw new Error(
                `${failedRoutes.length}/${routeResults.length} swap route(s) failed: ${failedRoutes
                  .map((r) => r.route)
                  .join(', ')}`,
              );
            }
          },
        );
      });
    });
  });
});
