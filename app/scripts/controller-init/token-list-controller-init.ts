import { TokenListController } from '@metamask/assets-controllers';
import { previousValueComparator } from '../lib/util';
import { PreferencesControllerState } from '../controllers/preferences-controller';
import { ControllerInitFunction } from './types';
import {
  TokenListControllerMessenger,
  TokenListControllerInitMessenger,
} from './messengers';
import { getGlobalChainId } from './init-utils';

export const TokenListControllerInit: ControllerInitFunction<
  TokenListController,
  TokenListControllerMessenger,
  TokenListControllerInitMessenger
> = ({ controllerMessenger, initMessenger, persistedState }) => {
  const preferencesControllerState = initMessenger.call(
    'PreferencesController:getState',
  );

  /**
   * Determine whether token list polling is required based on the provided
   * state of the preferences controller.
   *
   * @param state - The state of the preferences controller to check.
   * @returns Whether token list polling is required.
   */
  const isTokenListPollingRequired = (state?: PreferencesControllerState) => {
    const { useTokenDetection, useTransactionSimulations, preferences } =
      state ?? {};

    const { petnamesEnabled } = preferences ?? {};
    return useTokenDetection || petnamesEnabled || useTransactionSimulations;
  };

  const controller = new TokenListController({
    messenger: controllerMessenger,
    state: persistedState.TokenListController,
    preventPollingOnNetworkRestart: !isTokenListPollingRequired(
      preferencesControllerState,
    ),
    chainId: getGlobalChainId(initMessenger),
  });

  /**
   * Enable or disable token list polling based on whether any feature that
   * requires it is enabled.
   *
   * @param currentState - The current state of the preferences controller to
   * check.
   * @param previousState - The previous state of the preferences controller to
   * check.
   */
  const checkTokenListPolling = (
    currentState: PreferencesControllerState,
    previousState: PreferencesControllerState,
  ) => {
    const previousEnabled = isTokenListPollingRequired(previousState);
    const newEnabled = isTokenListPollingRequired(currentState);

    if (previousEnabled === newEnabled) {
      return;
    }

    controller.updatePreventPollingOnNetworkRestart(!newEnabled);
  };

  initMessenger.subscribe(
    'PreferencesController:stateChange',
    previousValueComparator((previousState, currentState) => {
      checkTokenListPolling(currentState, previousState);
      return true;
    }, preferencesControllerState),
  );

  return {
    controller,
  };
};
