import {
  DelegationController,
  DelegationControllerMessenger,
} from '@metamask/delegation-controller';
import { DelegationControllerInitMessenger } from '../messengers/delegation-controller-messenger';
import { ControllerInitFunction, ControllerInitResult } from '../types';

export const DelegationControllerInit: ControllerInitFunction<
  DelegationController,
  DelegationControllerMessenger,
  DelegationControllerInitMessenger
> = ({ controllerMessenger, persistedState }) => {
  const controller = new DelegationController({
    messenger: controllerMessenger,
    state: persistedState.DelegationController,
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
    signDelegation: controller.sign.bind(controller),
    retrieveDelegation: controller.retrieve.bind(controller),
    deleteDelegation: controller.delete.bind(controller),
  };
}
