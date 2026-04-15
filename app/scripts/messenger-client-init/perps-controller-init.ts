import {
  PerpsController,
  type PerpsControllerMessenger as PackagePerpsControllerMessenger,
  type RawLedgerUpdate,
  type UserHistoryItem,
} from '@metamask/perps-controller';
import type { MetaMetricsEventPayload } from '../../../shared/constants/metametrics';
import { createPerpsInfrastructure } from '../controllers/perps/infrastructure';
import { MessengerClientInitFunction } from './types';
import { PerpsControllerMessenger } from './messengers/perps-controller-messenger';

/**
 * Parse fallback blocked regions from MM_PERPS_BLOCKED_REGIONS env var.
 * Format: comma-separated region codes (e.g., "US,CA-ON,GB,BE").
 */
function getFallbackBlockedRegions(): string[] {
  const raw = process.env.MM_PERPS_BLOCKED_REGIONS;
  if (!raw || typeof raw !== 'string') {
    return [];
  }
  return raw
    .split(',')
    .map((r) => r.trim())
    .filter(Boolean);
}

/**
 * Read HyperLiquid builder fee wallet addresses from env vars.
 * Returns undefined when neither env var is set (package defaults apply).
 */
function getHyperLiquidBuilderAddresses():
  | { builderAddressMainnet?: string; builderAddressTestnet?: string }
  | undefined {
  const mainnet =
    process.env.MM_PERPS_HL_BUILDER_ADDRESS_MAINNET?.trim() || undefined;
  const testnet =
    process.env.MM_PERPS_HL_BUILDER_ADDRESS_TESTNET?.trim() || undefined;
  if (!mainnet && !testnet) {
    return undefined;
  }
  return {
    ...(mainnet ? { builderAddressMainnet: mainnet } : {}),
    ...(testnet ? { builderAddressTestnet: testnet } : {}),
  };
}

export const PerpsControllerInit: MessengerClientInitFunction<
  PerpsController,
  PerpsControllerMessenger
> = ({ controllerMessenger, persistedState }) => {
  const trackEvent = (payload: MetaMetricsEventPayload) => {
    controllerMessenger.call('MetaMetricsController:trackEvent', payload);
  };
  const infrastructure = createPerpsInfrastructure({ trackEvent });
  const fallbackBlockedRegions = getFallbackBlockedRegions();
  const hyperLiquidBuilderAddresses = getHyperLiquidBuilderAddresses();
  const completedOnboarding =
    persistedState.OnboardingController?.completedOnboarding ?? false;
  const useExternalServices =
    persistedState.PreferencesController?.useExternalServices ?? false;

  const controller = new PerpsController({
    // TODO: Remove cast once @metamask/perps-controller adds
    // MetaMetricsController:trackEvent to its allowed-actions union.
    // The extension messenger is a superset of the package messenger type;
    // the cast is safe until the package type catches up.
    messenger: controllerMessenger as PackagePerpsControllerMessenger,
    state: persistedState.PerpsController,
    infrastructure,
    clientConfig: {
      fallbackHip3Enabled: true,
      fallbackHip3AllowlistMarkets: [],
      fallbackBlockedRegions,
      ...(hyperLiquidBuilderAddresses
        ? {
            providerCredentials: {
              hyperliquid: hyperLiquidBuilderAddresses,
            },
          }
        : {}),
    },
    deferEligibilityCheck: !completedOnboarding || !useExternalServices,
  });

  const api = getApi(controller);

  return { controller, api };
};

/**
 * All background action names exposed by the Perps API.
 * TypeScript will error at the Record below if any name is missing from getApi().
 */
