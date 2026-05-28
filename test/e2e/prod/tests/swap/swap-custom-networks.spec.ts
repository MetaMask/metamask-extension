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
import { switchToEditRPCViaGlobalMenuNetworks } from '../../../page-objects/flows/network.flow';
import HomePage from '../../../page-objects/pages/home/homepage';
import NetworkManager from '../../../page-objects/pages/network-manager';
import SelectNetwork from '../../../page-objects/pages/dialog/select-network';
import AddEditNetworkModal from '../../../page-objects/pages/dialog/add-edit-network';
import AddNetworkRpcUrlModal from '../../../page-objects/pages/dialog/add-network-rpc-url';
import { Driver } from '../../../webdriver/driver';
import { getRequiredE2EEnv } from '../../../helpers/e2e-env';
import {
  getSwapCustomNetworks,
  DEFAULT_SWAP_AMOUNT,
  Token,
  SwapRouteResult,
  SwapValidationResult,
} from './network-swap-config';
import {
  importTokensFromTokenlist,
  importTokensIntoWallet,
  performSwapFlow,
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
  validateDetailRowAmountAtPrecision,
  assertSwappedTokenPair,
  assertTransactionTimestamp,
  assertTotalGasFeeRow,
  handleInsufficientFundsIfPresent,
  navigateBackToHome,
  recoverToHome,
  generateSwapExecutionReport,
} from './swap-execution-helpers';

/**
 * Production E2E Test: Custom Network Swap Execution (Parameterized)
 *
 * Parameterized test that runs for all custom networks configured with swap execution routes.
 * For each custom network:
 * 1. Adds the custom network via UI (SelectNetwork dialog -> AddCustomNetworkModal -> RpcUrlModal)
 * 2. Imports a funded account
 * 3. Imports ERC-20 tokens (manual or from tokenlist)
 * 4. Executes predefined swap routes sequentially
 * 5. Verifies each route with detailed assertions
 * 6. Generates a markdown execution report
 *
 * Prerequisites:
 * - PRIVATE_KEY_FROM in .env.e2e (funded account for swaps on custom networks)
 * - Real network connectivity to custom network RPC endpoints\n *
 * To add a new custom network for swap testing:
 * 1. Add network config to SWAP_TEST_NETWORKS with requiresManualSetup: true
 * 2. Define swapExecutionRoutes with from/to tokens and amounts
 * 3. Test will automatically run for that network
 */
