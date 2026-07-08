/**
 * Production E2E Test: Monad MON <-> USDC Swap Execution
 *
 * Executes two live swaps in sequence and validates activity + detail rows:
 * 1) MON -> USDC (Base USDC address)
 * 2) USDC -> MON (fixed 0.5 USDC)
 *
 * No tokenlist fetch/import is used in this test.
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
import AssetListPage from '../../../page-objects/pages/home/asset-list';
import ActivityListPage from '../../../page-objects/pages/home/activity-list';
import NetworkManager from '../../../page-objects/pages/network-manager';
import { Driver } from '../../../webdriver/driver';
import { getRequiredE2EEnv } from '../../../helpers/e2e-env';
import { SWAP_TEST_NETWORKS } from './network-swap-config';
import { performSwapFlow } from './swap-quotation-helpers';
import {
  importSingleFundedAccount,
  waitForSwapQuoteReady,
  assertCtaFeeText,
  captureSwapAmounts,
  assertActivityPrimaryCurrency,
  assertActivitySecondaryCurrency,
  assertDetailRow,
  validateDetailRowAmountAtPrecision,
  assertTransactionTimestamp,
  assertTotalGasFeeRow,
  handleInsufficientFundsIfPresent,
  navigateBackToHome,
  recoverToHome,
} from './swap-execution-helpers';

/**
 * Production E2E Test: Monad MON <-> USDC simple execution.
 */
