import { Messenger } from '@metamask/messenger';
import type { TokensControllerState } from '@metamask/assets-controllers';
import type { RootMessenger } from '../../lib/messenger';
import { getIsAssetsUnifiedStateIncludedInBuild } from '../../../../shared/lib/environment';

export type TokensCompatState = {
  allTokens: TokensControllerState['allTokens'];
  allIgnoredTokens: TokensControllerState['allIgnoredTokens'];
  allDetectedTokens: TokensControllerState['allDetectedTokens'];
  tokens: unknown[];
  detectedTokens: unknown[];
  ignoredTokens: unknown[];
};

const EMPTY_TOKENS_STATE: TokensCompatState = {
  allTokens: {},
  allIgnoredTokens: {},
  allDetectedTokens: {},
  tokens: [],
  detectedTokens: [],
  ignoredTokens: [],
};

type CompatRootMessenger = {
  call: (actionType: string, ...args: unknown[]) => unknown;
};

const registeredRoots = new WeakSet<object>();

/**
 * Derive TokensController-shaped state from AssetsController so downstream
 * packages can keep calling TokensController:getState after TokensController
 * removal.
 *
 * Prefers `AssetsController:getStateForTransactionPay` (already shaped for
 * pay / allTokens), matching AccountTracker / TokenBalances compat shims.
 *
 * @param messenger - Root messenger used to read AssetsController state.
 * @returns Compat state with TokensController-shaped token maps.
 */
export function getTokensCompatState(
  messenger: CompatRootMessenger,
): TokensCompatState {
  if (!getIsAssetsUnifiedStateIncludedInBuild()) {
    return EMPTY_TOKENS_STATE;
  }

  try {
    const transactionPayState = messenger.call(
      'AssetsController:getStateForTransactionPay',
    ) as { allTokens?: TokensCompatState['allTokens'] } | undefined;
    return {
      ...EMPTY_TOKENS_STATE,
      allTokens: transactionPayState?.allTokens ?? {},
    };
  } catch {
    return EMPTY_TOKENS_STATE;
  }
}

/**
 * Register a TokensController:getState shim backed by AssetsController.
 * Idempotent per root messenger so multiple consumers can safely call this.
 *
 * @param messenger - The root messenger.
 */
export function registerTokensControllerGetStateCompat(
  messenger: RootMessenger,
): void {
  if (registeredRoots.has(messenger as object)) {
    return;
  }

  const compatMessenger = new Messenger({
    namespace: 'TokensController',
    parent: messenger,
  });
  // Namespace messenger has no built-in action types; register the compat getState.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (compatMessenger as any).registerActionHandler(
    'TokensController:getState',
    () => getTokensCompatState(messenger as unknown as CompatRootMessenger),
  );

  registeredRoots.add(messenger as object);
}