describe('Production E2E: Custom Network Swap Execution (Parameterized)', function (this: Suite) {
  this.timeout(900000); // 15 minutes total for all routes

  // Get all custom networks that require manual setup
  const customNetworks = getSwapCustomNetworks();

  // Skip test suite if no custom networks are configured
  if (customNetworks.length === 0) {
    console.warn('[TEST] No custom networks configured for swap testing');
    return;
  }

  customNetworks.forEach((networkConfig) => {
    if (!networkConfig.swapExecutionRoutes?.length) {
      return; // skip networks not yet configured for execution tests
    }

    describe(`${networkConfig.networkName}`, function (this: Suite) {
      it(`should add network, import account, and execute swap routes for ${networkConfig.nativeTokenSymbol}`, async function () {
        // Collect per-route results for the final markdown report
        const routeResults: SwapRouteResult[] = [];
        const fixtureBuilder = new FixtureBuilder();
        const setupMethod =
          fixtureBuilder[
            networkConfig.fixtureSetupMethod as keyof typeof fixtureBuilder
          ];

        if (typeof setupMethod !== 'function') {
          throw new Error(
            `Invalid fixture setup method: ${networkConfig.fixtureSetupMethod}`,
          );
        }

        await withProductionFixtures(
          {
            fixtures: (setupMethod as () => FixtureBuilder)
              .call(fixtureBuilder)
              .build(),
            title:
              this.test?.fullTitle() ||
              `Swap execution test for ${networkConfig.networkName}`,
            extendedTimeoutMultiplier: 2,
          },
          async ({ driver }: { driver: Driver }) => {
            console.log(`\n${'='.repeat(80)}`);
            console.log(
              `[TEST] Starting custom network swap execution for ${networkConfig.networkName}`,
            );
            console.log(`${'='.repeat(80)}\n`);

            // ================================================================
            // Step 1: Login
            // ================================================================
            console.log(`[TEST] Logging in to wallet...`);
            await loginWithoutBalanceValidation(driver);
            const homePage = new HomePage(driver);
            await homePage.checkPageIsLoaded();
            await driver.delay(PROD_DELAYS.API_RESPONSE);
            console.log(`[TEST] ✅ Logged in`);

            // ================================================================
            // Step 2: Add Custom Network
            // ================================================================
            console.log(
              `[TEST] Adding custom network: ${networkConfig.networkName}...`,
            );
            await switchToEditRPCViaGlobalMenuNetworks(driver);

            const selectNetworkDialog = new SelectNetwork(driver);
            await selectNetworkDialog.checkPageIsLoaded();

            console.log(
              `[TEST] Opening Add Custom Network modal for ${networkConfig.networkName}...`,
            );
            await selectNetworkDialog.openAddCustomNetworkModal();

            console.log(`[TEST] Filling network details for ${networkConfig.networkName}...`);
            const addEditNetworkModal = new AddEditNetworkModal(driver);
            await addEditNetworkModal.checkPageIsLoaded();
            await addEditNetworkModal.fillNetworkNameInputField(
              networkConfig.networkName,
            );
            await addEditNetworkModal.fillNetworkChainIdInputField(
              networkConfig.chainId.toString(),
            );
            await addEditNetworkModal.fillCurrencySymbolInputField(
              networkConfig.nativeTokenSymbol,
            );
            await addEditNetworkModal.openAddRpcUrlModal();

            console.log(
              `[TEST] Adding RPC URL for ${networkConfig.networkName}: ${networkConfig.rpcUrl}`,
            );
            const addRpcUrlModal = new AddNetworkRpcUrlModal(driver);
            await addRpcUrlModal.checkPageIsLoaded();
            await driver.delay(PROD_DELAYS.RPC_RESPONSE * 2);
            await addRpcUrlModal.fillAddRpcUrlInput(networkConfig.rpcUrl as string);
            await addRpcUrlModal.fillAddRpcNameInput(networkConfig.rpcName as string);

            // Wait for RPC validation to complete
            console.log(`[TEST] Waiting for RPC validation for ${networkConfig.networkName}...`);
            await driver.delay(PROD_DELAYS.RPC_RESPONSE);

            await addRpcUrlModal.saveAddRpcUrl();

            console.log(`[TEST] Saving network ${networkConfig.networkName}...`);
            await addEditNetworkModal.saveEditedNetwork();

            // saveEditedNetwork() handles navigation back to home page automatically
            // Wait longer for the navigation and page state transitions
            console.log(
              `[TEST] Waiting for ${networkConfig.networkName} to be added and RPC to connect...`,
            );
            await driver.delay(PROD_DELAYS.RPC_RESPONSE * 3);

            console.log(`[TEST] ✅ Network ${networkConfig.networkName} added successfully`);

            // Wait for the home page to load with the new network
            console.log(`[TEST] Verifying home page is loaded with new network active...`);
            await homePage.checkPageIsLoaded();
            await driver.delay(PROD_DELAYS.API_RESPONSE);
            console.log(`[TEST] ✅ Home page is loaded`);
            // From wallet home, click on sort-by-networks button
            console.log(`[TEST] Opening network selector modal...`);
            const networksList = '[data-testid="sort-by-networks"]';
            await driver.clickElement(networksList);
            // Wait for dialog to appear
            await driver.waitForSelector('[role="dialog"]');
            console.log(`[TEST] Able to find network selector modal...`);
            // ================================================================
            // Select custom network from network selector
            // ================================================================

             const chainIdHex = networkConfig.chainId;
            const networkListItemSelector = `[data-testid="network-list-item-eip155:${chainIdHex}"]`;
            console.log(`[TEST] Clicking on network in list: ${networkListItemSelector}...`);
            await driver.clickElement(networkListItemSelector);
            await driver.delay(PROD_DELAYS.MODAL_TRANSITION);

            console.log(`[TEST] ✅ Network ${networkConfig.networkName} added successfully`);

            // ================================================================
            // Step 3: Import funded account
            // ================================================================
            console.log(`[TEST] Importing funded account (PRIVATE_KEY_FROM)...`);
            const privateKeyFrom = getRequiredE2EEnv('PRIVATE_KEY_FROM');
            await importSingleFundedAccount(driver, privateKeyFrom);
            console.log(`[TEST] ✅ Funded account imported and active`);

            // ----------------------------------------------------------------
            // Step 4: Resolve ERC-20 tokens to import.
            // When manualTokens is provided the config supplies exact contract
            // addresses — no tokenlist fetch is needed.  Otherwise tokens are
            // fetched from tokenlistUrl and resolved by symbol.
            // ----------------------------------------------------------------
            let resolvedTokens: Token[];

            if (networkConfig.manualTokens?.length) {
              console.log(
                `[TEST] Using manual token list for ${networkConfig.networkName}...`,
              );
              resolvedTokens = networkConfig.manualTokens.map((mt) => ({
                chainId: networkConfig.chainId,
                address: mt.address,
                name: mt.name ?? mt.symbol,
                symbol: mt.symbol,
                decimals: mt.decimals ?? 18,
              }));
            } else {
              console.log(
                `[TEST] Fetching tokenlist for ${networkConfig.networkName}...`,
              );
              const tokenlistTokens = await importTokensFromTokenlist(
                networkConfig.tokenlistUrl as string,
                networkConfig.chainId,
                50, // fetch up to 50 tokens so we can find symbols by name
              );
              const executionSymbols =
                networkConfig.swapExecutionTokenSymbols ?? [];
              resolvedTokens = resolveTokensBySymbols(
                tokenlistTokens,
                executionSymbols,
              );
            }

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
            // Step 5: Execute each route sequentially.
            // Amounts are route-configured (`route.amount`) unless `useMax`
            // is enabled for that route.
            // ----------------------------------------------------------------
            // swapExecutionRoutes is guaranteed non-empty (checked by the
            // outer guard: `if (!networkConfig.swapExecutionRoutes?.length)`)
            const executionRoutes = networkConfig.swapExecutionRoutes ?? [];

            for (const route of executionRoutes) {
              const { from: fromSymbol, to: toSymbol, amount, useMax } = route;
              const routeLabel = `${fromSymbol} → ${toSymbol}`;
              const plannedFromAmount = String(
                amount ??
                  networkConfig.defaultSwapAmount ??
                  DEFAULT_SWAP_AMOUNT,
              );
              const useMaxForRoute = Boolean(useMax);

              const routeResult: SwapRouteResult = {
                route: routeLabel,
                fromSymbol,
                toSymbol,
                fromAmount: '',
                toAmount: '',
                validations: [],
                status: 'failed',
              };

              const recordValidation = (
                name: string,
                status: SwapValidationResult['status'],
                details?: string,
              ) => {
                routeResult.validations?.push({ name, status, details });
              };

              // Resolve destination address.
              // For native token destination, use the symbol as the picker
              // search term (no contract address needed).
              const isToNative = toSymbol === networkConfig.nativeTokenSymbol;
              const destinationAddress = isToNative
                ? toSymbol
                : (tokenBySymbol.get(toSymbol)?.address ?? toSymbol);
              const destinationTokenNetworkName = isToNative
                ? networkConfig.networkName
                : undefined;

              console.log(`\n[TEST] ── Route: ${routeLabel} ──`);

              try {
                // -- Enter the swap page fresh from home for every route --
                console.log(
                  `[TEST] Entering swap flow for route: ${routeLabel}`,
                );
                await performSwapFlow(driver, {
                  sourceTokenSymbol: fromSymbol,
                  sourceTokenName: tokenBySymbol.get(fromSymbol)?.name,
                  networkName: networkConfig.networkName,
                  destinationTokenAddress: destinationAddress,
                  destinationTokenSymbol: toSymbol,
                  destinationTokenNetworkName,
                  fromAmount: plannedFromAmount,
                  useMax: useMaxForRoute,
                });

                // -- Wait for quote and assert fee text --
                // -- Check for ""Insufficient funds"" and auto-reduce to 75% --
                // Skip for Max routes (the Max button already uses full available balance).
                if (!useMaxForRoute) {
                  const reducedAmount = await handleInsufficientFundsIfPresent(
                    driver,
                    plannedFromAmount,
                  );
                  if (reducedAmount !== undefined) {
                    console.log(
                      `[TEST] ⚠️  Insufficient funds — amount reduced to ${reducedAmount}`,
                    );
                  }
                }

                // -- Wait for quote and assert fee text --
                await waitForSwapQuoteReady(driver);
                recordValidation('Quote ready', 'passed');
                await assertCtaFeeText(driver);
                recordValidation('CTA fee text', 'passed');

                // -- Capture amounts before submission --
                const { fromAmount, toAmount } =
                  await captureSwapAmounts(driver);
                routeResult.fromAmount = fromAmount;
                routeResult.toAmount = toAmount;

                // -- Submit and wait for confirmed activity entry --
                await submitSwapAndWaitForConfirmed(
                  driver,
                  fromSymbol,
                  toSymbol,
                );

                // -- Assert activity list primary/secondary currency --
                if (useMaxForRoute) {
                  // Max swaps can render rounded/truncated activity amounts,
                  // so validate by token symbol instead of exact raw amount.
                  await assertActivityPrimaryCurrency(
                    driver,
                    `${fromSymbol}`,
                  );
                } else {
                  await assertActivityPrimaryCurrency(
                    driver,
                    `-${fromAmount} ${fromSymbol}`,
                  );
                }
                recordValidation(
                  'Activity primary amount',
                  'passed',
                  useMaxForRoute
                    ? `contains ${fromSymbol} (max route)`
                    : `-${fromAmount} ${fromSymbol}`,
                );
                await assertActivitySecondaryCurrency(
                  driver,
                  `-${toAmount} ""$""`,
                );
                recordValidation(
                  'Activity secondary value',
                  'passed',
                  `-${toAmount} ""$""`,
                );

                // -- Open detail page --
                await openLatestSwapActivityRecord(
                  driver,
                  fromSymbol,
                  toSymbol,
                );

                // -- Assert detail page --
                await assertSwapDetailConfirmed(driver);
                recordValidation('Detail status confirmed', 'passed');

                const swappedRowResult = await assertSwappedTokenPair(
                  driver,
                  fromSymbol,
                  toSymbol,
                );
                recordValidation(
                  'Detail swapped row',
                  swappedRowResult.isValid ? 'passed' : 'warning',
                  swappedRowResult.message,
                );

                const timestampResult =
                  await assertTransactionTimestamp(driver);
                recordValidation(
                  'Detail time stamp row',
                  timestampResult.isValid ? 'passed' : 'warning',
                  timestampResult.message,
                );

                if (useMaxForRoute) {
                  await assertDetailRow(driver, 'You sent', fromSymbol);
                } else {
                  await assertDetailRow(
                    driver,
                    'You sent',
                    `${fromAmount} ${fromSymbol}`,
                  );
                }
                recordValidation(
                  'Detail You sent row',
                  'passed',
                  useMaxForRoute
                    ? `contains ${fromSymbol} (max route)`
                    : `${fromAmount} ${fromSymbol}`,
                );
                const receivedRowResult =
                  await validateDetailRowAmountAtPrecision(
                    driver,
                    'You received',
                    `${toAmount} ${toSymbol}`,
                  );
                recordValidation(
                  'Detail You received row',
                  receivedRowResult.isValid ? 'passed' : 'warning',
                  receivedRowResult.message,
                );
                if (!receivedRowResult.isValid) {
                  console.warn(
                    `[TEST] ⚠️  ALERT: ${receivedRowResult.message}`,
                  );
                }
                const totalGasFeeResult = await assertTotalGasFeeRow(
                  driver,
                  networkConfig.gasFeeSponsoredByProtocol ?? false,
                );
                recordValidation(
                  'Detail Total gas fee row',
                  totalGasFeeResult.isValid ? 'passed' : 'warning',
                  totalGasFeeResult.message,
                );

                // -- Navigate back to home for next route --
                await navigateBackToHome(driver);

                routeResult.status = 'passed';
                console.log(`[TEST] ✅ Route passed: ${routeLabel}`);
              } catch (error) {
                routeResult.status = 'failed';
                routeResult.error = String(error);
                recordValidation(
                  'Route execution error',
                  'failed',
                  String(error),
                );
                console.error(`[TEST] ❌ Route failed: ${routeLabel}`);
                console.error(error);

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
