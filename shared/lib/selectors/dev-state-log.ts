/**
 * Local debug harness that makes the asset selectors read a captured MetaMask
 * state log instead of the live background state, so the token list and the
 * aggregated balances can be reproduced against a real user's snapshot.
 *
 * This is a scratch tool, not a shipping feature. To point it at a different
 * export, change the import below. To turn it off, set `USE_STATE_LOG` to
 * false.
 */
import stateLog from '../../../state-logs.json';

type MetamaskSlice = Record<string, unknown>;

type RootState = { metamask?: MetamaskSlice };

/**
 * Off under Jest so unit tests keep running against their own fixtures.
 */
const USE_STATE_LOG = process.env.NODE_ENV !== 'test';

const stateLogMetamask = (stateLog as RootState).metamask ?? {};

/**
 * Reselect memoizes on input identity, so each source state has to map to one
 * stable overridden object. Overridden states map to themselves, which makes
 * the override idempotent when a wrapped selector composes another one.
 */
const overriddenStates = new WeakMap<RootState, RootState>();

/**
 * Overlays the state log's `metamask` slice onto a root state. Keys absent from
 * the log fall through to the live slice.
 *
 * @param state - The live root state.
 * @returns The root state with the state log applied.
 */
export function withStateLog<State extends RootState>(state: State): State {
  if (!USE_STATE_LOG || !state) {
    return state;
  }

  const cached = overriddenStates.get(state);
  if (cached) {
    return cached as State;
  }

  const overridden = {
    ...state,
    metamask: { ...state.metamask, ...stateLogMetamask },
  };
  overriddenStates.set(state, overridden);
  overriddenStates.set(overridden, overridden);

  return overridden as State;
}

/**
 * Wraps a selector so it — and everything it composes — receives the state log
 * instead of the live root state. Reselect's own properties (`resultFunc`,
 * `memoizedResultFunc`, ...) are carried over so the selector keeps its API.
 *
 * @param selector - The selector to feed the state log.
 * @returns The wrapped selector, or the original when the harness is off.
 */
export function fromStateLog<Selector extends (...args: never[]) => unknown>(
  selector: Selector,
): Selector {
  if (!USE_STATE_LOG) {
    return selector;
  }

  const wrapped = (state: RootState, ...args: unknown[]) =>
    (selector as unknown as (...selectorArgs: unknown[]) => unknown)(
      withStateLog(state),
      ...args,
    );

  return Object.assign(wrapped, selector) as unknown as Selector;
}
