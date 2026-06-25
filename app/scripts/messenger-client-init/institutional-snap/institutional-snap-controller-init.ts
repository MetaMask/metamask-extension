import { InstitutionalSnapController } from '../../controllers/institutional-snap/InstitutionalSnapController';
import type { InstitutionalSnapControllerMessenger } from '../../controllers/institutional-snap/InstitutionalSnapController';
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
