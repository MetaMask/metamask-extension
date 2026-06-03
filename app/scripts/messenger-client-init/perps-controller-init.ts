import {
  PerpsController,
  type PerpsControllerMessenger as PackagePerpsControllerMessenger,
  type RawLedgerUpdate,
  type UserHistoryItem,
} from '@metamask/perps-controller';
import { SERVICE_NAME as STORAGE_SERVICE_NAME } from '@metamask/storage-service';
import type { MetaMetricsEventPayload } from '../../../shared/constants/metametrics';
import { createPerpsInfrastructure } from '../controllers/perps/infrastructure';
import { isBenignDisconnectError } from '../controllers/perps/perps-error-utils';
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
  const storageNamespace = 'PerpsController';
  const trackEvent = (payload: MetaMetricsEventPayload) => {
    controllerMessenger.call('MetaMetricsController:trackEvent', payload);
  };
  let isDisconnecting = false;
  const infrastructure = createPerpsInfrastructure({
    trackEvent,
    getStorageItem: (key: string) =>
      controllerMessenger.call(
        `${STORAGE_SERVICE_NAME}:getItem`,
        storageNamespace,
        key,
      ),
    setStorageItem: (key: string, value: string) =>
      controllerMessenger.call(
        `${STORAGE_SERVICE_NAME}:setItem`,
        storageNamespace,
        key,
        value,
      ),
    removeStorageItem: (key: string) =>
      controllerMessenger.call(
        `${STORAGE_SERVICE_NAME}:removeItem`,
        storageNamespace,
        key,
      ),
    isDisconnecting: () => isDisconnecting,
    getPerpsDiscountForAccount: (caipAccountId, baseFeeBips) =>
      controllerMessenger.call(
        'RewardsController:getPerpsDiscountForAccount',
        caipAccountId,
        baseFeeBips,
      ),
  });
  const fallbackBlockedRegions = getFallbackBlockedRegions();
  const hyperLiquidBuilderAddresses = getHyperLiquidBuilderAddresses();
  const completedOnboarding =
    persistedState.OnboardingController?.completedOnboarding ?? false;
  const useExternalServices =
    persistedState.PreferencesController?.useExternalServices ?? false;

  const messengerClient = new PerpsController({
    // TODO: Remove cast once @metamask/perps-controller adds
    // MetaMetricsController:trackEvent to its allowed-actions union.
    // The extension messenger is a superset of the package messenger type;
    // the cast is safe until the package type catches up.
    messenger: controllerMessenger as PackagePerpsControllerMessenger,
    state: persistedState.PerpsController,
    infrastructure,
    clientConfig: {
      fallbackHip3Enabled: true,
      // this is meant to align fallback behavior with the production default and prevent partial HIP-3 market hydration
      fallbackHip3AllowlistMarkets: ['xyz:*'],
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

  const api = getApi(
    messengerClient,
    () => {
      isDisconnecting = true;
    },
    () => {
      isDisconnecting = false;
    },
  );

  return { messengerClient, api };
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
  | 'perpsCalculateLiquidationPrice'
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
  | 'perpsIsWatchlistMarket'
  | 'perpsReconnect'
  | 'perpsGetConnectionState';

// TODO: These methods have custom signatures that don't match their controller
// counterparts. Once the controller package is updated to return the deposit
// transaction ID directly and expose getUserHistory as a proper controller
// method, these can be removed and the mapped type will cover them automatically.
type PerpsCustomApiNames =
  | 'perpsDepositWithConfirmation'
  | 'perpsGetUserHistory'
  | 'perpsGetUserNonFundingLedgerUpdates'
  | 'perpsGetConnectionState';

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
  perpsGetConnectionState: () => string;
};

/**
 * Returns true when the error proves the request never left the client.
 * Both codes are thrown before any frame is written to the socket, so
 * retrying is idempotent for reads and writes alike.
 * @param err
 */
function isPreSendInitError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  return (
    message.includes('CLIENT_NOT_INITIALIZED') ||
    message.includes('CLIENT_REINITIALIZING')
  );
}

/**
 * Core retry wrapper: calls `controller.init()` then retries once when
 * `shouldRetry` matches the thrown error.
 * @param controller
 * @param fn
 * @param shouldRetry
 */
function withAutoInit<TArgs extends unknown[], TResult>(
  controller: PerpsController,
  fn: (...args: TArgs) => TResult,
  shouldRetry: (err: unknown) => boolean,
): (...args: TArgs) => Promise<Awaited<TResult>> {
  return async (...args: TArgs): Promise<Awaited<TResult>> => {
    try {
      return await fn(...args);
    } catch (err) {
      if (shouldRetry(err)) {
        await controller.init();
        return await fn(...args);
      }
      throw err;
    }
  };
}

/**
 * Guard for read-only / idempotent methods.
 *
 * Retries on both pre-send init errors (`CLIENT_NOT_INITIALIZED` /
 * `CLIENT_REINITIALIZING`) and benign WS disconnect-race errors
 * (`TERMINATED_BY_USER`, in-flight queue drained on socket close).
 * Re-submitting a fetch after `init()` rebinds the provider is always safe.
 * @param controller
 * @param fn
 */
function guardRead<TArgs extends unknown[], TResult>(
  controller: PerpsController,
  fn: (...args: TArgs) => TResult,
) {
  return withAutoInit(
    controller,
    fn,
    (err) => isPreSendInitError(err) || isBenignDisconnectError(err),
  );
}

/**
 * Guard for write / mutation methods (orders, withdrawals, margin, deposits).
 *
 * Only retries on `CLIENT_NOT_INITIALIZED` / `CLIENT_REINITIALIZING`, which
 * are thrown *before* any frame reaches the broker.
 *
 * `WebSocketRequestError("WebSocket connection closed")` and
 * `TERMINATED_BY_USER` errors can be thrown *after* the request was written
 * to the socket. Retrying those could:
 * - Submit the same trade, withdrawal, or margin change twice.
 * - Submit against a different account if `init()` rebinds the provider.
 *
 * Benign disconnect-race errors are therefore intentionally excluded here.
 * @param controller
 * @param fn
 */
function guardWrite<TArgs extends unknown[], TResult>(
  controller: PerpsController,
  fn: (...args: TArgs) => TResult,
) {
  return withAutoInit(controller, fn, isPreSendInitError);
}

function getApi(
  messengerClient: PerpsController,
  onDisconnectStart: () => void,
  onDisconnectEnd: () => void,
): PerpsBackgroundApi {
  const read = <TArgs extends unknown[], TResult>(
    fn: (...args: TArgs) => TResult,
  ) => guardRead(messengerClient, fn);

  const write = <TArgs extends unknown[], TResult>(
    fn: (...args: TArgs) => TResult,
  ) => guardWrite(messengerClient, fn);

  return {
    // -- Lifecycle (no guard — IS the init itself) --
    perpsInit: messengerClient.init.bind(messengerClient),
    perpsDisconnect: async (
      ...args: Parameters<typeof messengerClient.disconnect>
    ) => {
      onDisconnectStart();
      try {
        return await messengerClient.disconnect(...args);
      } finally {
        onDisconnectEnd();
      }
    },

    // -- Trading mutations (write-guard: no benign-disconnect retry) --
    perpsPlaceOrder: write(messengerClient.placeOrder.bind(messengerClient)),
    perpsClosePosition: write(
      messengerClient.closePosition.bind(messengerClient),
    ),
    perpsClosePositions: write(
      messengerClient.closePositions.bind(messengerClient),
    ),
    perpsEditOrder: write(messengerClient.editOrder.bind(messengerClient)),
    perpsCancelOrder: write(messengerClient.cancelOrder.bind(messengerClient)),
    perpsCancelOrders: write(
      messengerClient.cancelOrders.bind(messengerClient),
    ),
    perpsUpdatePositionTPSL: write(
      messengerClient.updatePositionTPSL.bind(messengerClient),
    ),
    perpsUpdateMargin: write(
      messengerClient.updateMargin.bind(messengerClient),
    ),
    perpsFlipPosition: write(
      messengerClient.flipPosition.bind(messengerClient),
    ),
    perpsWithdraw: write(messengerClient.withdraw.bind(messengerClient)),
    perpsDepositWithConfirmation: write(
      async (
        ...args: Parameters<typeof messengerClient.depositWithConfirmation>
      ) => {
        await messengerClient.depositWithConfirmation(...args);
        // TODO: depositWithConfirmation should return the transaction ID
        // directly — that requires a controller package change.
        return messengerClient.state.lastDepositTransactionId;
      },
    ),

    // -- Withdrawal helpers --
    // validateWithdrawal is a read (no side effect on broker)
    perpsValidateWithdrawal: read(
      messengerClient.validateWithdrawal.bind(messengerClient),
    ),
    perpsGetWithdrawalRoutes:
      messengerClient.getWithdrawalRoutes.bind(messengerClient),
    // updateWithdrawalStatus / updateWithdrawalProgress post to the broker
    perpsUpdateWithdrawalStatus: write(
      messengerClient.updateWithdrawalStatus.bind(messengerClient),
    ),
    perpsUpdateWithdrawalProgress: write(
      messengerClient.updateWithdrawalProgress.bind(messengerClient),
    ),
    perpsGetWithdrawalProgress:
      messengerClient.getWithdrawalProgress.bind(messengerClient),

    // -- Data fetches (read-guard: init errors + benign disconnect) --
    perpsGetPositions: read(messengerClient.getPositions.bind(messengerClient)),
    perpsGetMarkets: read(messengerClient.getMarkets.bind(messengerClient)),
    perpsGetMarketDataWithPrices: read(
      messengerClient.getMarketDataWithPrices.bind(messengerClient),
    ),
    perpsGetOrderFills: read(
      messengerClient.getOrderFills.bind(messengerClient),
    ),
    perpsGetOrders: read(messengerClient.getOrders.bind(messengerClient)),
    perpsGetOpenOrders: read(
      messengerClient.getOpenOrders.bind(messengerClient),
    ),
    perpsGetFunding: read(messengerClient.getFunding.bind(messengerClient)),
    perpsGetAccountState: read(
      messengerClient.getAccountState.bind(messengerClient),
    ),
    perpsGetHistoricalPortfolio: read(
      messengerClient.getHistoricalPortfolio.bind(messengerClient),
    ),
    perpsFetchHistoricalCandles: read(
      messengerClient.fetchHistoricalCandles.bind(messengerClient),
    ),
    perpsCalculateFees: read(
      messengerClient.calculateFees.bind(messengerClient),
    ),
    perpsCalculateLiquidationPrice: read(
      messengerClient.calculateLiquidationPrice.bind(messengerClient),
    ),
    perpsGetAvailableDexs: read(
      messengerClient.getAvailableDexs.bind(messengerClient),
    ),

    // -- Eligibility (no guard — state-only) --
    perpsRefreshEligibility:
      messengerClient.refreshEligibility.bind(messengerClient),
    perpsStartEligibilityMonitoring:
      messengerClient.startEligibilityMonitoring.bind(messengerClient),
    perpsStopEligibilityMonitoring:
      messengerClient.stopEligibilityMonitoring.bind(messengerClient),

    // -- Toggle (no guard — handled by bridge) --
    perpsToggleTestnet: messengerClient.toggleTestnet.bind(messengerClient),

    // -- Preferences (no guard — never call getActiveProvider) --
    perpsSaveTradeConfiguration:
      messengerClient.saveTradeConfiguration.bind(messengerClient),
    perpsGetTradeConfiguration:
      messengerClient.getTradeConfiguration.bind(messengerClient),
    perpsSavePendingTradeConfiguration:
      messengerClient.savePendingTradeConfiguration.bind(messengerClient),
    perpsGetPendingTradeConfiguration:
      messengerClient.getPendingTradeConfiguration.bind(messengerClient),
    perpsClearPendingTradeConfiguration:
      messengerClient.clearPendingTradeConfiguration.bind(messengerClient),
    perpsSaveMarketFilterPreferences:
      messengerClient.saveMarketFilterPreferences.bind(messengerClient),
    perpsGetMarketFilterPreferences:
      messengerClient.getMarketFilterPreferences.bind(messengerClient),
    perpsSetSelectedPaymentToken:
      messengerClient.setSelectedPaymentToken.bind(messengerClient),
    perpsResetSelectedPaymentToken:
      messengerClient.resetSelectedPaymentToken.bind(messengerClient),
    perpsMarkTutorialCompleted:
      messengerClient.markTutorialCompleted.bind(messengerClient),
    perpsMarkFirstOrderCompleted:
      messengerClient.markFirstOrderCompleted.bind(messengerClient),
    perpsResetFirstTimeUserState:
      messengerClient.resetFirstTimeUserState.bind(messengerClient),
    perpsClearPendingTransactionRequests:
      messengerClient.clearPendingTransactionRequests.bind(messengerClient),
    perpsSaveOrderBookGrouping:
      messengerClient.saveOrderBookGrouping.bind(messengerClient),
    perpsGetOrderBookGrouping:
      messengerClient.getOrderBookGrouping.bind(messengerClient),

    // -- Provider passthrough (read-guard) --
    perpsGetUserHistory: read(
      async (params: {
        startTime?: number;
        endTime?: number;
        accountId?: `${string}:${string}:${string}`;
      }) => {
        return messengerClient.getActiveProvider().getUserHistory(params);
      },
    ),
    perpsGetUserNonFundingLedgerUpdates: read(
      async (params?: {
        startTime?: number;
        endTime?: number;
        accountId?: string;
      }) => {
        return messengerClient
          .getActiveProvider()
          .getUserNonFundingLedgerUpdates(params);
      },
    ),

    // -- Misc (no guard — state-only) --
    perpsClearDepositResult:
      messengerClient.clearDepositResult.bind(messengerClient),
    perpsClearWithdrawResult:
      messengerClient.clearWithdrawResult.bind(messengerClient),
    perpsGetBlockExplorerUrl:
      messengerClient.getBlockExplorerUrl.bind(messengerClient),
    perpsGetCurrentNetwork:
      messengerClient.getCurrentNetwork.bind(messengerClient),
    perpsIsFirstTimeUserOnCurrentNetwork:
      messengerClient.isFirstTimeUserOnCurrentNetwork.bind(messengerClient),
    perpsGetWatchlistMarkets:
      messengerClient.getWatchlistMarkets.bind(messengerClient),
    perpsToggleWatchlistMarket:
      messengerClient.toggleWatchlistMarket.bind(messengerClient),
    perpsIsWatchlistMarket:
      messengerClient.isWatchlistMarket.bind(messengerClient),

    // -- Connection health --
    perpsReconnect: messengerClient.reconnect.bind(messengerClient),
    perpsGetConnectionState: () =>
      messengerClient.getWebSocketConnectionState(),
  };
}
