import { createProjectLogger } from '@metamask/utils';
import type { AccountGroupId } from '@metamask/account-api';

const log = createProjectLogger('account-group-asset-loader');

/**
 * Safety cap on how long a surface is kept in its loading state. The underlying
 * fetch is not cancelled when this elapses — it is left to settle so it can
 * still commit its results and so a retry is never racing it. Only the pending
 * flag is cleared, so a hung data source cannot pin a skeleton forever.
 */
export const ACCOUNT_GROUP_ASSET_FETCH_TIMEOUT_MS = 5000;

/**
 * Account groups whose assets have been requested at least once this session.
 *
 * Loads are cached per session rather than per mount: assets land in controller
 * state, so once a group has been fetched the ordinary selectors keep serving
 * it. Re-fetching on every mount would add latency for no benefit.
 *
 * An entry is only removed when a fetch is known to have failed, which happens
 * after the underlying promise settles — never on timeout — so a retry can
 * never overlap a fetch that is still running.
 */
const requestedGroupIds = new Set<string>();

/** Groups with a fetch currently in flight, for loading UI. */
const pendingGroupIds = new Set<string>();

const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) {
    listener();
  }
}

/**
 * Subscribe to changes in the set of in-flight account group asset fetches.
 *
 * @param listener - Called after any group transitions in or out of pending.
 * @returns Unsubscribe function.
 */
export function subscribeToAccountGroupAssetLoads(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Whether an asset fetch is currently in flight for the given account group.
 *
 * @param accountGroupId - Account group to check, if any.
 * @returns True while a fetch for that group is in flight.
 */
export function isAccountGroupAssetLoadPending(
  accountGroupId?: AccountGroupId | string,
): boolean {
  return (
    Boolean(accountGroupId) && pendingGroupIds.has(accountGroupId as string)
  );
}

/**
 * Whether this account group has already been requested this session.
 *
 * @param accountGroupId - Account group to check.
 * @returns True when a load was already started for the group.
 */
export function hasRequestedAccountGroupAssets(
  accountGroupId: AccountGroupId | string,
): boolean {
  return requestedGroupIds.has(accountGroupId);
}

function clearPending(groupIds: string[]) {
  let changed = false;

  for (const groupId of groupIds) {
    changed = pendingGroupIds.delete(groupId) || changed;
  }

  if (changed) {
    emit();
  }
}

/**
 * Marks account groups as requested + pending, then runs `loadAssets`. Clears
 * pending when the load settles or after {@link ACCOUNT_GROUP_ASSET_FETCH_TIMEOUT_MS}.
 * Failed groups are removed from the requested set so a later attempt can retry.
 *
 * @param accountGroupIds - Groups being loaded.
 * @param loadAssets - Imperative asset/balance refresh for those groups.
 */
export async function runAccountGroupAssetLoad(
  accountGroupIds: string[],
  loadAssets: () => Promise<void>,
): Promise<void> {
  const newGroupIds = accountGroupIds.filter(
    (groupId) => groupId && !requestedGroupIds.has(groupId),
  );

  if (newGroupIds.length === 0) {
    return;
  }

  for (const groupId of newGroupIds) {
    requestedGroupIds.add(groupId);
    pendingGroupIds.add(groupId);
  }
  emit();

  const succeeded = Promise.resolve()
    .then(() => loadAssets())
    .then(
      () => true,
      (error: unknown) => {
        log('Failed to load assets for account groups', {
          groupIds: newGroupIds,
          error,
        });
        return false;
      },
    );

  const timeoutId = setTimeout(() => {
    log('Account group asset fetch exceeded timeout', {
      groupIds: newGroupIds,
    });
    clearPending(newGroupIds);
  }, ACCOUNT_GROUP_ASSET_FETCH_TIMEOUT_MS);

  try {
    if (!(await succeeded)) {
      for (const groupId of newGroupIds) {
        requestedGroupIds.delete(groupId);
      }
    }
  } finally {
    clearTimeout(timeoutId);
    clearPending(newGroupIds);
  }
}

/** Test-only: clears session dedupe and pending state. */
export function resetAccountGroupAssetLoaderForTests() {
  requestedGroupIds.clear();
  pendingGroupIds.clear();
  listeners.clear();
}
