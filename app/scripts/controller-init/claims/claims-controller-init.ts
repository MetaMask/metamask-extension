import {
  ClaimsController,
  ClaimsControllerMessenger,
} from '@metamask/claims-controller';
import { ControllerInitFunction } from '../types';
import { ClaimsControllerInitMessenger } from '../messengers/claims/claims-controller-messenger';

export const ClaimsControllerInit: ControllerInitFunction<
  ClaimsController,
  ClaimsControllerMessenger,
  ClaimsControllerInitMessenger
> = (request) => {
  const { controllerMessenger, persistedState } = request;
  const controller = new ClaimsController({
    messenger: controllerMessenger,
    state: persistedState.ClaimsController,
  });
  return {
    controller,
  };
};