type PerpsActionName =
  | 'perpsInit'
  | 'perpsDisconnect'
  | 'perpsPlaceOrder'
  | 'perpsClosePosition'
  | 'perpsClosePositions'
  | 'perpsEditOrder'
  | 'perpsCancelOrder'
  | 'perpsCancelOrders'
  | 'perpsUpdatePositionTPSL'
  | 'perpsUpdateMargin'
  | 'perpsFlipPosition'
  | 'perpsWithdraw'
  | 'perpsValidateWithdrawal'
  | 'perpsGetWithdrawalRoutes'
  | 'perpsUpdateWithdrawalStatus'
  | 'perpsUpdateWithdrawalProgress'
  | 'perpsGetWithdrawalProgress'
  | 'perpsGetUserNonFundingLedgerUpdates'
  | 'perpsDepositWithConfirmation'
  | 'perpsGetPositions'
  | 'perpsGetMarkets'
  | 'perpsGetMarketDataWithPrices'
  | 'perpsGetOrderFills'
  | 'perpsGetOrders'
  | 'perpsGetOpenOrders'
  | 'perpsGetFunding'
  | 'perpsGetAccountState'
  | 'perpsGetHistoricalPortfolio'
  | 'perpsFetchHistoricalCandles'
  | 'perpsCalculateFees'
  | 'perpsGetAvailableDexs'
  | 'perpsRefreshEligibility'
  | 'perpsStartEligibilityMonitoring'
  | 'perpsStopEligibilityMonitoring'
  | 'perpsToggleTestnet'
  | 'perpsSaveTradeConfiguration'
  | 'perpsGetTradeConfiguration'
  | 'perpsSavePendingTradeConfiguration'
  | 'perpsGetPendingTradeConfiguration'
  | 'perpsClearPendingTradeConfiguration'
  | 'perpsSaveMarketFilterPreferences'
  | 'perpsGetMarketFilterPreferences'
  | 'perpsSetSelectedPaymentToken'
  | 'perpsResetSelectedPaymentToken'
  | 'perpsMarkTutorialCompleted'
  | 'perpsMarkFirstOrderCompleted'
  | 'perpsResetFirstTimeUserState'
  | 'perpsClearPendingTransactionRequests'
  | 'perpsSaveOrderBookGrouping'
  | 'perpsGetOrderBookGrouping'
  | 'perpsGetUserHistory'
  | 'perpsClearDepositResult'
  | 'perpsClearWithdrawResult'
  | 'perpsGetBlockExplorerUrl'
  | 'perpsGetCurrentNetwork'
  | 'perpsIsFirstTimeUserOnCurrentNetwork'
  | 'perpsGetWatchlistMarkets'
  | 'perpsToggleWatchlistMarket'
  | 'perpsIsWatchlistMarket';

// TODO: These methods have custom signatures that don't match their controller
// counterparts. Once the controller package is updated to return the deposit
// transaction ID directly and expose getUserHistory as a proper controller
// method, these can be removed and the mapped type will cover them automatically.
type PerpsCustomApiNames =
  | 'perpsDepositWithConfirmation'
  | 'perpsGetUserHistory'
  | 'perpsGetUserNonFundingLedgerUpdates';

type PerpsBackgroundApi = {
  [ActionName in Exclude<
    PerpsActionName,
    PerpsCustomApiNames
  >]: ActionName extends `perps${infer firstLetter}${infer remainingLetters}`
    ? `${Lowercase<firstLetter>}${remainingLetters}` extends keyof PerpsController
      ? PerpsController[`${Lowercase<firstLetter>}${remainingLetters}`]
      : never
    : never;
} & {
  perpsDepositWithConfirmation: (
    ...args: Parameters<PerpsController['depositWithConfirmation']>
  ) => Promise<string | null>;
  perpsGetUserHistory: (params: {
    startTime?: number;
    endTime?: number;
    accountId?: `${string}:${string}:${string}`;
  }) => Promise<UserHistoryItem[]>;
  perpsGetUserNonFundingLedgerUpdates: (params?: {
    startTime?: number;
    endTime?: number;
    accountId?: string;
  }) => Promise<RawLedgerUpdate[]>;
};

