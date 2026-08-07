import {
  CodefiTokenPricesServiceV2,
  TokenRatesController,
  TokenRatesControllerMessenger,
} from '@metamask/assets-controllers';
import { MessengerClientInitFunction } from '../types';
import { TokenRatesControllerInitMessenger } from '../messengers/assets';
import type { OnboardingControllerState } from '../../controllers/onboarding';
import { previousValueComparator } from '../../lib/util';

/**
 * Initialize the Token Rates controller.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.persistedState - The persisted state of the extension.
 * @returns The initialized controller.
 */
export const TokenRatesControllerInit: MessengerClientInitFunction<
  TokenRatesController,
  TokenRatesControllerMessenger,
  TokenRatesControllerInitMessenger
> = (request) => {
  const { controllerMessenger, initMessenger, persistedState } = request;
  const preferencesState = initMessenger.call('PreferencesController:getState');
  const { completedOnboarding } = initMessenger.call(
    'OnboardingController:getState',
  );

  const messengerClient = new TokenRatesController({
    messenger: controllerMessenger,
    state: persistedState.TokenRatesController,
    tokenPricesService: new CodefiTokenPricesServiceV2(),
    // Keep the controller disabled until onboarding has completed: while
    // enabled it fetches token prices in response to
    // `TokensController:stateChange` events, and during onboarding the user
    // has not yet confirmed the basic functionality preference. This mirrors
    // the `completedOnboarding` gating in the UI polling hooks
    // (see `useTokenRatesPolling`).
    disabled: !preferencesState.useCurrencyRateCheck || !completedOnboarding,
  });

  const updateEnabledState = () => {
    const { useCurrencyRateCheck } = initMessenger.call(
      'PreferencesController:getState',
    );
    const { completedOnboarding: isOnboardingCompleted } = initMessenger.call(
      'OnboardingController:getState',
    );
    if (useCurrencyRateCheck && isOnboardingCompleted) {
      messengerClient.enable();
    } else {
      messengerClient.disable();
    }
  };

  initMessenger.subscribe(
    'PreferencesController:stateChange',
    previousValueComparator((prevState, currState) => {
      const { useCurrencyRateCheck: prevUseCurrencyRateCheck } = prevState;
      const { useCurrencyRateCheck: currUseCurrencyRateCheck } = currState;
      if (currUseCurrencyRateCheck !== prevUseCurrencyRateCheck) {
        updateEnabledState();
      }

      return true;
    }, preferencesState),
  );

  // When onboarding completes, re-evaluate the enabled state so price
  // requests start (or stay stopped) based on the preference the user chose
  // during onboarding.
  initMessenger.subscribe(
    'OnboardingController:stateChange',
    (isOnboardingCompleted: boolean) => {
      if (isOnboardingCompleted) {
        updateEnabledState();
      }
    },
    (state: OnboardingControllerState) => state.completedOnboarding,
  );

  return {
    messengerClient,
  };
};