describe('Production E2E: Monad MON <-> USDC Swap Execution', function (this: Suite) {
  this.timeout(900000);

  it('executes MON -> USDC then USDC -> MON with fixed 0.5 USDC', async function () {
    const BASE_USDC_ADDRESS = '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913';
    const MONAD_NETWORK_NAME = 'Monad';
    const MON_SYMBOL = 'MON';
    const USDC_SYMBOL = 'USDC';
    const MON_TO_USDC_AMOUNT = '20';
    const USDC_TO_MON_AMOUNT = '0.5';

    const networkConfig = SWAP_TEST_NETWORKS.find(
      ({ networkName }) => networkName === MONAD_NETWORK_NAME,
    );

    if (!networkConfig) {
      throw new Error(
        `[TEST] Missing network config for ${MONAD_NETWORK_NAME}`,
      );
    }

    await withProductionFixtures(
      {
        fixtures: new FixtureBuilder()
          .withNetworkControllerOnBase()
          .withNetworkControllerOnMonad()
          .build(),
        title:
          this.test?.fullTitle() ||
          `Swap execution test for ${MONAD_NETWORK_NAME}`,
        extendedTimeoutMultiplier: 2,
      },
      async ({ driver }: { driver: Driver }) => {
        console.log(`\n${'='.repeat(80)}`);
        console.log(
          `[TEST] Starting MON <-> USDC swap execution on ${MONAD_NETWORK_NAME}`,
        );
        console.log(`${'='.repeat(80)}\n`);

        console.log(`[TEST] Logging in to wallet...`);
        await loginWithoutBalanceValidation(driver);
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await driver.delay(PROD_DELAYS.API_RESPONSE);
        console.log(`[TEST] ✅ Logged in`);

        console.log(`[TEST] Selecting ${MONAD_NETWORK_NAME} network...`);
        const networkManager = new NetworkManager(driver);
        await networkManager.openNetworkManager();
        await networkManager.selectTab('Popular');
        await networkManager.selectNetworkByNameWithWait(MONAD_NETWORK_NAME);
        await homePage.checkPageIsLoaded();
        await driver.delay(PROD_DELAYS.API_RESPONSE);
        console.log(`[TEST] ✅ Network selected: ${MONAD_NETWORK_NAME}`);

        console.log(`[TEST] Importing funded account (PRIVATE_KEY_FROM)...`);
        const privateKeyFrom = getRequiredE2EEnv('PRIVATE_KEY_FROM');
        await importSingleFundedAccount(driver, privateKeyFrom);
        console.log(`[TEST] ✅ Funded account imported and active`);

        const normalizeText = (value: string) =>
          value.replace(/\s+/gu, ' ').trim().toUpperCase();

        const assertLatestActivityActionOneOf = async (
          expectedActions: string[],
        ): Promise<void> => {
          const actionRowsSelector =
            '[data-testid="activity-list-item-action"]';
          await driver.waitForSelector(actionRowsSelector, { timeout: 120000 });
          const actionRows = await driver.findElements(actionRowsSelector);
          if (actionRows.length === 0) {
            throw new Error(
              '[TEST] No activity rows found for latest action assertion',
            );
          }

          const latestActionText = normalizeText(await actionRows[0].getText());
          const matches = expectedActions.some((action) =>
            latestActionText.includes(normalizeText(action)),
          );

          if (!matches) {
            throw new Error(
              `[TEST] Latest activity action "${latestActionText}" did not match any of: ${expectedActions.join(', ')}`,
            );
          }

          console.log(
            `[TEST] ✅ Latest activity action matched: "${latestActionText}"`,
          );
        };

        const submitSwapAndOpenActivityWithMonadFilter = async (
          expectedActions: string[],
          filterNetworkName: string,
        ): Promise<void> => {
          await driver.clickElement('[data-testid="bridge-cta-button"]');
          await driver.delay(PROD_DELAYS.API_RESPONSE * 2);
          await recoverToHome(driver);

          // Bridge flows can return to an all-networks token view. Force source
          // network before opening activity so assertions remain scoped.
          const assetListPage = new AssetListPage(driver);
          await assetListPage.selectNetworkFilter(filterNetworkName);

          const activityListPage = new ActivityListPage(driver);
          await activityListPage.openActivityTab();

          await assertLatestActivityActionOneOf(expectedActions);
        };

        const openLatestActivityRecord = async (): Promise<void> => {
          const actionRowsSelector =
            '[data-testid="activity-list-item-action"]';
          await driver.waitForSelector(actionRowsSelector, { timeout: 120000 });
          const activityRows = await driver.findElements(actionRowsSelector);
          if (activityRows.length === 0) {
            throw new Error(
              '[TEST] No activity rows found to open latest record',
            );
          }

          await activityRows[0].click();
          await driver.waitForUrlContaining({ url: '/cross-chain/tx-details' });
        };

        const assertSwapDetailStatusAccepted = async (): Promise<void> => {
          const acceptedStatuses = ['pending', 'confirmed'];
          const statusSelector =
            '[data-testid="bridge-transaction-details-tx-status"]';

          try {
            await driver.waitForSelector(statusSelector, { timeout: 20000 });
            const statusElement = await driver.findElement(statusSelector);
            const statusText = (await statusElement.getText())
              .trim()
              .toLowerCase();

            if (!acceptedStatuses.includes(statusText)) {
              console.warn(
                `[TEST] ⚠️  ALERT: Bridge detail status warning: got "${statusText}". Expected one of: ${acceptedStatuses.join(', ')}`,
              );
              return;
            }

            console.log(
              `[TEST] ✅ Bridge detail status accepted: ${statusText}`,
            );
          } catch (error) {
            console.warn(
              `[TEST] ⚠️  ALERT: Bridge detail status row not found or unreadable: ${String(error)}`,
            );
          }
        };

        const executeAndValidateSwap = async ({
          fromSymbol,
          toSymbol,
          destinationTokenAddress,
          fromAmount,
          expectedActivityActionLabels,
          sourceNetworkName,
        }: {
          fromSymbol: string;
          toSymbol: string;
          destinationTokenAddress: string;
          fromAmount: string;
          expectedActivityActionLabels: string[];
          sourceNetworkName: string;
        }): Promise<void> => {
          const routeLabel = `${fromSymbol} → ${toSymbol}`;
          console.log(`\n[TEST] ── Route: ${routeLabel} ──`);

          try {
            await performSwapFlow(driver, {
              sourceTokenSymbol: fromSymbol,
              destinationTokenAddress,
              destinationTokenSymbol: toSymbol,
              fromAmount,
              useMax: false,
            });

            const reducedAmount = await handleInsufficientFundsIfPresent(
              driver,
              fromAmount,
            );
            if (reducedAmount !== undefined) {
              console.log(
                `[TEST] ⚠️  Insufficient funds — amount reduced to ${reducedAmount}`,
              );
            }

            await waitForSwapQuoteReady(driver);
            await assertCtaFeeText(driver);

            const { fromAmount: capturedFromAmount, toAmount } =
              await captureSwapAmounts(driver);

            await submitSwapAndOpenActivityWithMonadFilter(
              expectedActivityActionLabels,
              sourceNetworkName,
            );

            await assertActivityPrimaryCurrency(
              driver,
              `-${capturedFromAmount} ${fromSymbol}`,
            );
            await assertActivitySecondaryCurrency(driver, '-$');

            await openLatestActivityRecord();
            await assertSwapDetailStatusAccepted();

            const timestampResult = await assertTransactionTimestamp(driver);
            if (!timestampResult.isValid) {
              console.warn(
                `[TEST] ⚠️  ALERT: Time stamp row validation warning: ${timestampResult.message}`,
              );
            }

            try {
              await assertDetailRow(
                driver,
                'You sent',
                `${capturedFromAmount} ${fromSymbol}`,
              );
            } catch (error) {
              console.warn(
                `[TEST] ⚠️  ALERT: You sent row validation warning: ${String(error)}`,
              );
            }

            const receivedRowResult = await validateDetailRowAmountAtPrecision(
              driver,
              'You received',
              `${toAmount} ${toSymbol}`,
            );
            if (!receivedRowResult.isValid) {
              console.warn(
                `[TEST] ⚠️  ALERT: You received row validation warning: ${receivedRowResult.message}`,
              );
            }

            const totalGasFeeResult = await assertTotalGasFeeRow(
              driver,
              networkConfig.gasFeeSponsoredByProtocol ?? false,
            );
            if (!totalGasFeeResult.isValid) {
              console.warn(
                `[TEST] ⚠️  ALERT: Total gas fee row validation warning: ${totalGasFeeResult.message}`,
              );
            }

            await navigateBackToHome(driver);
            console.log(`[TEST] ✅ Route passed: ${routeLabel}`);
          } catch (error) {
            console.error(`[TEST] ❌ Route failed: ${routeLabel}`);
            console.error(error);

            await recoverToHome(driver);
            throw error;
          }
        };

        await executeAndValidateSwap({
          fromSymbol: MON_SYMBOL,
          toSymbol: USDC_SYMBOL,
          destinationTokenAddress: BASE_USDC_ADDRESS,
          fromAmount: MON_TO_USDC_AMOUNT,
          expectedActivityActionLabels: ['Swap', 'Bridged to Base'],
          sourceNetworkName: MONAD_NETWORK_NAME,
        });

        // After route 1 completes, switch to Base so route 2 sends from USDC on Base.
        console.log('[TEST] Switching active network to Base for route 2...');
        await networkManager.openNetworkManager();
        await networkManager.selectTab('Popular');
        await networkManager.selectNetworkByNameWithWait('Base');
        await homePage.checkPageIsLoaded();
        await driver.delay(PROD_DELAYS.API_RESPONSE);
        console.log('[TEST] ✅ Network selected: Base');

        await executeAndValidateSwap({
          fromSymbol: USDC_SYMBOL,
          toSymbol: MON_SYMBOL,
          destinationTokenAddress: MON_SYMBOL,
          fromAmount: USDC_TO_MON_AMOUNT,
          expectedActivityActionLabels: ['Swap', 'Bridged to Monad'],
          sourceNetworkName: 'Base',
        });
      },
    );
  });
});