/**
 * Wrap a controller method so that CLIENT_NOT_INITIALIZED /
 * CLIENT_REINITIALIZING errors trigger `controller.init()` and a retry.
 *
 * During account switches, `perpsDisconnect → perpsInit` runs async.
 * Any provider-dependent call during that gap throws one of these errors.
 * This wrapper catches them once, re-initializes, and retries — making
 * every wrapped method self-healing without any UI-side awareness.
 * @param controller
 * @param fn
 */
function withAutoInit<TArgs extends unknown[], TResult>(
  controller: PerpsController,
  fn: (...args: TArgs) => TResult,
): (...args: TArgs) => Promise<Awaited<TResult>> {
  return async (...args: TArgs): Promise<Awaited<TResult>> => {
    try {
      return await fn(...args);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (
        message.includes('CLIENT_NOT_INITIALIZED') ||
        message.includes('CLIENT_REINITIALIZING')
      ) {
        await controller.init();
        return await fn(...args);
      }
      throw err;
    }
  };
}

function getApi(controller: PerpsController): PerpsBackgroundApi {
  const guard = <TArgs extends unknown[], TResult>(
    fn: (...args: TArgs) => TResult,
  ) => withAutoInit(controller, fn);

  return {
    // -- Lifecycle (no guard — IS the init itself) --
    perpsInit: controller.init.bind(controller),
    perpsDisconnect: controller.disconnect.bind(controller),

    // -- Trading mutations (guarded) --
    perpsPlaceOrder: guard(controller.placeOrder.bind(controller)),
    perpsClosePosition: guard(controller.closePosition.bind(controller)),
    perpsClosePositions: guard(controller.closePositions.bind(controller)),
    perpsEditOrder: guard(controller.editOrder.bind(controller)),
    perpsCancelOrder: guard(controller.cancelOrder.bind(controller)),
    perpsCancelOrders: guard(controller.cancelOrders.bind(controller)),
    perpsUpdatePositionTPSL: guard(
      controller.updatePositionTPSL.bind(controller),
    ),
    perpsUpdateMargin: guard(controller.updateMargin.bind(controller)),
    perpsFlipPosition: guard(controller.flipPosition.bind(controller)),
    perpsWithdraw: guard(controller.withdraw.bind(controller)),
    perpsValidateWithdrawal: guard(
      controller.validateWithdrawal.bind(controller),
    ),
    perpsGetWithdrawalRoutes: controller.getWithdrawalRoutes.bind(controller),
    perpsUpdateWithdrawalStatus: guard(
      controller.updateWithdrawalStatus.bind(controller),
    ),
    perpsUpdateWithdrawalProgress: guard(
      controller.updateWithdrawalProgress.bind(controller),
    ),
    perpsGetWithdrawalProgress:
      controller.getWithdrawalProgress.bind(controller),
    perpsDepositWithConfirmation: guard(
      async (
        ...args: Parameters<typeof controller.depositWithConfirmation>
      ) => {
        await controller.depositWithConfirmation(...args);
        // TODO: depositWithConfirmation should return the transaction ID
        // directly — that requires a controller package change.
        return controller.state.lastDepositTransactionId;
      },
    ),

    // -- Data fetches (guarded) --
    perpsGetPositions: guard(controller.getPositions.bind(controller)),
    perpsGetMarkets: guard(controller.getMarkets.bind(controller)),
    perpsGetMarketDataWithPrices: guard(
      controller.getMarketDataWithPrices.bind(controller),
    ),
    perpsGetOrderFills: guard(controller.getOrderFills.bind(controller)),
    perpsGetOrders: guard(controller.getOrders.bind(controller)),
    perpsGetOpenOrders: guard(controller.getOpenOrders.bind(controller)),
    perpsGetFunding: guard(controller.getFunding.bind(controller)),
    perpsGetAccountState: guard(controller.getAccountState.bind(controller)),
    perpsGetHistoricalPortfolio: guard(
      controller.getHistoricalPortfolio.bind(controller),
    ),
    perpsFetchHistoricalCandles: guard(
      controller.fetchHistoricalCandles.bind(controller),
    ),
    perpsCalculateFees: guard(controller.calculateFees.bind(controller)),
    perpsGetAvailableDexs: guard(controller.getAvailableDexs.bind(controller)),

    // -- Eligibility (no guard — state-only) --
    perpsRefreshEligibility: controller.refreshEligibility.bind(controller),
    perpsStartEligibilityMonitoring:
      controller.startEligibilityMonitoring.bind(controller),
    perpsStopEligibilityMonitoring:
      controller.stopEligibilityMonitoring.bind(controller),

    // -- Toggle (no guard — handled by bridge) --
    perpsToggleTestnet: controller.toggleTestnet.bind(controller),

    // -- Preferences (no guard — never call getActiveProvider) --
    perpsSaveTradeConfiguration:
      controller.saveTradeConfiguration.bind(controller),
    perpsGetTradeConfiguration:
      controller.getTradeConfiguration.bind(controller),
    perpsSavePendingTradeConfiguration:
      controller.savePendingTradeConfiguration.bind(controller),
    perpsGetPendingTradeConfiguration:
      controller.getPendingTradeConfiguration.bind(controller),
    perpsClearPendingTradeConfiguration:
      controller.clearPendingTradeConfiguration.bind(controller),
    perpsSaveMarketFilterPreferences:
      controller.saveMarketFilterPreferences.bind(controller),
    perpsGetMarketFilterPreferences:
      controller.getMarketFilterPreferences.bind(controller),
    perpsSetSelectedPaymentToken:
      controller.setSelectedPaymentToken.bind(controller),
    perpsResetSelectedPaymentToken:
      controller.resetSelectedPaymentToken.bind(controller),
    perpsMarkTutorialCompleted:
      controller.markTutorialCompleted.bind(controller),
    perpsMarkFirstOrderCompleted:
      controller.markFirstOrderCompleted.bind(controller),
    perpsResetFirstTimeUserState:
      controller.resetFirstTimeUserState.bind(controller),
    perpsClearPendingTransactionRequests:
      controller.clearPendingTransactionRequests.bind(controller),
    perpsSaveOrderBookGrouping:
      controller.saveOrderBookGrouping.bind(controller),
    perpsGetOrderBookGrouping: controller.getOrderBookGrouping.bind(controller),

    // -- Provider passthrough (guarded) --
    perpsGetUserHistory: guard(
      async (params: {
        startTime?: number;
        endTime?: number;
        accountId?: `${string}:${string}:${string}`;
      }) => {
        return controller.getActiveProvider().getUserHistory(params);
      },
    ),
    perpsGetUserNonFundingLedgerUpdates: guard(
      async (params?: {
        startTime?: number;
        endTime?: number;
        accountId?: string;
      }) => {
        return controller
          .getActiveProvider()
          .getUserNonFundingLedgerUpdates(params);
      },
    ),

    // -- Misc (no guard — state-only) --
    perpsClearDepositResult: controller.clearDepositResult.bind(controller),
    perpsClearWithdrawResult: controller.clearWithdrawResult.bind(controller),
    perpsGetBlockExplorerUrl: controller.getBlockExplorerUrl.bind(controller),
    perpsGetCurrentNetwork: controller.getCurrentNetwork.bind(controller),
    perpsIsFirstTimeUserOnCurrentNetwork:
      controller.isFirstTimeUserOnCurrentNetwork.bind(controller),
    perpsGetWatchlistMarkets: controller.getWatchlistMarkets.bind(controller),
    perpsToggleWatchlistMarket:
      controller.toggleWatchlistMarket.bind(controller),
    perpsIsWatchlistMarket: controller.isWatchlistMarket.bind(controller),
  };
}
