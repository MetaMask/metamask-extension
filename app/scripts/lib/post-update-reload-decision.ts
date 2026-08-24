/**
 * Tracks internal UI connection attempts for the current background lifetime.
 */
export type PostUpdateReloadDecisionTracker = {
  recordInternalUiConnectionAttempt: () => void;
  hasInternalUiConnectionAttempt: () => boolean;
  waitForInternalUiConnectionAttempt: (timeoutMs: number) => Promise<boolean>;
};

type ConnectionWaiter = {
  resolve: (connected: boolean) => void;
  timeout: ReturnType<typeof setTimeout>;
};

/**
 * Creates an in-memory tracker for internal UI connection attempts.
 *
 * @returns A tracker scoped to the current background lifetime.
 */
export function createPostUpdateReloadDecisionTracker(): PostUpdateReloadDecisionTracker {
  let hasInternalUiConnectionAttempt = false;
  const connectionWaiters = new Set<ConnectionWaiter>();

  return {
    recordInternalUiConnectionAttempt: () => {
      if (hasInternalUiConnectionAttempt) {
        return;
      }

      hasInternalUiConnectionAttempt = true;
      for (const waiter of connectionWaiters) {
        clearTimeout(waiter.timeout);
        waiter.resolve(true);
      }
      connectionWaiters.clear();
    },
    hasInternalUiConnectionAttempt: () => hasInternalUiConnectionAttempt,
    waitForInternalUiConnectionAttempt: (timeoutMs) => {
      if (hasInternalUiConnectionAttempt) {
        return Promise.resolve(true);
      }

      return new Promise((resolve) => {
        const waiter: ConnectionWaiter = {
          resolve,
          timeout: setTimeout(() => {
            connectionWaiters.delete(waiter);
            resolve(false);
          }, timeoutMs),
        };
        connectionWaiters.add(waiter);
      });
    },
  };
}
