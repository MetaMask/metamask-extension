import { MultichainAccountService } from '@metamask/multichain-account-service';
import { KeyringObject } from '@metamask/keyring-controller';
import { ControllerInitFunction } from '../types';
import { MultichainAccountServiceMessenger } from '../messengers/accounts';

/**
 * Initialize the multichain account service.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @returns The initialized service.
 */
export const MultichainAccountServiceInit: ControllerInitFunction<
  MultichainAccountService,
  MultichainAccountServiceMessenger
> = ({ controllerMessenger }) => {
  controllerMessenger.subscribe(
    'KeyringController:stateChange',
    (hdKeyring: KeyringObject | undefined) => {
      console.log('@@ HD keyrinh update', hdKeyring?.accounts);
    },
    (state) => {
      return state.keyrings[100];
    },
  );

  const controller = new MultichainAccountService({
    messenger: controllerMessenger,
  });

  return {
    memStateKey: null,
    persistedStateKey: null,
    controller,
  };
};
