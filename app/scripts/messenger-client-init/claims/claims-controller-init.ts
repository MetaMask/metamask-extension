import {
  ClaimsController,
  ClaimsControllerMessenger,
} from '@metamask/claims-controller';
import { MessengerClientInitFunction } from '../types';
import { ClaimsControllerInitMessenger } from '../messengers/claims/claims-controller-messenger';

export const ClaimsControllerInit: MessengerClientInitFunction<
  ClaimsController,
  ClaimsControllerMessenger,
  ClaimsControllerInitMessenger
> = (request) => {
  const { controllerMessenger, persistedState } = request;
  const messengerClient = new ClaimsController({
    messenger: controllerMessenger,
    state: persistedState.ClaimsController,
  });
  return {
    messengerClient,
  };
};
