import {
  MOCK_ANY_NAMESPACE,
  Messenger,
  MockAnyNamespace,
} from '@metamask/messenger';

import { type OnboardingControllerState } from '../types/onboarding';
import { createEnsureOnboardingCompleteCallback } from './metamask-controller-utils';

/** Action/event types so the test messenger accepts OnboardingController actions and events. */
type TestOnboardingAction = {
  type: 'OnboardingController:getState';
  handler: () => OnboardingControllerState;
};
type TestOnboardingEvent = {
  type: 'OnboardingController:stateChange';
  payload: [OnboardingControllerState];
};

function createTestMessenger(): Messenger<
  MockAnyNamespace,
  TestOnboardingAction,
  TestOnboardingEvent
> {
  return new Messenger<
    MockAnyNamespace,
    TestOnboardingAction,
    TestOnboardingEvent
  >({ namespace: MOCK_ANY_NAMESPACE });
}

const COMPLETED_ONBOARDING_STATE: OnboardingControllerState = {
  seedPhraseBackedUp: null,
  firstTimeFlowType: null,
  completedOnboarding: true,
};

describe('createEnsureOnboardingCompleteCallback', () => {
  it('returns a function that resolves immediately when onboarding is already complete', async () => {
    const controllerMessenger = createTestMessenger();
    controllerMessenger.registerActionHandler(
      'OnboardingController:getState',
      jest.fn().mockReturnValue({ completedOnboarding: true }),
    );

    const ensureOnboardingComplete =
      createEnsureOnboardingCompleteCallback(controllerMessenger);
    const result = await ensureOnboardingComplete();

    expect(result).toBeUndefined();
  });

  it('returns a function that resolves when onboarding completes (stateChange)', async () => {
    const controllerMessenger = createTestMessenger();
    controllerMessenger.registerActionHandler(
      'OnboardingController:getState',
      jest.fn().mockReturnValue({ completedOnboarding: false }),
    );
    const subscribeSpy = jest.fn();
    const unsubscribeSpy = jest.fn();
    jest
      .spyOn(controllerMessenger, 'subscribe')
      .mockImplementation(((
        topic: string,
        listener: (state: OnboardingControllerState) => void,
      ) =>
        subscribeSpy(topic, listener)) as typeof controllerMessenger.subscribe);
    jest
      .spyOn(controllerMessenger, 'unsubscribe')
      .mockImplementation(((
        topic: string,
        listener: (state: OnboardingControllerState) => void,
      ) =>
        unsubscribeSpy(
          topic,
          listener,
        )) as typeof controllerMessenger.unsubscribe);

    const ensureOnboardingComplete =
      createEnsureOnboardingCompleteCallback(controllerMessenger);
    const promise = ensureOnboardingComplete();

    expect(subscribeSpy).toHaveBeenCalledWith(
      'OnboardingController:stateChange',
      expect.any(Function),
    );

    const listener = subscribeSpy.mock.calls[0][1] as (
      state: OnboardingControllerState,
    ) => void;
    listener(COMPLETED_ONBOARDING_STATE);

    await promise;
    expect(unsubscribeSpy).toHaveBeenCalledWith(
      'OnboardingController:stateChange',
      listener,
    );
  });

  it('uses a single subscription for multiple concurrent callers', async () => {
    const controllerMessenger = createTestMessenger();
    controllerMessenger.registerActionHandler(
      'OnboardingController:getState',
      jest.fn().mockReturnValue({ completedOnboarding: false }),
    );
    const subscribeSpy = jest.fn();
    jest
      .spyOn(controllerMessenger, 'subscribe')
      .mockImplementation(((
        topic: string,
        listener: (state: OnboardingControllerState) => void,
      ) =>
        subscribeSpy(topic, listener)) as typeof controllerMessenger.subscribe);
    jest
      .spyOn(controllerMessenger, 'unsubscribe')
      .mockImplementation(() => undefined);

    const ensureOnboardingComplete =
      createEnsureOnboardingCompleteCallback(controllerMessenger);

    const promise1 = ensureOnboardingComplete();
    const promise2 = ensureOnboardingComplete();
    const promise3 = ensureOnboardingComplete();

    expect(subscribeSpy).toHaveBeenCalledTimes(1);

    const listener = subscribeSpy.mock.calls[0][1] as (
      state: OnboardingControllerState,
    ) => void;
    listener(COMPLETED_ONBOARDING_STATE);

    await Promise.all([promise1, promise2, promise3]);
  });
});
