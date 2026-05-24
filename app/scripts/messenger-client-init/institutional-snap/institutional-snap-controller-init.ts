import { InstitutionalSnapController } from '../../controllers/institutional-snap/InstitutionalSnapController';
import { InstitutionalSnapControllerMessenger } from '../messengers/accounts/institutional-snap-controller-messenger';
import { MessengerClientInitFunction } from '../types';

export const InstitutionalSnapControllerInit: MessengerClientInitFunction<
  InstitutionalSnapController,
  InstitutionalSnapControllerMessenger
> = (request) => {
  const messengerClient = new InstitutionalSnapController({
    messenger: request.controllerMessenger,
  });

  return {
    messengerClient,
    persistedStateKey: null,
  };
};
