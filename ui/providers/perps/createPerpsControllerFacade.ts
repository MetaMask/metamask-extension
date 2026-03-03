/**
 * Perps Controller Facade (Option B)
 *
 * Wraps the UI-side streaming PerpsController so that:
 * Streaming methods (subscribeToPositions, subscribeToPrices, etc.) are forwarded
 * to the real controller (callbacks stay UI-side).
 * All other methods (placeOrder, updateMargin, getPositions, etc.) delegate to
 * the background controller via submitRequestToBackground('perpsX', [args]).
 *
 * This allows UI code to call controller.placeOrder(...) instead of
 * submitRequestToBackground('perpsPlaceOrder', [...]). State reads should still
 * use Redux selectors from ui/selectors/perps-controller.ts.
 */

import type { PerpsController } from '@metamask/perps-controller';
import { PERPS_API_METHOD_MAP } from '../../../shared/constants/perps-api';
import { submitRequestToBackground } from '../../store/background-connection';

const STREAMING_METHODS = [
  'subscribeToPositions',
  'subscribeToOrders',
  'subscribeToAccount',
  'subscribeToPrices',
  'subscribeToOrderBook',
  'subscribeToOrderFills',
  'subscribeToCandles',
] as const;

/**
 * Methods that the facade handles specially rather than auto-delegating.
 * - init: wired explicitly at facade construction
 * - disconnect: forwarded to the UI streaming controller, not the background
 * - depositWithConfirmation: custom return-value handling
 */
const FACADE_SPECIAL_METHODS = new Set<string>([
  'init',
  'disconnect',
  'depositWithConfirmation',
]);

function createDelegateMethod<TResult>(
  actionName: string,
): (...args: unknown[]) => Promise<TResult> {
  return (...args: unknown[]) =>
    submitRequestToBackground<TResult>(actionName as 'perpsInit', args);
}

/**
 * Creates a facade around the streaming PerpsController. Streaming methods are
 * forwarded to the real controller; all other methods delegate to the background
 * via submitRequestToBackground.
 *
 * @param streamingController - The UI-side streaming controller instance
 * @returns An object compatible with PerpsController for UI use
 */
export function createPerpsControllerFacade(
  streamingController: PerpsController,
): PerpsController {
  const facade = {
    get state() {
      return streamingController.state;
    },

    get messenger() {
      return (streamingController as unknown as { messenger: unknown })
        .messenger;
    },

    init: createDelegateMethod<void>('perpsInit'),

    disconnect: () => streamingController.disconnect(),

    depositWithConfirmation: async (...args: unknown[]) => {
      const transactionId = await submitRequestToBackground<string | null>(
        'perpsDepositWithConfirmation',
        args,
      );
      return transactionId;
    },
  } as Record<string, unknown>;

  for (const method of STREAMING_METHODS) {
    const fn = (streamingController as unknown as Record<string, unknown>)[
      method
    ];
    if (typeof fn === 'function') {
      facade[method] = fn.bind(streamingController);
    }
  }

  for (const [methodName, actionName] of Object.entries(PERPS_API_METHOD_MAP)) {
    if (FACADE_SPECIAL_METHODS.has(methodName)) {
      continue;
    }
    if (facade[methodName] !== undefined) {
      continue;
    }
    facade[methodName] = createDelegateMethod(actionName);
  }

  return facade as unknown as PerpsController;
}
