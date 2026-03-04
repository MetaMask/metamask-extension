/**
 * Perps Controller Facade (Phase 2)
 *
 * Phase 2: No streaming methods are forwarded to a UI-side controller.
 * All streaming data flows through background notifications →
 * PerpsStreamManager.handleBackgroundUpdate() → React hooks.
 *
 * This facade delegates all method calls to the background controller
 * via submitRequestToBackground('perpsX', [args]).
 *
 * State reads should still use Redux selectors from ui/selectors/perps-controller.ts.
 */

import type { PerpsController } from '@metamask/perps-controller';
import { PERPS_API_METHOD_MAP } from '../../../shared/constants/perps-api';
import { submitRequestToBackground } from '../../store/background-connection';

/**
 * Methods that the facade handles specially rather than auto-delegating.
 * - init: wired explicitly
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
 * Creates a facade for the PerpsController that delegates all calls to the
 * background via submitRequestToBackground. No UI-side streaming controller
 * is needed — all stream data arrives via perpsStreamUpdate notifications.
 *
 * @param _streamingController - Unused in Phase 2 (pass null)
 * @returns An object compatible with PerpsController for UI use
 */
export function createPerpsControllerFacade(
  _streamingController: PerpsController | null,
): PerpsController {
  const facade = {
    get state() {
      return {} as PerpsController['state'];
    },

    init: createDelegateMethod<void>('perpsInit'),

    disconnect: createDelegateMethod<void>('perpsDisconnect'),

    depositWithConfirmation: async (...args: unknown[]) => {
      const transactionId = await submitRequestToBackground<string | null>(
        'perpsDepositWithConfirmation',
        args,
      );
      return transactionId;
    },
  } as Record<string, unknown>;

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
