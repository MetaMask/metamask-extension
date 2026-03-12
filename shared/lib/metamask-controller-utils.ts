import { createDeferredPromise } from '@metamask/utils';
import { TransactionType } from '@metamask/transaction-controller';
import type { OnboardingControllerState } from '../types/onboarding';

/**
 * Minimal messenger shape needed for ensureOnboardingComplete.
 * Satisfied by getRootMessenger() and any init messenger that includes onboarding.
 */
export type MessengerWithOnboardingState = {
  call(action: 'OnboardingController:getState'): OnboardingControllerState;
  subscribe(
    topic: 'OnboardingController:stateChange',
    listener: (state: OnboardingControllerState) => void,
  ): void;
  unsubscribe(
    topic: 'OnboardingController:stateChange',
    listener: (state: OnboardingControllerState) => void,
  ): void;
};

/**
 * Creates a shared ensureOnboardingComplete function that resolves when
 * onboarding is complete. Uses a single subscription so multiple callers
 * do not register duplicate listeners.
 *
 * @param controllerMessenger - The controller messenger to call/subscribe (e.g. from getRootMessenger()).
 * @returns Function that resolves when onboarding has been completed.
 */
export function createEnsureOnboardingCompleteCallback(
  controllerMessenger: MessengerWithOnboardingState,
): () => Promise<void> {
  const resolvers: (() => void)[] = [];
  let listener: ((state: OnboardingControllerState) => void) | null = null;

  return function ensureOnboardingComplete(): Promise<void> {
    const state = controllerMessenger.call('OnboardingController:getState');
    if (state.completedOnboarding) {
      return Promise.resolve();
    }
    const { promise, resolve } = createDeferredPromise<void>();
    resolvers.push(resolve);
    if (listener === null) {
      const stateListener = (newState: OnboardingControllerState) => {
        if (newState.completedOnboarding) {
          controllerMessenger.unsubscribe(
            'OnboardingController:stateChange',
            stateListener,
          );
          listener = null;
          resolvers.forEach((r) => r());
          resolvers.length = 0;
        }
      };
      listener = stateListener;
      controllerMessenger.subscribe(
        'OnboardingController:stateChange',
        stateListener,
      );
    }
    return promise;
  };
}

type TokenDataParam = {
  name?: string;
  args?: { increment?: unknown; _value?: unknown };
};

export function getTokenValueParam(
  tokenData: TokenDataParam = {},
): string | undefined {
  if (tokenData?.name === TransactionType.tokenMethodIncreaseAllowance) {
    return tokenData?.args?.increment?.toString();
  }
  return tokenData?.args?._value?.toString();
}
