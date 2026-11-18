import {
  RampsController,
  RampsEnvironment,
  RampsOrderStatus,
  getDefaultRampsControllerState,
  type RampsControllerMessenger,
} from '@metamask/ramps-controller';
import type { OnboardingControllerState } from '../controllers/onboarding';
import type { PreferencesControllerState } from '../controllers/preferences-controller';
import { removeStalePrecreatedOrders } from '../lib/ramps-stale-order-cleanup';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../shared/constants/metametrics';
import { createEventBuilder } from '../../../shared/lib/analytics/create-event-builder';
import { getRampsEnvironment } from '../../../shared/lib/ramps/environment';
import {
  isRampsNetworkAllowed,
  type RampsNetworkAccessState,
} from '../../../shared/lib/ramps/network-access';
import { trace } from '../../../shared/lib/trace';
import { captureException } from '../../../shared/lib/sentry';
import { trackEvent } from '../controllers/analytics';
import type { MessengerClientInitFunction } from './types';
import { getRampsControllerApi } from './ramps-controller-api';
import type { RampsControllerInitMessenger } from './messengers/ramps-controller-messenger';

function getRampsNetworkAccessState(
  initMessenger: RampsControllerInitMessenger,
): RampsNetworkAccessState {
  const { completedOnboarding } = initMessenger.call(
    'OnboardingController:getState',
  );
  const { useExternalServices } = initMessenger.call(
    'PreferencesController:getState',
  );

  return { completedOnboarding, useExternalServices };
}

/**
 * Statuses where the user has committed to a purchase and is waiting on the
 * provider to settle.
 *
 * Deliberately narrower than "not terminal". `PRECREATED` and `UNKNOWN` stubs
 * may never resolve — see `removeStalePrecreatedOrders`, where the API "can
 * neither complete nor expire" them — so counting those as in-flight would keep
 * the poll alive forever. Worse, it would be self-sustaining: `lifecycleStarted`
 * would never clear, so `startRampsLifecycle` would short-circuit on every
 * later call and the cleanup that prunes those very stubs would never run
 * again. Leaving them out lets polling stop, which lets the cleanup run.
 */
const IN_FLIGHT_ORDER_STATUSES = new Set<string>([
  RampsOrderStatus.Created,
  RampsOrderStatus.Pending,
]);

/**
 * Cache lifetime for ramps requests in non-production builds. The controller
 * defaults to 15 minutes, which makes manual gate/privacy testing wait out the
 * cache before it can observe a request.
 */
const NON_PRODUCTION_REQUEST_CACHE_TTL_MS = 60_000;

function hasInFlightOrders(messengerClient: RampsController): boolean {
  return (messengerClient.state?.orders ?? []).some((order) =>
    IN_FLIGHT_ORDER_STATUSES.has(order.status),
  );
}

function createRampsLifecycleManager(
  messengerClient: RampsController,
  isPollingAllowed: () => boolean,
) {
  let lifecycleStarted = false;
  let lifecycleRunId = 0;

  const startRampsLifecycle = (): void => {
    if (lifecycleStarted) {
      return;
    }
    lifecycleStarted = true;
    const runId = lifecycleRunId;

    messengerClient
      .init()
      .then(() => {
        if (runId !== lifecycleRunId || !isPollingAllowed()) {
          return;
        }
        removeStalePrecreatedOrders(messengerClient);
        messengerClient.startOrderPolling();
      })
      .catch((error) => {
        if (runId !== lifecycleRunId) {
          return;
        }
        lifecycleStarted = false;
        console.error('RampsController failed to initialize', error);
      });
  };

  const stopRampsLifecycle = (): void => {
    lifecycleRunId += 1;
    messengerClient.stopOrderPolling();
    lifecycleStarted = false;
  };

  /**
   * Stop requested because the last UI window closed.
   *
   * Ramps checkout deliberately runs with no UI open — that is the whole reason
   * the callback watcher lives in the background (see
   * `app/scripts/lib/ramps/checkout-watch.ts`). Providers then take minutes to
   * settle, so the PENDING -> COMPLETED transition lands squarely in the window
   * where nothing would be polling, leaving the order showing its callback-time
   * snapshot until the user next opens the wallet. Keep polling while an order
   * is still in flight, the same way pending transactions keep polling while
   * the UI is closed. A revoked network gate still stops immediately.
   */
  const stopRampsLifecycleWhenSettled = (): void => {
    if (isPollingAllowed() && hasInFlightOrders(messengerClient)) {
      return;
    }
    stopRampsLifecycle();
  };

  return {
    startRampsLifecycle,
    stopRampsLifecycle,
    stopRampsLifecycleWhenSettled,
  };
}

