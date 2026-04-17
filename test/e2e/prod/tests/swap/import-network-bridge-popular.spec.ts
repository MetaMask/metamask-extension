/**
 * Production E2E Test: Popular-Network Bridge Execution
 *
 * Executes two cross-network bridge operations via the swap UI:
 * 1) MON (Monad) -> USDC (Base), amount 20
 * 2) USDC (Base) -> MON (Monad), amount 0.5
 *
 * Validation goals:
 * - Activity shows Swap action and sent amount
 * - Activity status can be pending or confirmed (both accepted)
 * - Bridge details page is opened and validated (pending or confirmed/complete accepted)
 *
 * Notes:
 * - Route 2 must hard-fail if Base USDC is not available at runtime.
 * - This spec does not modify existing swap execution specs.
 */

import { Suite } from 'mocha';
import FixtureBuilder from '../../../fixtures/fixture-builder';
import { withProductionFixtures } from '../../helpers/prod-with-fixtures';
import { PROD_DELAYS } from '../../helpers/prod-test-helpers';
import { loginWithoutBalanceValidation } from '../../../page-objects/flows/login.flow';
import HomePage from '../../../page-objects/pages/home/homepage';
import NetworkManager from '../../../page-objects/pages/network-manager';
import AssetListPage from '../../../page-objects/pages/home/asset-list';
import { Driver } from '../../../webdriver/driver';
import { getRequiredE2EEnv } from '../../../helpers/e2e-env';
import { SwapRouteResult, SwapValidationResult } from './network-swap-config';
import { performSwapFlow } from './swap-quotation-helpers';
import {
  importSingleFundedAccount,
  waitForSwapQuoteReady,
  assertCtaFeeText,
  captureSwapAmounts,
  assertActivityPrimaryCurrency,
  assertDetailRow,
  navigateBackToHome,
  recoverToHome,
} from './swap-execution-helpers';

type BridgeRouteConfig = {
  label: string;
  sourceNetwork: string;
  destinationNetwork: string;
  fromSymbol: string;
  toSymbol: string;
  fromAmount: string;
  destinationAddress: string;
  hardFailOnInsufficientFunds?: boolean;
};

const BASE_CHAIN_ID_HEX = '0x2105';
const BASE_USDC_ADDRESS = '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913';
const BRIDGE_TO_SWAP_TRANSITION_TIMEOUT = 240000;
const INITIAL_ACTIVITY_LABEL_TIMEOUT = 120000;

const BRIDGE_ROUTES: BridgeRouteConfig[] = [
  {
    label: 'MON -> USDC (Monad -> Base)',
    sourceNetwork: 'Monad',
    destinationNetwork: 'Base',
    fromSymbol: 'MON',
    toSymbol: 'USDC',
    fromAmount: '20',
    destinationAddress: BASE_USDC_ADDRESS,
  },
  {
    label: 'USDC -> MON (Base -> Monad)',
    sourceNetwork: 'Base',
    destinationNetwork: 'Monad',
    fromSymbol: 'USDC',
    toSymbol: 'MON',
    fromAmount: '0.5',
    destinationAddress: 'MON',
    hardFailOnInsufficientFunds: true,
  },
];

async function selectPopularNetwork(
  driver: Driver,
  networkName: string,
): Promise<void> {
  const networkManager = new NetworkManager(driver);
  const homePage = new HomePage(driver);
  const networkManagerCloseButton = '[data-testid="modal-header-close-button"]';

  await networkManager.openNetworkManager();

  // Try Popular first, fallback to Add if network is not in Popular.
  try {
    await networkManager.selectTab('Popular');
    try {
      await networkManager.checkNetworkIsSelected(networkName);
      await networkManager.closeNetworkManager();
    } catch (_error) {
      await networkManager.selectNetworkByName(networkName);
    }
  } catch (_error) {
    await networkManager.selectTab('Add');
    try {
      await networkManager.checkNetworkIsSelected(networkName);
      await networkManager.closeNetworkManager();
    } catch (_innerError) {
      await networkManager.selectNetworkByName(networkName);
    }
  }

  try {
    await driver.waitForSelector(networkManagerCloseButton, { timeout: 2000 });
    await driver.clickElement(networkManagerCloseButton);
  } catch (_error) {
    // Network selection usually closes the manager automatically.
  }

  await homePage.checkPageIsLoaded();
  await driver.delay(PROD_DELAYS.API_RESPONSE);
}

