import {
  DataDeletionService,
  DataDeletionServiceMessenger,
} from '../services/data-deletion-service';
import { MessengerClientInitFunction } from './types';

export const DataDeletionServiceInit: MessengerClientInitFunction<
  DataDeletionService,
  DataDeletionServiceMessenger
> = ({ controllerMessenger }) => {
  const messengerClient = new DataDeletionService({
    messenger: controllerMessenger,
  });

  return {
    messengerClient,
    memStateKey: null,
    persistedStateKey: null,
  };
};
