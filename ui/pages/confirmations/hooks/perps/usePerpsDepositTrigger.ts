import type {
  PerpsDepositConfirmationOptions,
  PerpsDepositConfirmationResponse,
  PerpsDepositConfirmationResult,
} from './usePerpsDepositConfirmation';
import { usePerpsDepositConfirmation } from './usePerpsDepositConfirmation';

export type PerpsDepositTriggerResponse = PerpsDepositConfirmationResponse;
export type PerpsDepositTriggerOptions = Omit<
  PerpsDepositConfirmationOptions,
  'navigateOnCreate'
>;
export type PerpsDepositTriggerResult = PerpsDepositConfirmationResult;

/**
 * Pay/Confirmations-owned entrypoint for starting the Perps deposit confirmation flow.
 *
 * Encapsulates:
 * - transaction construction (perpsDeposit tx)
 * - routing into confirmations with the custom amount loader
 * - optional return routing after confirmation completes/cancels via router state
 *
 * @param options
 */
export function usePerpsDepositTrigger(
  options: PerpsDepositTriggerOptions = {},
): PerpsDepositTriggerResult {
  return usePerpsDepositConfirmation({
    ...options,
    navigateOnCreate: true,
  });
}