async function ensureBaseUsdcImported(driver: Driver): Promise<void> {
  await selectPopularNetwork(driver, 'Base');

  const assetListPage = new AssetListPage(driver);
  await driver.clickElement('[data-testid="account-overview__asset-tab"]');
  await driver.delay(PROD_DELAYS.API_RESPONSE);

  try {
    await assetListPage.checkTokenExistsInList('USDC');
    return;
  } catch (_error) {
    // Token is not visible yet; import it by known Base mainnet contract.
  }

  console.log('[TEST] Importing Base USDC token...');
  await assetListPage.importCustomTokenByChain(
    BASE_CHAIN_ID_HEX,
    BASE_USDC_ADDRESS,
  );
  await driver.delay(PROD_DELAYS.TOKEN_BALANCE_UPDATE);
  await assetListPage.checkTokenExistsInList('USDC');
}

async function assertNoInsufficientFunds(
  driver: Driver,
  routeLabel: string,
): Promise<void> {
  const insufficientSelector = {
    css: '[data-testid="bridge-cta-button"]',
    text: 'Insufficient funds',
  };

  try {
    await driver.waitForSelector(insufficientSelector, { timeout: 4000 });
    throw new Error(
      `Hard failure for ${routeLabel}: Insufficient funds shown for route execution`,
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('Hard failure for')) {
      throw error;
    }
    // Selector not found within timeout means no insufficient-funds block.
  }
}

async function assertActivityHasAcceptedStatus(driver: Driver): Promise<string> {
  const acceptedStatuses = ['pending', 'confirmed'];

  for (const status of acceptedStatuses) {
    try {
      await driver.waitForSelector(
        {
          css: '[data-testid="transaction-status-label"]',
          text: status,
        },
        { timeout: 3000 },
      );
      return status;
    } catch (_error) {
      // Try next accepted status.
    }
  }

  // Fallback for alternate bridge pending style.
  const pendingBridgeStatus = '.bridge-transaction-details__segment--pending';
  try {
    await driver.waitForSelector(pendingBridgeStatus, { timeout: 3000 });
    return 'pending';
  } catch (_error) {
    throw new Error(
      'Activity status did not show an accepted value (pending or confirmed)',
    );
  }
}

async function submitBridgeAndWaitForActivity(
  driver: Driver,
  route: BridgeRouteConfig,
): Promise<{ transitionToSwap: boolean; activityLabel: string }> {
  const bridgedLabel = `Bridged to ${route.destinationNetwork}`;
  const swapLabel = `Swap ${route.fromSymbol} to ${route.toSymbol}`;

  console.log(
    `[EXEC] Submitting bridge and waiting for activity. Initial labels: "${bridgedLabel}" or "${swapLabel}"`,
  );
  await driver.clickElement('[data-testid="bridge-cta-button"]');

  // Allow the transaction to be submitted before returning home.
  await driver.delay(PROD_DELAYS.API_RESPONSE * 2);
  await recoverToHome(driver);

  await driver.clickElement('[data-testid="account-overview__activity-tab"]');

  let initialLabelFound = '';
  try {
    await driver.waitForSelector({ tag: 'p', text: bridgedLabel }, {
      timeout: INITIAL_ACTIVITY_LABEL_TIMEOUT,
    });
    initialLabelFound = bridgedLabel;
    console.log(`[EXEC] Activity appeared as: "${bridgedLabel}"`);
  } catch (_error) {
    try {
      await driver.waitForSelector({ tag: 'p', text: swapLabel }, {
        timeout: INITIAL_ACTIVITY_LABEL_TIMEOUT,
      });
      initialLabelFound = swapLabel;
      console.log(`[EXEC] Activity appeared directly as: "${swapLabel}"`);
    } catch (_innerError) {
      throw new Error(
        `No expected activity label appeared within ${INITIAL_ACTIVITY_LABEL_TIMEOUT}ms. ` +
          `Expected "${bridgedLabel}" or "${swapLabel}"`,
      );
    }
  }

  if (initialLabelFound === swapLabel) {
    return { transitionToSwap: true, activityLabel: swapLabel };
  }

  console.log(
    `[EXEC] Waiting for Bridged->Swap transition: "${swapLabel}" (timeout: ${BRIDGE_TO_SWAP_TRANSITION_TIMEOUT}ms)`,
  );
  try {
    await driver.waitForSelector({ tag: 'p', text: swapLabel }, {
      timeout: BRIDGE_TO_SWAP_TRANSITION_TIMEOUT,
    });
    console.log('[EXEC] ✅ Activity transitioned from Bridged to Swap');
    return { transitionToSwap: true, activityLabel: swapLabel };
  } catch (_error) {
    console.warn(
      `[EXEC] ⚠️  ALERT: Activity did not transition from Bridged to Swap within ${BRIDGE_TO_SWAP_TRANSITION_TIMEOUT}ms. Proceeding to Bridge details validation.`,
    );
    return { transitionToSwap: false, activityLabel: bridgedLabel };
  }
}