function registerRampsLifecycleSubscriptions(
  initMessenger: RampsControllerInitMessenger,
  tryStartRampsLifecycle: () => void,
  tryStopRampsLifecycle: () => void,
): void {
  initMessenger.subscribe(
    'OnboardingController:stateChange',
    (state: OnboardingControllerState) => {
      if (state.completedOnboarding) {
        tryStartRampsLifecycle();
      } else {
        tryStopRampsLifecycle();
      }
    },
  );

  initMessenger.subscribe(
    'PreferencesController:stateChange',
    (state: PreferencesControllerState) => {
      if (state.useExternalServices) {
        tryStartRampsLifecycle();
      } else {
        tryStopRampsLifecycle();
      }
    },
  );
}

/**
 * Initialize the RampsController.
 *
 * Network hydration (`init`) is deferred until onboarding is complete and basic
 * functionality (`useExternalServices`) is enabled, matching Perps eligibility
 * and token-detection gating.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.persistedState - The persisted state to hydrate from.
 * @param request.initMessenger - Messenger for onboarding and preferences state.
 * @param request.platform
 * @returns The initialized controller and background API.
 */
export const RampsControllerInit: MessengerClientInitFunction<
  RampsController,
  RampsControllerMessenger,
  RampsControllerInitMessenger
> = ({ controllerMessenger, persistedState, initMessenger, platform }) => {
  const isNetworkAccessAllowed = () =>
    isRampsNetworkAllowed(getRampsNetworkAccessState(initMessenger));

  const messengerClient = new RampsController({
    messenger: controllerMessenger,
    state: persistedState.RampsController ?? getDefaultRampsControllerState(),
    // Keep the 15-minute default in production; shorten it in test builds so
    // gate/privacy checks can observe a fresh request without waiting it out.
    requestCacheTTL:
      getRampsEnvironment() === RampsEnvironment.Production
        ? undefined
        : NON_PRODUCTION_REQUEST_CACHE_TTL_MS,
    // Host gate: the controller does not call the ramps API until onboarding is
    // complete and basic functionality is enabled. Read cached state to render.
    isNetworkAccessAllowed,
    // @ts-expect-error Controller uses string for names rather than enum
    trace,
    onOrderSyncErroneousSituation: (situationMessage, sentryContext) => {
      captureException(
        new Error(`Ramps order sync - ${situationMessage}`),
        sentryContext,
      );
      trackEvent(
        createEventBuilder(MetaMetricsEventName.ProfileActivityUpdated)
          .addCategory(MetaMetricsEventCategory.BackupAndSync)
          .addProperties({
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            feature_name: 'Backup And Sync',
            action: 'Ramps Order Sync Erroneous Situation',
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            additional_description: situationMessage,
          })
          .build(),
      );
    },
  });

  const {
    startRampsLifecycle,
    stopRampsLifecycle,
    stopRampsLifecycleWhenSettled,
  } = createRampsLifecycleManager(messengerClient, isNetworkAccessAllowed);

  const tryStartRampsLifecycle = (): void => {
    if (isNetworkAccessAllowed()) {
      startRampsLifecycle();
    }
  };

  const tryStopRampsLifecycle = (): void => {
    if (!isNetworkAccessAllowed()) {
      stopRampsLifecycle();
    }
  };

  tryStartRampsLifecycle();
  registerRampsLifecycleSubscriptions(
    initMessenger,
    tryStartRampsLifecycle,
    tryStopRampsLifecycle,
  );

  return {
    messengerClient,
    api: {
      ...getRampsControllerApi(messengerClient, platform),
      startRampsLifecycle: tryStartRampsLifecycle,
      // Called by `stopNetworkRequests` when the last UI window closes.
      stopRampsLifecycle: stopRampsLifecycleWhenSettled,
    },
  };
};
