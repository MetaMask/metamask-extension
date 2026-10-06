import { useCallback, useSyncExternalStore } from 'react';
import { getActiveMfaFlow, subscribeToActiveMfaFlow } from './activeFlow';
import type { MfaFlow, MfaFlowState } from './types';

const noop = () => undefined;

/**
 * The running MFA flow and its state, for the screens that render it.
 *
 * @returns The flow and its state, or `undefined` when no flow runs.
 */
export const useActiveMfaFlow = ():
  | { flow: MfaFlow; state: MfaFlowState }
  | undefined => {
  const flow = useSyncExternalStore(subscribeToActiveMfaFlow, getActiveMfaFlow);
  const subscribe = useCallback(
    (listener: () => void) => (flow ? flow.subscribe(listener) : noop),
    [flow],
  );
  const state = useSyncExternalStore(subscribe, () => flow?.getState());
  return flow && state ? { flow, state } : undefined;
};