async function openLatestBridgeActivityRecord(
  driver: Driver,
  route: BridgeRouteConfig,
): Promise<void> {
  const normalize = (value: string) =>
    value.replace(/\s+/gu, ' ').trim().toUpperCase();
  const expectedFrom = normalize(route.fromSymbol);
  const expectedTo = normalize(route.toSymbol);
  const expectedDestinationNetwork = normalize(route.destinationNetwork);

  await driver.waitForSelector('[data-testid="activity-list-item-action"]');
  const activityRows = await driver.findElements(
    '[data-testid="activity-list-item-action"]',
  );

  let clicked = false;
  for (const row of activityRows) {
    const text = normalize(await row.getText());
    const isSwapMatch =
      text.includes('SWAP') &&
      text.includes(expectedFrom) &&
      text.includes(expectedTo);
    const isBridgeMatch =
      text.includes('BRIDGED TO') && text.includes(expectedDestinationNetwork);

    if (isSwapMatch || isBridgeMatch) {
      console.log(
        `[EXEC] Opening matching activity row for bridge route: "${text}"`,
      );
      await row.click();
      clicked = true;
      break;
    }
  }

  if (!clicked) {
    const swapLabel = `Swap ${route.fromSymbol} to ${route.toSymbol}`;
    const bridgedLabel = `Bridged to ${route.destinationNetwork}`;

    try {
      await driver.clickElement({ tag: 'p', text: swapLabel });
    } catch (_error) {
      await driver.clickElement({ tag: 'p', text: bridgedLabel });
    }
  }

  await driver.waitForUrlContaining({ url: '/cross-chain/tx-details' });
}

async function getDetailRowText(
  driver: Driver,
  rowLabel: string,
): Promise<string> {
  const xpath = `//*[@data-testid="transaction-detail-row"]/p[text()='${rowLabel}']/..`;
  const rowEl = await driver.findElement({ xpath });
  return await rowEl.getText();
}

async function assertBridgeDetailsPage(
  driver: Driver,
  route: BridgeRouteConfig,
  fromAmount: string,
): Promise<{ status: string; details: string[] }> {
  await driver.waitForUrlContaining({ url: '/cross-chain/tx-details' });
  await driver.waitForSelector({ text: 'Bridge details' });

  const detailMessages: string[] = [];

  const statusElement = await driver.findElement(
    '[data-testid="bridge-transaction-details-tx-status"]',
  );
  const statusText = (await statusElement.getText()).trim().toLowerCase();
  const acceptedStatuses = ['pending', 'confirmed', 'complete'];
  if (!acceptedStatuses.includes(statusText)) {
    throw new Error(
      `Bridge details status is not accepted. Got "${statusText}", expected pending/confirmed/complete`,
    );
  }
  detailMessages.push(`Status: ${statusText}`);

  const bridgingRowText = await getDetailRowText(driver, 'Bridging');
  if (
    !bridgingRowText.includes(route.sourceNetwork) ||
    !bridgingRowText.includes(route.destinationNetwork)
  ) {
    throw new Error(
      `Bridging row mismatch. Got "${bridgingRowText}", expected to include "${route.sourceNetwork}" and "${route.destinationNetwork}"`,
    );
  }
  detailMessages.push(`Bridging row: ${bridgingRowText}`);

  const timeStampRowText = await getDetailRowText(driver, 'Time stamp');
  const timeStampValue = timeStampRowText
    .replace(/\bTime stamp\b/gu, '')
    .trim();
  if (!timeStampValue) {
    throw new Error('Time stamp value is empty on Bridge details page');
  }
  detailMessages.push(`Time stamp: ${timeStampValue}`);

  await assertDetailRow(driver, 'You sent', `${fromAmount} ${route.fromSymbol}`);
  detailMessages.push(`You sent includes: ${fromAmount} ${route.fromSymbol}`);

  const receivedRowText = await getDetailRowText(driver, 'You received');
  if (!receivedRowText.includes(route.toSymbol)) {
    throw new Error(
      `You received row mismatch. Expected token ${route.toSymbol}, got "${receivedRowText}"`,
    );
  }
  detailMessages.push(`You received row: ${receivedRowText}`);

  const gasFeeRowText = await getDetailRowText(driver, 'Total gas fee');
  const gasFeeValue = gasFeeRowText.replace(/\bTotal gas fee\b/gu, '').trim();
  if (!gasFeeValue) {
    throw new Error('Total gas fee value is empty on Bridge details page');
  }
  detailMessages.push(`Total gas fee: ${gasFeeValue}`);

  return {
    status: statusText,
    details: detailMessages,
  };
}

