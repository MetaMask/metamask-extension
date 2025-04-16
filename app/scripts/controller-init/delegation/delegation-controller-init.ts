import {
  DelegationController,
  DelegationControllerMessenger,
} from '@metamask/delegation-controller';
import {
  getDelegationHashOffchain,
  getDeleGatorEnvironment,
} from '@metamask/delegation-toolkit';
import { Hex, hexToNumber } from 'viem';
import { DelegationControllerInitMessenger } from '../messengers/delegation-controller-messenger';
import { ControllerInitFunction, ControllerInitResult } from '../types';

const getDelegationEnvironment = (chainId: Hex) => {
  return getDeleGatorEnvironment(hexToNumber(chainId));
};

export const DelegationControllerInit: ControllerInitFunction<
  DelegationController,
  DelegationControllerMessenger,
  DelegationControllerInitMessenger
> = ({ controllerMessenger, persistedState }) => {
  const controller = new DelegationController({
    messenger: controllerMessenger,
    state: persistedState.DelegationController,
    hashDelegation: getDelegationHashOffchain,
    getDelegationEnvironment,
  });

  const api = getApi(controller);

  return {
    controller,
    api,
  };
};

function getApi(
  controller: DelegationController,
): ControllerInitResult<DelegationController>['api'] {
  return {
    storeDelegation: controller.store.bind(controller),
    signDelegation: controller.signDelegation.bind(controller),
    retrieveDelegation: controller.retrieve.bind(controller),
    deleteDelegation: controller.delete.bind(controller),
  };
}
