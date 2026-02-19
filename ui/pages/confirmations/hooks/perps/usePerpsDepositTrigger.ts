import type {
  PerpsDepositConfirmationOptions,
  PerpsDepositConfirmationResult,
} from './usePerpsDepositConfirmation';
import { usePerpsDepositConfirmation } from './usePerpsDepositConfirmation';

type UsePerpsDepositTriggerOptions = Omit<
  PerpsDepositConfirmationOptions,
  'navigateOnCreate'
>;

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
  options: UsePerpsDepositTriggerOptions = {},
): PerpsDepositConfirmationResult {
  return usePerpsDepositConfirmation({
    ...options,
    navigateOnCreate: true,
  });
}
