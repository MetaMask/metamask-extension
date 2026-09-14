import { Messenger } from '@metamask/messenger';
import type { RootMessenger } from '../../lib/messenger';
import { getIsAssetsUnifiedStateIncludedInBuild } from '../../../../shared/lib/environment';

export type AccountTrackerCompatState = {
  accountsByChainId: Record<
    string,
    Record<
      string,
      {
        balance: string;
        stakedBalance?: string;
      }
    >
  >;
};

const EMPTY_ACCOUNT_TRACKER_STATE: AccountTrackerCompatState = {
  accountsByChainId: {},
};

type CompatRootMessenger = {
  call: (actionType: string, ...args: unknown[]) => unknown;
};

const registeredRoots = new WeakSet<object>();

/**
 * Derive AccountTrackerController-shaped state from AssetsController so
 * downstream packages can keep calling AccountTrackerController:getState after
 * AccountTrackerController removal.
 *
 * Prefers `AssetsController:getStateForTransactionPay` when available (already
 * shaped for pay / native balances).
 *
 * @param messenger - Root messenger used to read AssetsController state.
 * @returns Compat state with `accountsByChainId`.
 */
export function getAccountTrackerCompatState(
  messenger: CompatRootMessenger,
): AccountTrackerCompatState {
  if (!getIsAssetsUnifiedStateIncludedInBuild()) {
    return EMPTY_ACCOUNT_TRACKER_STATE;
  }

  try {
    const transactionPayState = messenger.call(
      'AssetsController:getStateForTransactionPay',
    ) as AccountTrackerCompatState | undefined;
    return {
      accountsByChainId: transactionPayState?.accountsByChainId ?? {},
    };
  } catch {
    return EMPTY_ACCOUNT_TRACKER_STATE;
  }
}

/**
 * Register an AccountTrackerController:getState shim backed by AssetsController.
 * Idempotent per root messenger so multiple consumers can safely call this.
 *
 * @param messenger - The root messenger.
 */
export function registerAccountTrackerGetStateCompat(
  messenger: RootMessenger,
): void {
  if (registeredRoots.has(messenger as object)) {
    return;
  }

  const compatMessenger = new Messenger({
    namespace: 'AccountTrackerController',
    parent: messenger,
  });
  // Namespace messenger has no built-in action types; register the compat getState.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (compatMessenger as any).registerActionHandler(
    'AccountTrackerController:getState',
    () =>
      getAccountTrackerCompatState(messenger as unknown as CompatRootMessenger),
  );

  registeredRoots.add(messenger as object);
}
