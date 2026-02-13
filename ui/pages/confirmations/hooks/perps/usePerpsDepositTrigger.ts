import type {
  PerpsDepositFlowOptions,
  PerpsDepositFlowResponse,
  PerpsDepositFlowResult,
} from './usePerpsDepositFlow';
import { usePerpsDepositFlow } from './usePerpsDepositFlow';

export type PerpsDepositTriggerResponse = PerpsDepositFlowResponse;
export type PerpsDepositTriggerOptions = Omit<
  PerpsDepositFlowOptions,
  'navigateOnCreate'
>;
export type PerpsDepositTriggerResult = PerpsDepositFlowResult;

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
  return usePerpsDepositFlow({
    ...options,
    navigateOnCreate: true,
  });
}
