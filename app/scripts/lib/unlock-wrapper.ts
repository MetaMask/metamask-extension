/**
 * Utility to wrap methods that require the wallet to be unlocked.
 * If the wallet is locked, it will trigger the unlock prompt and wait for unlock.
 */

import type { AppStateController } from '../controllers/app-state-controller';
import type { KeyringController } from '@metamask/keyring-controller';

/**
 * Wraps a function to ensure the wallet is unlocked before execution.
 * If locked, triggers the unlock prompt and waits for the user to unlock.
 *
 * @param fn - The function to wrap
 * @param getUnlockPromise - Function to get the unlock promise from AppStateController
 * @param isUnlocked - Function to check if the wallet is unlocked
 * @returns A wrapped function that waits for unlock before executing
 */
export function withUnlockPrompt<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  getUnlockPromise: (shouldShowUnlockRequest: boolean) => Promise<void>,
  isUnlocked: () => boolean,
): T {
  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    if (!isUnlocked()) {
      await getUnlockPromise(true);
    }

    return fn(...args);
  }) as T;
}

/**
 * Creates wrapped versions of signature/decrypt/encryption methods
 * that wait for unlock before processing.
 *
 * @param options - Configuration options
 * @param options.appStateController - The AppStateController instance
 * @param options.keyringController - The KeyringController instance
 * @returns Object containing wrapped methods
 */
export function createUnlockedMethodWrappers({
  appStateController,
  keyringController,
}: {
  appStateController: AppStateController;
  keyringController: KeyringController;
}) {
  const getUnlockPromise =
    appStateController.getUnlockPromise.bind(appStateController);
  const isUnlocked = () => keyringController.state.isUnlocked;

  return {
    /**
     * Wraps a method to ensure unlock before execution
     *
     * @param fn - The function to wrap
     * @returns Wrapped function
     */
    wrapWithUnlock: <T extends (...args: any[]) => Promise<any>>(fn: T): T => {
      return withUnlockPrompt(fn, getUnlockPromise, isUnlocked);
    },
  };
}