describe('Production E2E: Popular Network Bridge Execution', function (this: Suite) {
  this.timeout(900000);

  it('executes MON->USDC and USDC->MON cross-network bridge operations', async function () {
    const routeResults: SwapRouteResult[] = [];

    await withProductionFixtures(
      {
        fixtures: new FixtureBuilder().withNetworkControllerOnMonad().build(),
        title:
          this.test?.fullTitle() ||
          'Popular network bridge execution (MON<->Base USDC)',
        extendedTimeoutMultiplier: 2,
      },
      async ({ driver }: { driver: Driver }) => {
        console.log(`\n${'='.repeat(80)}`);
        console.log('[TEST] Starting popular-network bridge execution test');
        console.log(`${'='.repeat(80)}\n`);

        console.log('[TEST] Logging in to wallet...');
        await loginWithoutBalanceValidation(driver);
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await driver.delay(PROD_DELAYS.API_RESPONSE);

        console.log('[TEST] Importing funded account (PRIVATE_KEY_FROM)...');
        const privateKeyFrom = getRequiredE2EEnv('PRIVATE_KEY_FROM');
        await importSingleFundedAccount(driver, privateKeyFrom);

        console.log('[TEST] Ensuring Base USDC token is imported...');
        await ensureBaseUsdcImported(driver);

        // Return to Monad for route 1 start.
        await selectPopularNetwork(driver, 'Monad');

        for (const route of BRIDGE_ROUTES) {
          const routeResult: SwapRouteResult = {
            route: route.label,
            fromSymbol: route.fromSymbol,
            toSymbol: route.toSymbol,
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

          console.log(`\n[TEST] ── Route: ${route.label} ──`);

          try {
            console.log(
              `[TEST] Selecting source network: ${route.sourceNetwork}`,
            );
            await selectPopularNetwork(driver, route.sourceNetwork);
            recordValidation('Source network selected', 'passed', route.sourceNetwork);

            await performSwapFlow(driver, {
              sourceTokenSymbol: route.fromSymbol,
              destinationTokenAddress: route.destinationAddress,
              destinationTokenSymbol: route.toSymbol,
              fromAmount: route.fromAmount,
            });
            recordValidation('Swap flow configured', 'passed');

            if (route.hardFailOnInsufficientFunds) {
              await assertNoInsufficientFunds(driver, route.label);
              recordValidation('No insufficient funds', 'passed');
            }

            await waitForSwapQuoteReady(driver);
            recordValidation('Quote ready', 'passed');

            await assertCtaFeeText(driver);
            recordValidation('CTA fee text', 'passed');

            const { fromAmount, toAmount } = await captureSwapAmounts(driver);
            routeResult.fromAmount = fromAmount;
            routeResult.toAmount = toAmount;

            const activityTransitionResult = await submitBridgeAndWaitForActivity(
              driver,
              route,
            );
            if (activityTransitionResult.transitionToSwap) {
              recordValidation(
                'Activity transition Bridged->Swap',
                'passed',
                `Activity label reached Swap for ${route.fromSymbol} -> ${route.toSymbol}`,
              );
            } else {
              recordValidation(
                'Activity transition Bridged->Swap',
                'warning',
                `ALERT: Activity label did not transition to Swap within ${BRIDGE_TO_SWAP_TRANSITION_TIMEOUT}ms`,
              );
            }

            await assertActivityPrimaryCurrency(
              driver,
              `-${fromAmount} ${route.fromSymbol}`,
            );
            recordValidation(
              'Activity amount',
              'passed',
              `-${fromAmount} ${route.fromSymbol}`,
            );

            const activityStatus = await assertActivityHasAcceptedStatus(driver);
            recordValidation('Activity status', 'passed', activityStatus);

            await openLatestBridgeActivityRecord(driver, route);
            recordValidation('Activity record opened', 'passed');

            const detailResult = await assertBridgeDetailsPage(
              driver,
              route,
              fromAmount,
            );
            recordValidation(
              'Bridge details validated',
              'passed',
              detailResult.details.join(' | '),
            );

            await navigateBackToHome(driver);

            routeResult.status = 'passed';
            console.log(`[TEST] ✅ Route passed: ${route.label}`);
          } catch (error) {
            routeResult.status = 'failed';
            routeResult.error = String(error);
            recordValidation('Route execution error', 'failed', String(error));
            console.error(`[TEST] ❌ Route failed: ${route.label}`);
            console.error(error);

            const recovered = await recoverToHome(driver);
            if (!recovered) {
              routeResults.push(routeResult);
              break;
            }
          }

          routeResults.push(routeResult);
        }

        const failedRoutes = routeResults.filter((r) => r.status === 'failed');
        if (failedRoutes.length > 0) {
          throw new Error(
            `${failedRoutes.length}/${routeResults.length} bridge route(s) failed: ${failedRoutes
              .map((r) => r.route)
              .join(', ')}`,
          );
        }
      },
    );
  });
});
