import { MultichainAccountService } from '@metamask/multichain-account-service';
import { ControllerInitFunction } from '../types';
import {
  MultichainAccountServiceMessenger,
  MultichainAccountServiceInitMessenger,
} from '../messengers/accounts';
import { previousValueComparator } from '../../lib/util';

/**
 * Initialize the multichain account service.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.initMessenger - The messenger to use for initialization.
 * @returns The initialized service.
 */
export const MultichainAccountServiceInit: ControllerInitFunction<
  MultichainAccountService,
  MultichainAccountServiceMessenger,
  MultichainAccountServiceInitMessenger
> = ({ controllerMessenger, initMessenger }) => {
  const controller = new MultichainAccountService({
    messenger: controllerMessenger,
  });

  const preferencesState = initMessenger.call('PreferencesController:getState');

  initMessenger.subscribe(
    'PreferencesController:stateChange',
    previousValueComparator((prevState, currState) => {
      const { useExternalServices: prevUseExternalServices } = prevState;
      const { useExternalServices: currUseExternalServices } = currState;
      if (prevUseExternalServices !== currUseExternalServices) {
        // Set basic functionality and trigger alignment when enabled
        // This single call handles both provider disable/enable and alignment.
        controller
          .setBasicFunctionality(currUseExternalServices)
          .catch((error) => {
            console.error(
              'Failed to set basic functionality on MultichainAccountService:',
              error,
            );
          });
      }

      return true;
    }, preferencesState),
  );

  return {
    memStateKey: null,
    persistedStateKey: null,
    controller,
  };
};
