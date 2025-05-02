import {
  DelegationController,
  DelegationControllerMessenger,
} from '@metamask/delegation-controller';
import { type Hex } from '../../../../shared/lib/delegation/utils';
import {
  getDelegationHashOffchain,
  getDeleGatorEnvironment,
} from '../../../../shared/lib/delegation';
import { DelegationControllerInitMessenger } from '../messengers/delegation/delegation-controller-messenger';
import { ControllerInitFunction, ControllerInitResult } from '../types';
import { handleRevokeConfirmation } from '../../lib/delegation/events';

const getDelegationEnvironment = (chainId: Hex) => {
  return getDeleGatorEnvironment(Number(chainId));
};

/**
 * Initialize the Delegation controller.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.persistedState - The persisted state of the extension.
 * @param request.initMessenger - The initialization messenger for the controller.
 * @returns The initialized controller.
 */
export const DelegationControllerInit: ControllerInitFunction<
  DelegationController,
  DelegationControllerMessenger,
  DelegationControllerInitMessenger
> = ({ controllerMessenger, persistedState, initMessenger }) => {
  const controller = new DelegationController({
    messenger: controllerMessenger,
    state: persistedState.DelegationController,
    hashDelegation: getDelegationHashOffchain,
    getDelegationEnvironment,
  });

  const api = getApi(controller);

  setupListeners(initMessenger, controller);

  return {
    controller,
    api,
  };
};

/**
 * Get the API for the Delegation controller.
 *
 * @param controller - The controller to get the API for.
 * @returns The API for the Delegation controller.
 */
function getApi(
  controller: DelegationController,
): ControllerInitResult<DelegationController>['api'] {
  return {
    signDelegation: controller.signDelegation.bind(controller),
    storeDelegationEntry: controller.store.bind(controller),
    listDelegationEntries: controller.list.bind(controller),
    getDelegationEntry: controller.retrieve.bind(controller),
    getDelegationEntryChain: controller.chain.bind(controller),
    deleteDelegationEntry: controller.delete.bind(controller),
  };
}

/**
 * Setup listeners for the Delegation controller.
 *
 * @param initMessenger - The initialization messenger for the controller.
 * @param controller - The DelegationController.
 */
function setupListeners(
  initMessenger: DelegationControllerInitMessenger,
  controller: DelegationController,
) {
  initMessenger.subscribe(
    'TransactionController:transactionConfirmed',
    (transactionMeta) =>
      handleRevokeConfirmation({ transactionMeta }, controller),
  );
}
